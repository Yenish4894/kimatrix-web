import axios, { type InternalAxiosRequestConfig, AxiosError } from "axios";
import { TokenStorage } from "./tokens";
import { env } from "./env";

const API_BASE_URL = env.apiBaseUrl;

// Event for "session invalidated — force logout" — components listen and redirect
const SESSION_INVALIDATED_EVENT = "kimates:session-invalidated";

export function onSessionInvalidated(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SESSION_INVALIDATED_EVENT, handler);
  return () => window.removeEventListener(SESSION_INVALIDATED_EVENT, handler);
}

function emitSessionInvalidated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_INVALIDATED_EVENT));
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000, // 30s — generous for slow networks in target region
});

// ─── Request interceptor — attach Bearer ──────────────────
api.interceptors.request.use((config) => {
  const token = TokenStorage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Refresh token rotation + theft detection ─────────────
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(token: string | null, error: unknown = null) {
  pendingQueue.forEach((p) => {
    if (token) p.resolve(token);
    else p.reject(error);
  });
  pendingQueue = [];
}

async function refreshTokens(): Promise<string> {
  const refreshToken = TokenStorage.getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token available");

  // Use a bare axios call to avoid recursive interceptor loop
  const { data } = await axios.post(
    `${API_BASE_URL}/api/auth/refresh`,
    { refreshToken },
    { headers: { "Content-Type": "application/json" } }
  );

  const tokens = data?.data?.tokens;
  if (!tokens?.accessToken || !tokens?.refreshToken) {
    throw new Error("Invalid refresh response");
  }

  TokenStorage.setTokens(tokens);
  return tokens.accessToken as string;
}

// ─── Response interceptor ─────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest || !error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const data = error.response.data as
      | { message?: string; error?: string }
      | undefined;

    // 401 handling — attempt refresh exactly ONCE per request
    if (status === 401 && !originalRequest._retry) {
      // Public auth endpoints issue their own 401s (wrong credentials, bad token).
      // Never attempt a token refresh for these — pass the error straight through.
      const isPublicAuthEndpoint =
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register") ||
        originalRequest.url?.includes("/auth/password-reset") ||
        originalRequest.url?.includes("/auth/refresh");

      if (isPublicAuthEndpoint) {
        // Theft detection: only relevant on the refresh endpoint
        if (
          originalRequest.url?.includes("/auth/refresh") &&
          data?.message &&
          /session\s+invalidated/i.test(data.message)
        ) {
          TokenStorage.clear();
          emitSessionInvalidated();
        }
        return Promise.reject(error);
      }

      // Queue concurrent 401s until refresh completes
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshTokens();
        flushQueue(newAccessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        flushQueue(null, refreshErr);
        TokenStorage.clear();
        // Any refresh failure → hard logout (covers both theft detection + expiry)
        emitSessionInvalidated();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
