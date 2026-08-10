import type { SubscriptionStatus } from "@/services/payment.service";

/**
 * Billing display decisions, kept out of the components so they can be tested.
 *
 * Both of these were inline conditions that produced a customer-visible bug: a
 * subscriber was told "Next payment" for a charge that had never happened, and was
 * simultaneously shown a plan picker and a Pay button for a subscription they already
 * had.
 */

/** Statuses where the customer has a subscription the system considers live. */
export const LIVE_SUBSCRIPTION_STATUSES = [
  "pending",
  "active",
  "past_due",
  "pending_cancel",
] as const;

/**
 * True when a subscription exists but has never been charged.
 *
 * Subscribing DURING a trial defers billing to the day the trial ends, so the customer
 * doesn't forfeit the days they still have. Until that first charge lands there is no
 * completed period, so `currentPeriodEnd` is null while `nextBillingTime` is set.
 *
 * The distinction matters because "Next payment" reads as "you have already paid, here
 * is the renewal" — which is the opposite of the truth, and the exact confusion this
 * was reported as.
 */
export function isAwaitingFirstPayment(
  status: Pick<SubscriptionStatus, "currentPeriodEnd" | "nextBillingTime">,
): boolean {
  return status.currentPeriodEnd === null && status.nextBillingTime !== null;
}

/**
 * True when the plan picker must be hidden.
 *
 * The API rejects a second subscription outright, so showing a picker and a Pay button
 * to an existing subscriber can only ever produce an error. Changing plans is the
 * supported path and lives on the subscription card.
 */
export function hasLiveSubscription(
  status: Pick<SubscriptionStatus, "status"> | null | undefined,
): boolean {
  if (!status) return false;
  return (LIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status.status);
}
