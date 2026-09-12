/**
 * Turning audit-log rows into something an admin can read.
 *
 * Pure and React-free so it can be tested directly. The backend records machine names
 * ("company.trial_extended") and raw entity snapshots; showing those as-is made the
 * log readable only by whoever wrote the backend.
 */

import { formatDateTime } from "./utils";

/** Words that must keep their casing. Keys are lowercase. */
const SPECIAL_WORDS: Record<string, string> = {
  qr: "QR",
  url: "URL",
  id: "ID",
  ip: "IP",
  pdf: "PDF",
  paypal: "PayPal",
  usd: "USD",
  zar: "ZAR",
  inr: "INR",
  smtp: "SMTP",
  api: "API",
};

/** Splits snake_case, kebab-case, dotted.names, colon:names and camelCase into words. */
function splitWords(raw: string): string[] {
  return raw
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s._:\-/]+/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

function sentenceCase(words: string[]): string {
  return words
    .map((w, i) => {
      if (SPECIAL_WORDS[w]) return SPECIAL_WORDS[w];
      return i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w;
    })
    .join(" ");
}

/**
 * "company.trial_extended" → "Company trial extended"; "qr.regenerated" → "QR regenerated".
 * Unknown shapes still come out readable, so a new backend action needs no frontend
 * change to appear sensibly.
 */
export function humanizeAuditAction(action: string | null | undefined): string {
  if (!action) return "Unknown action";
  const words = splitWords(action);
  return words.length ? sentenceCase(words) : action;
}

/** Field keys use the same rules: "subscriptionExpiresAt" → "Subscription expires at". */
export function humanizeFieldKey(key: string): string {
  return key
    .split(".")
    .map((segment) => sentenceCase(splitWords(segment)))
    .filter(Boolean)
    .join(" › ");
}

// ISO 8601 with a time part. Bare dates ("2027-03-15") are left alone: rendering them
// through a Date would shift them a day for anyone west of UTC.
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/;

/** One snapshot value → display text. Never throws and never returns raw JSON braces. */
export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "—";
  if (typeof value === "string") {
    if (ISO_INSTANT.test(value) && !Number.isNaN(Date.parse(value))) return formatDateTime(value);
    return value;
  }
  if (Array.isArray(value)) {
    return value.length ? value.map(formatAuditValue).join(", ") : "—";
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) return "—";
    return entries.map(([k, v]) => `${humanizeFieldKey(k)}: ${formatAuditValue(v)}`).join("; ");
  }
  return String(value);
}

/**
 * Nested objects are flattened to dotted keys, one level of nesting at most below the
 * top. Deeper structure is formatted inline by `formatAuditValue` rather than
 * exploding into dozens of rows.
 */
function flatten(obj: Record<string, unknown>, prefix = "", depth = 0): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v) && depth < 1) {
      Object.assign(out, flatten(v as Record<string, unknown>, key, depth + 1));
    } else {
      out[key] = v;
    }
  }
  return out;
}

/** The server may send a snapshot that is not an object at all; wrap it rather than drop it. */
function asRecord(snapshot: unknown): Record<string, unknown> | null {
  if (snapshot === null || snapshot === undefined) return null;
  if (typeof snapshot === "object" && !Array.isArray(snapshot)) {
    return snapshot as Record<string, unknown>;
  }
  return { value: snapshot };
}

export interface AuditChangeRow {
  key: string;
  label: string;
  before: string;
  after: string;
  changed: boolean;
}

/**
 * Before/after snapshots → one row per field. Keys keep their order of first
 * appearance (before, then fields that exist only after), so a row does not jump
 * around between entries of the same action.
 */
export function auditChangeRows(before: unknown, after: unknown): AuditChangeRow[] {
  const b = asRecord(before);
  const a = asRecord(after);
  if (!b && !a) return [];
  const fb = b ? flatten(b) : {};
  const fa = a ? flatten(a) : {};
  const keys = [...new Set([...Object.keys(fb), ...Object.keys(fa)])];
  return keys.map((key) => {
    const beforeText = b ? formatAuditValue(fb[key]) : "—";
    const afterText = a ? formatAuditValue(fa[key]) : "—";
    return {
      key,
      label: humanizeFieldKey(key),
      before: beforeText,
      after: afterText,
      changed: beforeText !== afterText,
    };
  });
}

/** Whether an entry has anything worth expanding. */
export function hasAuditDetails(entry: { before: unknown; after: unknown }): boolean {
  return auditChangeRows(entry.before, entry.after).length > 0;
}
