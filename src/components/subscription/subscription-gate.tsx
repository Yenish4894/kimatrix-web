"use client";

import { usePathname } from "next/navigation";
import { LockedShell } from "@/components/subscription/locked-shell";
import { PaywallModal } from "@/components/subscription/paywall-modal";
import { DeactivatedNotice } from "@/components/subscription/deactivated-notice";
import { decideGate } from "@/lib/entitlement";
import type { Entitlement } from "@/lib/entitlement";

const BILLING_PREFIX = "/company/billing";

export function isBillingRoute(pathname: string): boolean {
  return pathname === BILLING_PREFIX || pathname.startsWith(`${BILLING_PREFIX}/`);
}

interface SubscriptionGateProps {
  entitlement: Entitlement;
  companyName?: string;
  /** Lets the paywall offer a confirmation resend instead of demanding payment. */
  emailVerified?: boolean;
  children: React.ReactNode;
}

/**
 * Decides what a company sees based on its entitlement.
 *
 * Replaces the previous blanket `router.replace("/company/billing")`, which had two
 * problems. It threw the customer out of whatever page they were on with no
 * explanation, and — because the redirect fired from an effect after the page had
 * already mounted — the page's queries fired first and 403'd on the way out.
 *
 * Order matters here:
 *
 *  1. **Billing routes always pass through.** A customer who cannot reach the payment
 *     page cannot pay, and rendering a paywall on top of the payment page is a loop.
 *  2. **Deactivated** gets its own notice, not the paywall — see DeactivatedNotice.
 *  3. **hasAccess** renders the real page. This includes trialing and comped.
 *  4. Everything else gets the skeleton plus the blocking paywall.
 */
export function SubscriptionGate({
  entitlement,
  companyName,
  emailVerified,
  children,
}: Readonly<SubscriptionGateProps>) {
  const pathname = usePathname();

  const decision = decideGate(entitlement, pathname);

  if (decision === "children") return <>{children}</>;

  if (decision === "deactivated-notice") {
    return <DeactivatedNotice {...(companyName ? { companyName } : {})} />;
  }

  return (
    <>
      <LockedShell />
      <PaywallModal
        entitlement={entitlement}
        {...(companyName ? { companyName } : {})}
        {...(emailVerified !== undefined ? { emailVerified } : {})}
      />
    </>
  );
}
