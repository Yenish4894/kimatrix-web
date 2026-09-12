"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useCountdown, useEntitlement } from "@/hooks/useEntitlement";
import { countdownBannerKind, countdownCopy } from "@/lib/entitlement";
import { paymentService } from "@/services/payment.service";

/**
 * The live access countdown on the dashboard — for a free trial, and for a paid plan.
 *
 * It used to cover trials only, so a paying owner met the paywall with no warning the
 * morning their plan ran out. Still renders nothing for a comped account: a comp with
 * no end date has no deadline, and a "Renew" nudge at a customer we gave free access to
 * would be wrong. The decision and the wording live in lib/entitlement (tested there).
 *
 * The countdown switches from days to hours inside the last two days. A "1 day left"
 * label that sits unchanged for a full 24 hours tells the customer nothing about
 * whether to act now or tomorrow.
 */
export function TrialBanner() {
  const { entitlement, profile } = useEntitlement();
  const kind = countdownBannerKind(entitlement);
  const countdown = useCountdown(kind ? entitlement?.accessUntil ?? null : null);

  // A recurring subscription renews itself; "ends in 3 days — Renew" would invite the
  // owner to pay twice. Only asked when it can matter, and shares the billing page's
  // cache entry.
  const mayRenew = kind === "paid" && profile?.currentPlan?.isRecurring === true;
  const subQ = useQuery({
    queryKey: ["subscription", "status"],
    queryFn: paymentService.getSubscriptionStatus,
    enabled: mayRenew,
    retry: false,
  });

  if (!kind || !countdown || countdown.expired) return null;
  // Wait for the answer rather than flash "Renew" and then swap to "renews". A failed
  // lookup falls through to the plain "ends in" wording, which is never harmful.
  if (mayRenew && subQ.isPending) return null;

  const copy = countdownCopy(kind, countdown, {
    planName: profile?.currentPlan?.name,
    renews: mayRenew && subQ.data?.status === "active",
  });

  const tone = {
    calm: "bg-primary-50 border-primary-200 text-primary-900",
    warning: "bg-accent-50 border-accent-200 text-accent-900",
    urgent: "bg-error-50 border-error-200 text-error-900",
  }[countdown.urgency];

  const linkTone = {
    calm: "text-primary-700 hover:text-primary-800",
    warning: "text-accent-700 hover:text-accent-800",
    urgent: "text-error-700 hover:text-error-800",
  }[countdown.urgency];

  return (
    <div
      // `status` not `alert`: this is ambient information that updates on a timer, and
      // an assertive live region would interrupt a screen-reader user every minute.
      role="status"
      className={cn(
        "mb-6 flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        tone,
      )}
    >
      <div className="flex items-center gap-2.5">
        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium">
          {copy.before}
          <span className="font-semibold">{copy.emphasis}</span>
          {copy.after}
        </p>
      </div>
      <Link
        href={copy.href}
        className={cn("text-sm font-semibold underline underline-offset-2", linkTone)}
      >
        {copy.cta}
      </Link>
    </div>
  );
}
