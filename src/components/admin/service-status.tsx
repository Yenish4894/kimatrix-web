"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
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
} from "@/lib/system-status";
import type { ServiceCheck, ServiceHealth, SystemStatus } from "@/types";

const QUERY_KEY = ["admin", "system-status"] as const;

/** Shared by the banner and the panel, so the dashboard makes one request. */
export function useSystemStatus() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => adminService.getSystemStatus(false),
    // Cheap to read (the backend serves cached probe results), and an outage should
    // surface on a dashboard left open, not only on the next page load.
    refetchInterval: 60_000,
  });
}

/**
 * Pinned to the top of the dashboard while anything is down. Kept apart from the panel
 * because the panel sits below the stats, and an outage should not be something you
 * have to scroll to find.
 */
export function ServiceOutageBanner({ status }: Readonly<{ status: SystemStatus | undefined }>) {
  const down = downServices(status?.services);
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
      <ul className="divide-y divide-slate-100">
        {status.services.map((s) => (
          <ServiceRow key={s.key} service={s} />
        ))}
      </ul>
    );
  }

  return (
    <section className="mt-6" aria-labelledby="service-status-heading">
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
