/**
 * Environment variable validation. Runs at module import time on both client
 * and server. Fails loudly in production if required vars are missing —
 * better than silently pointing at localhost or returning undefined.
 *
 * NEXT_PUBLIC_* vars are inlined at build time, so a missing one shows up at
 * build, not at runtime. Non-public vars (server-only) are only available in
 * server components / API routes — currently we don't use any, but the
 * scaffolding is here.
 */

interface PublicEnv {
  /** Backend API base URL (must include scheme, no trailing slash) */
  apiBaseUrl: string;
  /** True when running in production build */
  isProd: boolean;
}

function readPublic(): PublicEnv {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const nodeEnv = process.env.NODE_ENV;
  const isProd = nodeEnv === "production";

  if (!apiBaseUrl) {
    if (isProd) {
      // In prod, refuse to boot. Fail-fast beats pointing at localhost.
      throw new Error(
        "Missing required env var: NEXT_PUBLIC_API_BASE_URL. " +
          "Set it in your deployment environment (e.g. https://api.kimates.com)."
      );
    }
    // Dev fallback — log a warning so the developer knows.
    if (typeof window === "undefined") {
      // Server-side warning only (avoid noisy console in dev browser).
       
      console.warn(
        "[env] NEXT_PUBLIC_API_BASE_URL not set — defaulting to http://localhost:5000"
      );
    }
  }

  const value = apiBaseUrl ?? "http://localhost:5000";

  // Trim trailing slash so callers can do `${apiBaseUrl}/api/...` cleanly
  const normalized = value.replace(/\/+$/, "");

  // Sanity: must look like a URL
  try {
    new URL(normalized);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_API_BASE_URL: ${value}. Expected a valid URL like https://api.kimates.com`
    );
  }

  return { apiBaseUrl: normalized, isProd };
}

export const env: PublicEnv = readPublic();
