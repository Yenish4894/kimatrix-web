import type { PaymentKind, PaymentStatus } from "@/types";

/**
 * Display rules for payment records, shared by the company "Payments & invoices" page
 * and the admin payments list. Pure — no React, no network — so it can be tested.
 */

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "brand";

/**
 * "captured" is PayPal's word, not the customer's. A merchant looking for proof of
 * payment wants to read "Paid".
 */
export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  captured: "Paid",
  refunded: "Refunded",
  pending: "Pending",
  capturing: "Processing",
  failed: "Failed",
};

export const PAYMENT_STATUS_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  captured: "success",
  refunded: "neutral",
  pending: "warning",
  capturing: "info",
  failed: "error",
};

export const PAYMENT_KIND_LABEL: Record<PaymentKind, string> = {
  order: "Plan purchase",
  subscription_cycle: "Subscription renewal",
  spin_addon: "Lucky draw spins",
};

/**
 * Label and badge variant for a status, tolerating one this build has never heard of.
 * The backend owns the enum, and a new value should render as itself rather than as
 * a blank badge or a crash.
 */
export function paymentStatusBadge(status: string): { label: string; variant: BadgeVariant } {
  const known = status as PaymentStatus;
  return {
    label: PAYMENT_STATUS_LABEL[known] ?? status,
    variant: PAYMENT_STATUS_VARIANT[known] ?? "neutral",
  };
}

export function paymentKindLabel(kind: string): string {
  return PAYMENT_KIND_LABEL[kind as PaymentKind] ?? kind;
}

/**
 * Only settled payments have an invoice. A pending or failed attempt took no money,
 * and the backend returns 404 for its PDF, so we do not offer a button that can
 * only fail.
 */
export function canDownloadInvoice(status: string): boolean {
  return status === "captured" || status === "refunded";
}

/**
 * "USD 29.00". Uses the ISO code rather than a symbol on purpose: plans are billed
 * in USD while these merchants sell in rand and rupees, and a bare "$" or "R" beside
 * their own purchase figures invites exactly the wrong reading.
 */
export function formatPaymentAmount(amount: string | number, currency: string): string {
  const n = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  const code = (currency || "").toUpperCase();
  if (!Number.isFinite(n)) return code ? `${code} —` : "—";
  const value = n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return code ? `${code} ${value}` : value;
}

/**
 * The service period an invoice covers. Spin add-ons and some orders have none, and
 * an open-ended period can come back with only a start.
 *
 * Takes the date formatter as a parameter so this module stays free of locale
 * defaults and the test can pin its output.
 */
export function formatPaymentPeriod(
  start: string | null,
  end: string | null,
  fmt: (iso: string) => string,
): string {
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  if (end) return `Until ${fmt(end)}`;
  return "—";
}
