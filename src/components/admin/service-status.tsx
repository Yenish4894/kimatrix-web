"use client";

import Link from "next/link";
import { AlertTriangle, MailWarning, RefreshCw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Badge, Button, Card, CardContent, QueryErrorState } from "@/components/ui";
import { adminService } from "@/services";
import { parseApiError } from "@/lib/errors";
import { cn, formatDateTime } from "@/lib/utils";
import {
  SERVICE_HEALTH_LABEL,
  SERVICE_HEALTH_TONE,
  downServices,
  formatLatency,
  outageMessage,
  serviceMetaItems,
  smtpCheck,
  smtpDegradedMessage,
  smtpDownMessage,
} from "@/lib/system-status";
import type { ServiceCheck, ServiceHealth, SystemStatus } from "@/types";

const QUERY_KEY = ["admin", "system-status"] as const;

/** Where the status panel lives — the banner links here. */
export const SERVICE_STATUS_HREF = "/admin/dashboard#service-status";

/**
 * Shared by the banners and the panel, so each page makes one request.
 *
 * The dashboard polls every minute (it is where the panel is watched); every other
 * admin page only needs to notice a mail outage, so it polls every five. TanStack runs
 * one timer per query at the shortest interval among mounted observers.
 */
export function useSystemStatus(refetchInterval: number = 60_000) {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => adminService.getSystemStatus(false),
    // Cheap to read (the backend serves cached probe results), and an outage should
    // surface on a page left open, not only on the next page load.
    refetchInterval,
  });
}

/**
 * Pinned to the top of the dashboard while anything is down. Kept apart from the panel
 * because the panel sits below the stats, and an outage should not be something you
 * have to scroll to find.
 *
 * SMTP is left out: it has its own banner on every admin page (SmtpDownBanner), and
 * listing it twice on the dashboard would only add noise.
 */
export function ServiceOutageBanner({ status }: Readonly<{ status: SystemStatus | undefined }>) {
  const down = downServices(status?.services).filter((s) => s.key !== "smtp");
  if (down.length === 0) return null;
  return (
    <div role="alert" className="mb-6 rounded-xl border border-error-100 bg-error-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-error-600 mt-0.5" aria-hidden="true" />
        <ul className="space-y-1.5 text-sm font-medium text-error-700 min-w-0">
          {down.map((s) => (
            <li key={s.key} className="break-words">
              {outageMessage(s)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Shown on every admin page while outgoing mail is being rejected.
 *
 * In August 2026 Hostinger rejected every message for days and nobody noticed, because
 * the only signal was a status row on one page. Password resets, verification links and
 * expiry notices all silently went nowhere. This is deliberately loud.
 */
export function SmtpDownBanner() {
  const { data } = useSystemStatus(5 * 60_000);
  const smtp = smtpCheck(data);
  if (!smtp || smtp.status !== "down") return null;
  const lastError = smtp.lastError?.trim();

  return (
    <div role="alert" className="mb-6 rounded-xl border border-error-200 bg-error-50 p-4">
      <div className="flex items-start gap-3">
        <MailWarning className="h-5 w-5 shrink-0 text-error-600 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 space-y-1.5 text-sm">
          <p className="font-semibold text-error-800 break-words">{smtpDownMessage(smtp, formatDateTime)}</p>
          {lastError && (
            <p className="text-error-700 break-words">
              <span className="font-medium">Last error:</span> {lastError}
            </p>
          )}
          <Link
            href={SERVICE_STATUS_HREF}
            className="inline-flex min-h-11 items-center font-medium text-error-700 underline underline-offset-2 hover:text-error-800"
          >
            View service status
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Degraded mail is worth a look but not an alarm — status panel only. */
function SmtpDegradedNotice({ smtp }: Readonly<{ smtp: ServiceCheck }>) {
  return (
    <div role="status" className="mb-3 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2.5">
      <p className="flex items-start gap-2 text-sm text-warning-800">
        <MailWarning className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span className="break-words">{smtpDegradedMessage(smtp, formatDateTime)}</span>
      </p>
    </div>
  );
}

function HealthPill({ status }: Readonly<{ status: ServiceHealth }>) {
  const tone = SERVICE_HEALTH_TONE[status] ?? SERVICE_HEALTH_TONE.degraded;
  return (
    <Badge variant={tone.badge} className="gap-1.5 shrink-0">
      <span className={cn("h-2 w-2 rounded-full", tone.dot)} aria-hidden="true" />
      {SERVICE_HEALTH_LABEL[status] ?? status}
    </Badge>
  );
}

function ServiceRow({ service }: Readonly<{ service: ServiceCheck }>) {
  const meta = serviceMetaItems(service, formatDateTime);
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <HealthPill status={service.status} />
        <span className="font-medium text-slate-800">{service.name}</span>
        <span className="ml-auto text-xs tabular-nums text-slate-500">
          <span className="sr-only">Latency </span>
          {formatLatency(service.latencyMs)}
        </span>
      </div>
      {service.detail && (
        <p className="mt-1 text-sm text-slate-600 break-words">{service.detail}</p>
      )}
      {meta.length > 0 && (
        <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {meta.map((m) => (
            <div key={m.label} className="flex min-w-0 gap-1">
              <dt className="text-slate-500 shrink-0">{m.label}:</dt>
              <dd className={cn("min-w-0 break-words", m.emphasis ? "font-semibold text-error-700" : "text-slate-700")}>
                {m.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

export function ServiceStatusPanel({ query }: Readonly<{ query: ReturnType<typeof useSystemStatus> }>) {
  const qc = useQueryClient();
  const recheck = useMutation({
    mutationFn: () => adminService.getSystemStatus(true),
    onSuccess: (fresh) => qc.setQueryData(QUERY_KEY, fresh),
    onError: (err) => toast.error(parseApiError(err).message),
  });

  const status = query.data;
  const smtp = smtpCheck(status);

  let body: React.ReactNode;
  if (query.isLoading) {
    body = (
      <ul className="animate-pulse space-y-3" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="h-10 rounded bg-slate-100" />
        ))}
      </ul>
    );
  } else if (query.isError && !status) {
    body = (
      <QueryErrorState compact error={query.error} onRetry={() => query.refetch()} resource="service status" />
    );
  } else if (!status || status.services.length === 0) {
    body = <p className="text-sm text-slate-500">No services reported.</p>;
  } else {
    body = (
      <>
        {smtp?.status === "degraded" && <SmtpDegradedNotice smtp={smtp} />}
        <ul className="divide-y divide-slate-100">
          {status.services.map((s) => (
            <ServiceRow key={s.key} service={s} />
          ))}
        </ul>
      </>
    );
  }

  return (
    <section id="service-status" className="mt-6 scroll-mt-20" aria-labelledby="service-status-heading">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 id="service-status-heading" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Service status
        </h2>
        <div className="flex items-center gap-3">
          {status?.checkedAt && (
            <span className="text-xs text-slate-500">Checked {formatDateTime(status.checkedAt)}</span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => recheck.mutate()}
            isLoading={recheck.isPending}
          >
            {!recheck.isPending && <RefreshCw className="h-4 w-4" aria-hidden="true" />}
            Re-check
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="py-4">{body}</CardContent>
      </Card>
    </section>
  );
}
