"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadSession } from "@/store/slices/authSlice";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import { PageLoader } from "@/components/ui/loader";
import { QueryErrorState } from "@/components/ui";
import { parseApiError } from "@/lib/errors";
import type { CompanyProfile } from "@/types";

// Routes always accessible regardless of subscription status
const BILLING_PREFIX = "/company/billing";
function isBillingRoute(pathname: string) {
  return pathname === BILLING_PREFIX || pathname.startsWith(BILLING_PREFIX + "/");
}

// Access is decided server-side and delivered as `profile.hasAccess`.
//
// This deliberately no longer derives status from `subscriptionExpiresAt`. That check
// treated a null expiry as "locked out" while the backend treated it as "admin comp —
// allowed", so comped companies were bounced to billing forever while their API calls
// succeeded. It also trusted the client's clock. One server-computed boolean now.
//
// The fallback exists only for the deploy window where this may run against the
// previous backend. Once the backend release has shipped, this collapses to
// `profile.hasAccess` and the legacy branch goes away.
function resolveHasAccess(profile: CompanyProfile): boolean {
  if (typeof profile.hasAccess === "boolean") return profile.hasAccess;
  const expiresAt = profile.subscriptionExpiresAt;
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > Date.now();
}

export default function CompanyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const { isAuthenticated, isLoading: authLoading } = useAppSelector((state) => state.auth);

  const [sessionChecked, setSessionChecked] = useState(false);
  const [gatePassed, setGatePassed] = useState(false);

  // Restore session from localStorage once.
  useEffect(() => {
    dispatch(loadSession()).finally(() => setSessionChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The SAME query the pages use — one fetch, one cache, one invalidation surface.
  //
  // Note this is no longer skipped on billing routes. Skipping the fetch there meant
  // `/company/billing` always rendered with a null profile on every real entry path
  // (the gate redirect, the PayPal cancel return, a reload), so its "Current
  // Subscription" card never appeared and an expired customer was shown the neutral
  // "Manage your subscription" copy instead of an expiry warning. Only the *redirect*
  // is skipped on billing routes; the fetch always runs.
  const { data: profile, isLoading: isLoadingProfile, error } = useCompanyProfile();
  const profileErrorStatus = error ? parseApiError(error).status : null;

  useEffect(() => {
    if (!sessionChecked) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // Billing routes are always reachable — no subscription required to pay.
    if (isBillingRoute(pathname)) {
      setGatePassed(true);
      return;
    }

    // Only an authorization failure means "not subscribed". Treating every failure as
    // one told customers with an active paid subscription to pay again — a 500, a CORS
    // failure, an offline device or a timeout all landed on "Choose a Plan".
    if (
      profileErrorStatus === 401 ||
      profileErrorStatus === 402 ||
      profileErrorStatus === 403
    ) {
      router.replace("/company/billing");
      return;
    }
    // Anything else is transient — fall through to the retryable error state below.
    if (profileErrorStatus !== null) return;

    // Still waiting — keep showing the loader.
    if (isLoadingProfile || !profile) return;

    if (!resolveHasAccess(profile)) {
      router.replace("/company/billing");
      return;
    }

    setGatePassed(true);
  }, [
    sessionChecked,
    isAuthenticated,
    isLoadingProfile,
    profile,
    profileErrorStatus,
    pathname,
    router,
  ]);

  // A transient failure gets an explicit, retryable error rather than a silent
  // redirect to the payment page.
  if (
    profileErrorStatus !== null &&
    profileErrorStatus !== 401 &&
    profileErrorStatus !== 402 &&
    profileErrorStatus !== 403 &&
    !isBillingRoute(pathname)
  ) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <QueryErrorState error={error} resource="your account" />
        </div>
      </div>
    );
  }

  if (!sessionChecked || authLoading || !gatePassed) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
