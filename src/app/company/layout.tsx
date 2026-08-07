"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadSession } from "@/store/slices/authSlice";
import { useEntitlement } from "@/hooks/useEntitlement";
import { PageLoader } from "@/components/ui/loader";
import { QueryErrorState } from "@/components/ui";
import { parseApiError } from "@/lib/errors";
import { SubscriptionGate, isBillingRoute } from "@/components/subscription/subscription-gate";

export default function CompanyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const { isAuthenticated, isLoading: authLoading } = useAppSelector((state) => state.auth);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Restore session from localStorage once.
  useEffect(() => {
    dispatch(loadSession()).finally(() => setSessionChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The SAME query the pages use — one fetch, one cache, one invalidation surface.
  //
  // Not skipped on billing routes. Skipping the fetch there meant `/company/billing`
  // always rendered with a null profile on every real entry path (the gate, the PayPal
  // cancel return, a reload), so its "Current Subscription" card never appeared and an
  // expired customer saw neutral "Manage your subscription" copy instead of a warning.
  const { entitlement, profile, isLoading: isLoadingProfile, error } = useEntitlement();
  const profileErrorStatus = error ? parseApiError(error).status : null;

  // Authentication is still a redirect — an unauthenticated visitor has no company
  // context to render anything about. Subscription state is NOT a redirect any more:
  // that is the gate's job and it renders in place. The old blanket
  // `router.replace("/company/billing")` threw the customer out of whatever page they
  // were on with no explanation, and because it fired from an effect after mount, the
  // page's queries had already gone out and 403'd on the way.
  useEffect(() => {
    if (!sessionChecked) return;
    if (!isAuthenticated) router.replace("/login");
  }, [sessionChecked, isAuthenticated, router]);

  // Only an authorization failure means "not subscribed". Treating every failure as one
  // told customers with an active paid subscription to pay again — a 500, a CORS
  // failure, an offline device or a timeout all landed on "Choose a Plan". Anything
  // that is not a 401/402/403 gets an explicit, retryable error instead.
  const isAuthFailure =
    profileErrorStatus === 401 || profileErrorStatus === 402 || profileErrorStatus === 403;

  if (profileErrorStatus !== null && !isAuthFailure && !isBillingRoute(pathname)) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <QueryErrorState error={error} resource="your account" />
        </div>
      </div>
    );
  }

  if (!sessionChecked || authLoading || !isAuthenticated) {
    return <PageLoader />;
  }

  // Billing stays reachable even when the profile request itself failed with a 403 —
  // that is precisely the customer who needs to pay.
  if (isBillingRoute(pathname) && (isAuthFailure || !entitlement)) {
    return <>{children}</>;
  }

  if (isLoadingProfile || !entitlement) {
    return <PageLoader />;
  }

  return (
    <SubscriptionGate
      entitlement={entitlement}
      {...(profile?.name ? { companyName: profile.name } : {})}
      {...(profile?.emailVerified !== undefined ? { emailVerified: profile.emailVerified } : {})}
    >
      {children}
    </SubscriptionGate>
  );
}
