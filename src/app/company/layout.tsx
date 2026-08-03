"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadSession, setCompanyIsActive } from "@/store/slices/authSlice";
import { fetchCompanyProfile } from "@/store/slices/companySlice";
import { PageLoader } from "@/components/ui/loader";
import { QueryErrorState } from "@/components/ui";
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

  const { isAuthenticated, isLoading: authLoading, companyIsActive } = useAppSelector(
    (state) => state.auth
  );
  const { profile, isLoadingProfile, profileErrorStatus } = useAppSelector(
    (state) => state.company
  );

  const [sessionChecked, setSessionChecked] = useState(false);
  const [gatePassed, setGatePassed] = useState(false);
  const [gateError, setGateError] = useState(false);

  // Step 1: restore session from localStorage once
  useEffect(() => {
    dispatch(loadSession()).finally(() => setSessionChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2: once authenticated, fetch company profile for subscription gate.
  // `pathname` is included so that navigating away from a billing page (where
  // the fetch is skipped) to a non-billing page correctly triggers the fetch.
  useEffect(() => {
    if (!sessionChecked || !isAuthenticated) return;
    if (isBillingRoute(pathname)) return; // billing pages bypass the gate
    if (profile || isLoadingProfile) return; // already have it or fetching
    dispatch(fetchCompanyProfile());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionChecked, isAuthenticated, pathname]);

  // Step 3: evaluate the gate
  useEffect(() => {
    if (!sessionChecked) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // Billing routes are always accessible — no subscription required
    if (isBillingRoute(pathname)) {
      setGatePassed(true);
      return;
    }

    // The REAL subscription state (from the profile) is the source of truth.
    // We must NOT gate on the cached `companyIsActive` flag alone — it can be
    // stale after activation (paid this session, activated via webhook/admin,
    // or logged in before paying). Wait for the profile, then decide.
    // Only an authorization failure means "not subscribed". `profileFetchFailed`
    // alone also covers 500s, CORS failures, offline devices and the request timeout —
    // sending those to the billing page told customers with an active paid
    // subscription to pay again, with no error and no retry. Some of them would.
    if (profileErrorStatus === 401 || profileErrorStatus === 402 || profileErrorStatus === 403) {
      router.replace("/company/billing");
      return;
    }
    if (profileErrorStatus !== null) {
      // Anything else is a transient failure — render a retry instead of redirecting.
      setGateError(true);
      return;
    }

    // Still waiting for the profile — keep showing the loader.
    if (isLoadingProfile || !profile) return;

    if (!resolveHasAccess(profile)) {
      router.replace("/company/billing");
      return;
    }

    // Active subscription confirmed — sync the cached flag if it drifted so the
    // sidebar / plan-status widgets reflect reality.
    if (companyIsActive !== true) {
      dispatch(setCompanyIsActive(true));
    }
    setGatePassed(true);
  }, [
    sessionChecked,
    isAuthenticated,
    companyIsActive,
    isLoadingProfile,
    profile,
    profileErrorStatus,
    pathname,
    router,
    dispatch,
  ]);

  // A transient failure gets an explicit, retryable error rather than a silent
  // redirect to the payment page.
  if (gateError) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <QueryErrorState
            error={null}
            resource="your account"
            onRetry={() => {
              setGateError(false);
              void dispatch(fetchCompanyProfile());
            }}
          />
        </div>
      </div>
    );
  }

  if (!sessionChecked || authLoading || !gatePassed) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
