"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadSession, setCompanyIsActive } from "@/store/slices/authSlice";
import { fetchCompanyProfile } from "@/store/slices/companySlice";
import { PageLoader } from "@/components/ui/loader";

// Routes always accessible regardless of subscription status
const BILLING_PREFIX = "/company/billing";
function isBillingRoute(pathname: string) {
  return pathname === BILLING_PREFIX || pathname.startsWith(BILLING_PREFIX + "/");
}

function isSubscriptionActive(expiresAt: string | null | undefined): boolean {
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
  const { profile, isLoadingProfile, profileFetchFailed } = useAppSelector(
    (state) => state.company
  );

  const [sessionChecked, setSessionChecked] = useState(false);
  const [gatePassed, setGatePassed] = useState(false);

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
    if (profileFetchFailed) {
      // Profile couldn't load — a still-pending company is blocked from
      // /company/* by the backend, so this is the expected "not subscribed" path.
      router.replace("/company/billing");
      return;
    }

    // Still waiting for the profile — keep showing the loader.
    if (isLoadingProfile || !profile) return;

    if (!isSubscriptionActive(profile.subscriptionExpiresAt)) {
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
    profileFetchFailed,
    pathname,
    router,
    dispatch,
  ]);

  if (!sessionChecked || authLoading || !gatePassed) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
