import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CompanyAddress } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * The one number formatter (CON-3). Counts render as "1,234"; pass `fractionDigits`
 * for fixed decimals ("1,234.50"). Locale is pinned to en-US so server and client
 * render identically (no hydration mismatch) and every screen groups digits the same
 * way. Anything non-finite — null, undefined, "abc" — renders as 0.
 */
export function formatNumber(n: number | string | null | undefined, fractionDigits?: number): string {
  const num = typeof n === "string" ? Number.parseFloat(n) : n;
  const safe = typeof num === "number" && Number.isFinite(num) ? num : 0;
  return safe.toLocaleString(
    "en-US",
    fractionDigits === undefined
      ? undefined
      : { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits },
  );
}

// Country → currency symbol mapping. Falls back to "$" for unknown countries.
// Exported so the PDF layer can assert every symbol here survives its own encoding —
// see lib/pdf/currency.ts.
export const COUNTRY_CURRENCY: Record<string, string> = {
  // Africa
  "South Africa": "R", "Nigeria": "₦", "Kenya": "KSh", "Ghana": "GH₵",
  "Ethiopia": "Br", "Tanzania": "TSh", "Uganda": "USh", "Rwanda": "FRw",
  "Zambia": "ZK", "Zimbabwe": "Z$", "Botswana": "P", "Namibia": "N$",
  "Mozambique": "MT", "Angola": "Kz", "Senegal": "₣", "Niger": "₣",
  "Mali": "₣", "Burkina Faso": "₣", "Ivory Coast": "₣", "Cameroon": "₣",
  "Egypt": "E£", "Morocco": "MAD", "Tunisia": "DT", "Algeria": "DA",
  // Americas
  "United States": "$", "Canada": "CA$", "Mexico": "$", "Brazil": "R$",
  "Argentina": "$", "Colombia": "$", "Chile": "$", "Peru": "S/",
  // Europe
  "United Kingdom": "£", "Germany": "€", "France": "€", "Italy": "€",
  "Spain": "€", "Netherlands": "€", "Belgium": "€", "Portugal": "€",
  "Sweden": "kr", "Norway": "kr", "Denmark": "kr", "Switzerland": "Fr",
  "Poland": "zł", "Turkey": "₺",
  // Asia
  "India": "₹", "China": "¥", "Japan": "¥", "South Korea": "₩",
  "Singapore": "S$", "Malaysia": "RM", "Indonesia": "Rp", "Thailand": "฿",
  "Philippines": "₱", "Vietnam": "₫", "Bangladesh": "৳", "Pakistan": "₨",
  "Sri Lanka": "Rs", "Myanmar": "K",
  // Middle East
  "United Arab Emirates": "AED", "Saudi Arabia": "SAR", "Qatar": "QR",
  "Kuwait": "KD", "Israel": "₪",
  // Oceania
  "Australia": "A$", "New Zealand": "NZ$",
};

export function getCurrencySymbol(country: string): string {
  return COUNTRY_CURRENCY[country] ?? "$";
}

// Format a monetary amount using the currency symbol for the given country.
// country defaults to "" → falls back to "$" (safe for admin/global views).
// Backend sends decimals as strings — preserve precision.
export function formatCurrency(
  amount: string | number | null | undefined,
  country = ""
): string {
  const symbol = getCurrencySymbol(country);
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  // `Number.isNaN(null)` is false and `null.toLocaleString()` throws, so a nullable
  // amount used to take the whole render down. That happened on the QR success screen
  // AFTER the purchase was already recorded, so the customer saw a crash and
  // re-submitted straight into a duplicate-invoice error.
  if (typeof num !== "number" || !Number.isFinite(num)) return `${symbol} 0.00`;
  return `${symbol} ${formatNumber(num, 2)}`;
}

/**
 * Platform-wide spend, one total per currency: "R 18,200.00 · ₹ 4,239.00".
 *
 * Purchase amounts are recorded in each company's own currency, so a single sum adds
 * rand to rupees and means nothing. Countries that share a symbol (the euro zone) are
 * merged; the largest total comes first. With no breakdown (a backend deployed before
 * `spendByCountry` existed) it falls back to the old single figure.
 */
export function formatSpendByCurrency(
  rows: { country: string; total: string | number }[] | undefined,
  fallback: string | number = 0
): string {
  if (!rows || rows.length === 0) return formatCurrency(fallback);
  const bySymbol = new Map<string, { country: string; sum: number }>();
  for (const r of rows) {
    const n = typeof r.total === "string" ? Number.parseFloat(r.total) : r.total;
    if (!Number.isFinite(n) || n === 0) continue;
    const symbol = getCurrencySymbol(r.country);
    const entry = bySymbol.get(symbol);
    if (entry) entry.sum += n;
    else bySymbol.set(symbol, { country: r.country, sum: n });
  }
  if (bySymbol.size === 0) return formatCurrency(0, rows[0]!.country);
  return [...bySymbol.values()]
    .sort((a, b) => b.sum - a.sum)
    .map((e) => formatCurrency(e.sum, e.country))
    .join(" · ");
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
