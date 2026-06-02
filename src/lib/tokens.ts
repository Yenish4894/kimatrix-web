// Token storage. Backend uses Bearer tokens (not cookies), so we persist in
// localStorage. Refresh rotation + theft detection on the backend limits damage
// if a token is stolen via XSS. We have no dangerouslySetInnerHTML anywhere.

import type { AuthTokens, AuthUser } from "@/types";

const KEYS = {
  ACCESS_TOKEN: "kimates.accessToken",
  ACCESS_EXPIRY: "kimates.accessTokenExpiresAt",
  REFRESH_TOKEN: "kimates.refreshToken",
  REFRESH_EXPIRY: "kimates.refreshTokenExpiresAt",
  USER: "kimates.user",
  COMPANY_ID: "kimates.companyId",
  COMPANY_IS_ACTIVE: "kimates.companyIsActive",
} as const;

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export const TokenStorage = {
  setTokens(tokens: AuthTokens) {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(KEYS.ACCESS_TOKEN, tokens.accessToken);
      localStorage.setItem(KEYS.ACCESS_EXPIRY, tokens.accessTokenExpiresAt);
      localStorage.setItem(KEYS.REFRESH_TOKEN, tokens.refreshToken);
      localStorage.setItem(KEYS.REFRESH_EXPIRY, tokens.refreshTokenExpiresAt);
    } catch {
      /* quota full or blocked — ignore */
    }
  },

  getAccessToken(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
  },

  getRefreshToken(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
  },

  getTokens(): AuthTokens | null {
    if (!isBrowser()) return null;
    const accessToken = localStorage.getItem(KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(KEYS.REFRESH_TOKEN);
    const accessTokenExpiresAt = localStorage.getItem(KEYS.ACCESS_EXPIRY);
    const refreshTokenExpiresAt = localStorage.getItem(KEYS.REFRESH_EXPIRY);
    if (!accessToken || !refreshToken || !accessTokenExpiresAt || !refreshTokenExpiresAt) {
      return null;
    }
    return { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt };
  },

  setUser(user: AuthUser, companyId: string | null) {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
      if (companyId) {
        localStorage.setItem(KEYS.COMPANY_ID, companyId);
      } else {
        localStorage.removeItem(KEYS.COMPANY_ID);
      }
    } catch {
      /* ignore */
    }
  },

  getUser(): AuthUser | null {
    if (!isBrowser()) return null;
    const raw = localStorage.getItem(KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  getCompanyId(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(KEYS.COMPANY_ID);
  },

  setCompanyIsActive(isActive: boolean | null) {
    if (!isBrowser()) return;
    try {
      if (isActive === null) {
        localStorage.removeItem(KEYS.COMPANY_IS_ACTIVE);
      } else {
        localStorage.setItem(KEYS.COMPANY_IS_ACTIVE, String(isActive));
      }
    } catch {
      /* ignore */
    }
  },

  getCompanyIsActive(): boolean | null {
    if (!isBrowser()) return null;
    const raw = localStorage.getItem(KEYS.COMPANY_IS_ACTIVE);
    if (raw === null) return null;
    return raw === "true";
  },

  clear() {
    if (!isBrowser()) return;
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
