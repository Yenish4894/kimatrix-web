import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CompanyAddress } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

// Currency: West African CFA Franc (XOF) — Niger's local currency.
// Format: ₣ + grouped thousands with comma + period decimal (e.g. "₣ 1,234.50").
// Backend sends decimals as strings — preserve precision.
export function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (Number.isNaN(num)) return "₣ 0.00";
  return `₣ ${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Format date consistently (SSR-safe, locked locale to avoid hydration mismatch)
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a structured company address as a single human-readable line.
 * Joins parts with commas, skips blank/null fields. Use for display surfaces
 * that previously rendered the legacy single-string `address` field.
 *
 *   "12 Avenue de la République, Niamey, Niamey, Niger"
 *   "Plot 4, Lagos, Nigeria, 100001"
 */
export function formatAddress(address: Partial<CompanyAddress>): string {
  return [address.streetAddress, address.city, address.state, address.country, address.postalCode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

// Relative time — "2 hours ago", "3 days ago"
export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} hour${diffH > 1 ? "s" : ""} ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} day${diffD > 1 ? "s" : ""} ago`;
  return formatDate(iso);
}
