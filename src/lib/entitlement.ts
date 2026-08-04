import type { CompanyProfile, SubscriptionStatus } from "@/types";

/**
 * The pure half of entitlement handling — no React, no network, only type imports.
 *
 * Split out of `useEntitlement` so this logic can be exercised on its own. It is the
 * part that decides what a paying customer sees, and it was previously only reachable
 * by mounting a component inside a provider tree.
 */

export interface Entitlement {
  status: SubscriptionStatus;
  /** The only thing a route gate should read. Server-computed. */
  hasAccess: boolean;
  isTrial: boolean;
  isComped: boolean;
  /** Export survives expiry — false only for a deactivated account. */
  canExport: boolean;
  /** When access lapses. `null` = perpetual comp, or nothing started yet. */
  accessUntil: Date | null;
}

/**
 * Normalises a profile into the shape the UI needs.
 *
 * The fallbacks exist only for the deploy window in which this frontend may run against
 * the previous backend, which returned none of these fields. Once the backend release
 * has shipped they can go and this collapses to a straight read.
 *
 * Note what is deliberately NOT here: any re-derivation of access from a date when the
 * server has given us an answer. The client's clock is not authoritative, and the old
 * `subscriptionExpiresAt > Date.now()` check disagreed with the backend about what a
 * null expiry meant — comped companies were bounced to billing forever while their API
 * calls succeeded.
 */
export function toEntitlement(profile: CompanyProfile, now: number = Date.now()): Entitlement {
  const accessUntilRaw = profile.accessUntil ?? profile.subscriptionExpiresAt ?? null;
  const legacyHasAccess = accessUntilRaw ? new Date(accessUntilRaw).getTime() > now : false;

  const status: SubscriptionStatus =
    profile.subscriptionStatus ??
    (profile.deactivatedAt ? "deactivated" : legacyHasAccess ? "active" : "pending");

  return {
    status,
    hasAccess: profile.hasAccess ?? legacyHasAccess,
    isTrial: profile.isTrial ?? status === "trialing",
    isComped: profile.isComped ?? false,
    // Only a deactivated account loses export. Defaulting to true against an older
    // backend is the safe direction: the worst case is offering a download that 403s,
    // versus hiding a customer's own data from them.
    canExport: profile.canExport ?? status !== "deactivated",
    accessUntil: accessUntilRaw ? new Date(accessUntilRaw) : null,
  };
}

export interface Countdown {
  totalMs: number;
  expired: boolean;
  /** "2 days", "18 hours", "45 minutes", "under a minute". */
  label: string;
  /** Drives colour: calm above 48h, warning above 6h, urgent below. */
  urgency: "calm" | "warning" | "urgent";
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/**
 * Hours, not days, once inside two days.
 *
 * A 7-day trial is 168 hours, and a "1 day left" label that sits unchanged for a full
 * 24 hours tells the customer nothing about whether to act now or tomorrow. Days are
 * the right unit while there are several; below that, hours are.
 */
export function formatCountdown(msRemaining: number): Countdown {
  if (msRemaining <= 0) {
    return { totalMs: 0, expired: true, label: "expired", urgency: "urgent" };
  }

  let label: string;
  if (msRemaining >= 2 * DAY) {
    const days = Math.floor(msRemaining / DAY);
    label = `${days} day${days === 1 ? "" : "s"}`;
  } else if (msRemaining >= HOUR) {
    const hours = Math.floor(msRemaining / HOUR);
    label = `${hours} hour${hours === 1 ? "" : "s"}`;
  } else if (msRemaining >= MINUTE) {
    const minutes = Math.floor(msRemaining / MINUTE);
    label = `${minutes} minute${minutes === 1 ? "" : "s"}`;
  } else {
    label = "under a minute";
  }

  return {
    totalMs: msRemaining,
    expired: false,
    label,
    urgency: msRemaining > 2 * DAY ? "calm" : msRemaining > 6 * HOUR ? "warning" : "urgent",
  };
}

/**
 * What the company layout should render. Extracted from the gate component so the
 * whole status matrix can be checked without a DOM.
 */
export type GateDecision = "children" | "deactivated-notice" | "paywall";

export function decideGate(entitlement: Entitlement, pathname: string): GateDecision {
  // Billing routes always pass through. A customer who cannot reach the payment page
  // cannot pay, and rendering a paywall on top of the payment page is a loop.
  if (pathname === "/company/billing" || pathname.startsWith("/company/billing/")) {
    return "children";
  }
  // Checked before hasAccess: a deactivated account gets a notice, never a "choose a
  // plan" CTA — taking money from someone we just banned would change nothing.
  if (entitlement.status === "deactivated") return "deactivated-notice";
  if (entitlement.hasAccess) return "children";
  return "paywall";
}
