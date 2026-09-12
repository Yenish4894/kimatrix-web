import type { ServiceCheck, ServiceHealth, ServiceKey } from "@/types";

/**
 * Display rules for the admin "Service status" panel. Pure, so it can be tested.
 */

export const SERVICE_HEALTH_LABEL: Record<ServiceHealth, string> = {
  ok: "OK",
  degraded: "Degraded",
  down: "Down",
};

/** Dot colour and badge variant. Always shown beside the text label, never alone. */
export const SERVICE_HEALTH_TONE: Record<ServiceHealth, { dot: string; badge: "success" | "warning" | "error" }> = {
  ok: { dot: "bg-success-500", badge: "success" },
  degraded: { dot: "bg-warning-500", badge: "warning" },
  down: { dot: "bg-error-500", badge: "error" },
};

/**
 * What an outage means for customers, in plain words. The backend's `detail` says what
 * broke ("Hostinger rejected the login"). This says who is affected, which is what
 * decides whether the admin drops everything. The SMTP outage in August 2026 went
 * unnoticed for days because nothing on screen said that email had stopped.
 */
export const SERVICE_OUTAGE_IMPACT: Record<ServiceKey, string> = {
  database: "The platform cannot read or save any data.",
  redis: "Background jobs, including the email queue, cannot run.",
  smtp: "Password resets, verification and notices are not being delivered.",
  email_queue: "Queued emails are not being sent.",
  paypal: "Customers cannot pay for plans or spins, and renewals may not be recorded.",
};

/**
 * One sentence per down service, for the banner at the top of the dashboard:
 * "Email sending is down — Hostinger rejected the login. Password resets, …"
 */
export function outageMessage(service: Pick<ServiceCheck, "key" | "name" | "detail">): string {
  const detail = service.detail?.trim().replace(/\.+$/, "");
  const impact = SERVICE_OUTAGE_IMPACT[service.key as ServiceKey];
  return [
    detail ? `${service.name} is down — ${detail}.` : `${service.name} is down.`,
    impact,
  ]
    .filter(Boolean)
    .join(" ");
}

export function downServices<T extends Pick<ServiceCheck, "status">>(services: T[] | undefined): T[] {
  return (services ?? []).filter((s) => s.status === "down");
}

export function formatLatency(ms: number | null | undefined): string {
  if (typeof ms !== "number" || !Number.isFinite(ms)) return "—";
  return `${Math.round(ms)} ms`;
}

/** `meta` is `Record<string, unknown>` in the contract, so read each field defensively. */
function readText(meta: Record<string, unknown>, key: string): string | null {
  const v = meta[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function readCount(meta: Record<string, unknown>, key: string): number | null {
  const v = meta[key];
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

export interface MetaItem {
  label: string;
  value: string;
  /** Worth drawing the eye to, such as failed jobs or PayPal still in sandbox. */
  emphasis?: boolean;
}

/**
 * The few meta fields worth showing, per service. Anything else the backend adds is
 * ignored, not dumped raw, to keep the panel readable at a glance.
 */
export function serviceMetaItems(
  service: Pick<ServiceCheck, "key" | "meta">,
  fmtDateTime: (iso: string) => string,
): MetaItem[] {
  const meta = service.meta;
  if (!meta || typeof meta !== "object") return [];
  const items: MetaItem[] = [];

  if (service.key === "email_queue") {
    const failed = readCount(meta, "failed");
    const waiting = readCount(meta, "waiting");
    if (failed !== null) items.push({ label: "Failed", value: failed.toLocaleString("en-US"), emphasis: failed > 0 });
    if (waiting !== null) items.push({ label: "Waiting", value: waiting.toLocaleString("en-US") });
    const reason = readText(meta, "lastFailedReason");
    if (reason) {
      const at = readText(meta, "lastFailedAt");
      const when = at && !Number.isNaN(Date.parse(at)) ? ` (${fmtDateTime(at)})` : "";
      items.push({ label: "Last failure", value: `${reason}${when}` });
    }
  }

  if (service.key === "paypal") {
    const mode = readText(meta, "mode");
    // Sandbox takes no real money. On a production dashboard that is worth flagging.
    if (mode) items.push({ label: "Mode", value: mode, emphasis: mode.toLowerCase() === "sandbox" });
  }

  if (service.key === "smtp") {
    const host = readText(meta, "host");
    const port = readText(meta, "port");
    const from = readText(meta, "from");
    if (host) items.push({ label: "Host", value: port ? `${host}:${port}` : host });
    // Hostinger rejects mail whose From differs from the login user, so showing the
    // sender lets you spot that mismatch without a trip to the server.
    if (from) items.push({ label: "From", value: from });
  }

  return items;
}
