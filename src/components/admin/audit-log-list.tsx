"use client";

import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { Calendar, ChevronDown, Search } from "lucide-react";
import { Badge, Input, Pagination, QueryErrorState } from "@/components/ui";
import { adminService } from "@/services";
import { auditChangeRows, humanizeAuditAction } from "@/lib/audit";
import { endOfLocalDayIso, startOfLocalDayIso } from "@/lib/dates";
import { PAGE_SIZE, formatPageRange } from "@/lib/pagination";
import { cn, formatDateTime } from "@/lib/utils";
import type { AuditLogEntry } from "@/types";

/**
 * The audit log, filterable and paginated. Used on its own page and, scoped with
 * `companyId`, as the Activity tab of a company.
 *
 * A list of expandable rows rather than the shared Table: each entry can open into a
 * before/after comparison, which a fixed-column table (and its mobile card view)
 * has no room for.
 */
export function AuditLogList({ companyId }: Readonly<{ companyId?: string }>) {
  const [action, setAction] = useState("");
  const [debouncedAction] = useDebounce(action.trim(), 300);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ["admin", "audit-log", { companyId, action: debouncedAction, fromDate, toDate, page }],
    queryFn: () =>
      adminService.getAuditLog({
        page,
        limit: PAGE_SIZE,
        companyId,
        action: debouncedAction || undefined,
        // Local day boundaries as instants — see the note on the purchases page.
        from: fromDate ? startOfLocalDayIso(fromDate) : undefined,
        to: toDate ? endOfLocalDayIso(toDate) : undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const items = q.data?.items ?? [];
  const pagination = q.data?.pagination;

  return (
    <div>
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
          <Input
            aria-label="Filter by action"
            placeholder="Filter by action, e.g. trial"
            className="pl-10"
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center h-11 rounded-md border border-slate-200 bg-white divide-x divide-slate-200 overflow-hidden focus-within:border-primary-500 focus-within:ring-[3px] focus-within:ring-primary-500/15">
          <div className="flex flex-1 items-center gap-1.5 px-3">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="w-full sm:w-32 text-sm text-slate-700 bg-transparent focus:outline-none"
              aria-label="From date"
            />
          </div>
          <span className="px-2 text-xs text-slate-500 select-none" aria-hidden="true">to</span>
          <div className="flex flex-1 items-center gap-1.5 px-3">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="w-full sm:w-32 text-sm text-slate-700 bg-transparent focus:outline-none"
              aria-label="To date"
            />
          </div>
        </div>
        <span className="text-sm text-slate-500 sm:ml-auto">
          {formatPageRange(pagination?.page ?? 1, PAGE_SIZE, pagination?.total ?? 0, {
            one: "entry",
            many: "entries",
          }) ?? (q.isLoading ? "" : "No entries")}
        </span>
      </div>

      {q.isError ? (
        <QueryErrorState error={q.error} onRetry={() => q.refetch()} resource="the audit log" />
      ) : q.isLoading ? (
        <div className="space-y-2 animate-pulse" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No audit entries match these filters.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((entry) => (
            <AuditRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </div>
  );
}

function AuditRow({ entry }: Readonly<{ entry: AuditLogEntry }>) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rows = auditChangeRows(entry.before, entry.after);
  const changedCount = rows.filter((r) => r.changed).length;

  return (
    <li className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand" title={entry.action}>{humanizeAuditAction(entry.action)}</Badge>
            <span className="text-xs text-slate-500">
              on {humanizeAuditAction(entry.entityType)}
              {entry.entityId && (
                <span className="ml-1 font-mono text-slate-400" title={entry.entityId}>
                  {entry.entityId.slice(0, 8)}
                </span>
              )}
            </span>
          </div>
          <p className="text-sm text-slate-700 break-words">
            <span className="font-medium">{entry.actorEmail ?? "System"}</span>
            <span className="text-slate-400"> · </span>
            <time dateTime={entry.createdAt} className="text-slate-500">
              {formatDateTime(entry.createdAt)}
            </time>
          </p>
          {entry.note && (
            <p className="text-sm text-slate-600 break-words">
              <span className="text-slate-400">Note: </span>
              {entry.note}
            </p>
          )}
        </div>
        {rows.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            className="tap-target inline-flex shrink-0 items-center gap-1 self-start rounded-md px-2 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50"
          >
            {open ? "Hide changes" : changedCount ? `Show changes (${changedCount})` : "Show details"}
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
          </button>
        )}
      </div>

      {open && rows.length > 0 && (
        <div id={panelId} className="border-t border-slate-100 px-4 py-3">
          {/* Desktop: a three-column comparison. Mobile: each field stacks, since three
              columns of free text at 375px leave a dozen characters each. */}
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="hidden md:grid md:grid-cols-[minmax(8rem,1fr)_2fr_2fr] gap-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Field</span>
              <span>Before</span>
              <span>After</span>
            </div>
            {rows.map((r) => (
              <div
                key={r.key}
                className={cn(
                  "grid gap-1 py-2 md:grid-cols-[minmax(8rem,1fr)_2fr_2fr] md:gap-3",
                  r.changed && "bg-warning-50/60 -mx-2 px-2 rounded",
                )}
              >
                <dt className="font-medium text-slate-700 break-words">
                  {r.label}
                  {r.changed && <span className="sr-only"> (changed)</span>}
                </dt>
                <dd className="text-slate-500 break-words">
                  <span className="md:hidden text-xs text-slate-400">Before: </span>
                  {r.before}
                </dd>
                <dd className={cn("break-words", r.changed ? "text-slate-900 font-medium" : "text-slate-500")}>
                  <span className="md:hidden text-xs font-normal text-slate-400">After: </span>
                  {r.after}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </li>
  );
}
