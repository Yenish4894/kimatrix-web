"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountdown, useEntitlement } from "@/hooks/useEntitlement";

/**
 * The live trial countdown.
 *
 * Renders nothing outside a trial, and nothing for a comped account — a comped company
 * has `accessUntil = null` (perpetual) and telling it about a deadline that does not
 * exist would be a lie.
 *
 * The countdown switches from days to hours inside the last two days. A "1 day left"
 * label that sits unchanged for a full 24 hours tells the customer nothing about
 * whether to act now or tomorrow, and a 7-day trial spends its most important stretch
 * inside that window.
 */
export function TrialBanner() {
  const { entitlement } = useEntitlement();
  const countdown = useCountdown(entitlement?.accessUntil ?? null);

  if (!entitlement?.isTrial || !countdown || countdown.expired) return null;

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
          {countdown.urgency === "urgent" ? "Your free trial ends in " : "Free trial — "}
          <span className="font-semibold">{countdown.label}</span>
          {countdown.urgency === "urgent" ? "." : " remaining."}
        </p>
      </div>
      <Link
        href="/company/billing"
        className={cn("text-sm font-semibold underline underline-offset-2", linkTone)}
      >
        Choose a plan
      </Link>
    </div>
  );
}
