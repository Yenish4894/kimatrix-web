import { publicApi } from "@/lib/api";

/**
 * Landing-page visit counting.
 *
 * Kept out of `admin.service` on purpose: the landing page is the most-visited route,
 * and importing the admin service there would pull every admin call into its bundle
 * for the sake of one POST.
 */

const VISIT_FLAG = "kimates.visit-recorded";

export const metricsService = {
  // POST /api/metrics/visit — public, no body, 204.
  // Through `publicApi`: a visitor has no session, and a signed-in owner opening the
  // home page with an expired token must not be bounced through the refresh/logout
  // handling for the sake of a counter.
  recordVisit: async (): Promise<void> => {
    await publicApi.post("/metrics/visit");
  },
};

/**
 * Counts this browser session once. Every failure is swallowed: a visitor counter
 * must never be the reason the landing page misbehaves.
 *
 * The flag is written BEFORE the request. React's StrictMode runs the mount effect
 * twice in development, and so does a fast back/forward; writing the flag after the
 * response would let both calls through and count one visit as two. The cost is that a
 * failed request is not retried this session, which is the right trade for a metric.
 */
export function recordLandingVisitOnce(): void {
  try {
    if (typeof window === "undefined") return;
    // sessionStorage throws in some private modes and when storage is disabled.
    if (window.sessionStorage.getItem(VISIT_FLAG)) return;
    window.sessionStorage.setItem(VISIT_FLAG, "1");
  } catch {
    return;
  }
  metricsService.recordVisit().catch(() => {});
}
