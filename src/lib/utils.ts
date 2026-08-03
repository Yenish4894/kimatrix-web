import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CompanyAddress } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

// Country → currency symbol mapping. Falls back to "$" for unknown countries.
const COUNTRY_CURRENCY: Record<string, string> = {
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
  return `${symbol} ${num.toLocaleString("en-US", {
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
