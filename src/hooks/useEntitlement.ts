"use client";

import { useEffect, useMemo, useState } from "react";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import { MINUTE, formatCountdown, toEntitlement } from "@/lib/entitlement";
import type { Countdown, Entitlement } from "@/lib/entitlement";
import type { CompanyProfile } from "@/types";

// The decision logic itself lives in `@/lib/entitlement` — pure, React-free, and
// therefore testable without mounting a provider tree. This file is only the wiring.
export { toEntitlement, formatCountdown };
export type { Countdown, Entitlement };

export function useEntitlement(): {
  entitlement: Entitlement | null;
  profile: CompanyProfile | undefined;
  isLoading: boolean;
  error: unknown;
} {
  const { data: profile, isLoading, error, refetch } = useCompanyProfile();

  const entitlement = useMemo(() => (profile ? toEntitlement(profile) : null), [profile]);

  // A device that sleeps through the expiry boundary must wake into the paywall, not
  // into a stale "2 hours left". Nothing else re-checks: TanStack's refetch-on-focus
  // does not fire for a tab that was never blurred, only minimised with the lid.
  useEffect(() => {
    const onVisible = (): void => {
      if (document.visibilityState === "visible") void refetch();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refetch]);

  return { entitlement, profile, isLoading, error };
}

/**
 * Live countdown to a deadline.
 *
 * Ticks once a minute rather than once a second: the label's finest unit is minutes, so
 * a per-second interval would re-render the subtree sixty times per visible change.
 */
export function useCountdown(deadline: Date | null): Countdown | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;
    const id = window.setInterval(() => setNow(Date.now()), MINUTE);
    // Recompute immediately on wake — the interval does not fire while the tab is
    // suspended, so without this the label stays frozen at whatever it was when the
    // laptop lid closed.
    const onVisible = (): void => {
      if (document.visibilityState === "visible") setNow(Date.now());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [deadline]);

  return useMemo(
    () => (deadline ? formatCountdown(deadline.getTime() - now) : null),
    [deadline, now],
  );
}
