"use client";

import { useState, useMemo } from "react";
import { Search, Send, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Pagination, Input, Button, Card, CardContent, CardHeader, QueryErrorState } from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/utils";
import { PAGE_SIZE } from "@/lib/pagination";
import { adminService } from "@/services";
import { parseApiError, errorMessageWithId } from "@/lib/errors";
import type { Company, BulkEmailLog } from "@/types";

/** 100 per page x this = the most companies Select All will gather. */
const MAX_SELECT_ALL_PAGES = 100;
const LOGS_PAGE_SIZE = 10;

export default function AdminBulkEmailPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [extraInput, setExtraInput] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [logsPage, setLogsPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const companiesQ = useQuery({
    queryKey: ["admin", "companies", { page: currentPage, search: debouncedSearch, status: "all", businessType: "all" }],
    queryFn: () =>
      adminService.getCompanies({ page: currentPage, limit: PAGE_SIZE, search: debouncedSearch || undefined, status: "all" }),
    placeholderData: (prev) => prev,
  });

  const logsQ = useQuery({
    queryKey: ["admin", "bulk-email-logs", logsPage],
    queryFn: () => adminService.getBulkEmailLogs(logsPage, LOGS_PAGE_SIZE),
  });

  // Split on comma, semicolon, whitespace or newline — people paste address lists in
  // every one of those shapes, and rejecting the paste is a worse answer than
  // accepting it.
  const extraEmails = useMemo(
    () =>
      Array.from(
        new Set(
          extraInput
            .split(/[\s,;]+/)
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean),
        ),
      ),
    [extraInput],
  );

  // Deliberately permissive: the API is the authority on what a valid address is, and
  // this only decides whether to warn before the request is made.
  const invalidExtras = useMemo(
    () => extraEmails.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
    [extraEmails],
  );

  const sendMut = useMutation({
    mutationFn: () =>
      adminService.sendBulkEmail({
        subject: subject.trim(),
        body: body.trim(),
        companyIds: Array.from(selectedIds),
        extraEmails,
      }),
    onSuccess: (res) => {
      toast.success(res.message ?? `Email queued for ${res.data.recipientCount} recipient(s).`);
      setSubject("");
      setBody("");
      setExtraInput("");
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["admin", "bulk-email-logs"] });
    },
    onError: (err) => toast.error(errorMessageWithId(parseApiError(err))),
  });

  const items = useMemo(() => companiesQ.data?.items ?? [], [companiesQ.data]);
  const pagination = companiesQ.data?.pagination;

  const allPageSelected = useMemo(
    () => items.length > 0 && items.every((c) => selectedIds.has(c.id)),
    [items, selectedIds],
  );

  const toggleOne = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePage = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) items.forEach((c) => next.delete(c.id));
      else items.forEach((c) => next.add(c.id));
      return next;
    });

  const [isSelectingAll, setIsSelectingAll] = useState(false);

  /**
   * Select every company on the platform, not just the ones on this page.
   *
   * Walks the list a page at a time because the API caps `limit` at 100. Asking for
   * all of them in one request returns a validation error, and since nothing here
   * caught it, the button used to do nothing at all — no selection, no message.
   */
  const selectAll = async () => {
    setIsSelectingAll(true);
    try {
      const ids: string[] = [];
      // Bounded rather than `while (true)`: a pagination bug upstream should degrade
      // to a wrong count, never to a loop that hammers the API forever.
      for (let page = 1; page <= MAX_SELECT_ALL_PAGES; page++) {
        const res = await adminService.getCompanies({ page, limit: 100, status: "all" });
        ids.push(...res.items.map((c) => c.id));
        if (page >= (res.pagination?.totalPages ?? 1)) break;
      }
      setSelectedIds(new Set(ids));
      toast.success(`${ids.length} compan${ids.length === 1 ? "y" : "ies"} selected.`);
    } catch (err) {
      toast.error(errorMessageWithId(parseApiError(err)));
    } finally {
      setIsSelectingAll(false);
    }
  };

  // Only what is on screen can be counted — the selection may span pages this query
  // has not loaded. Deliberately an "at least" signal, not a precise total.
  const optedOutSelected = useMemo(
    () => items.filter((c) => selectedIds.has(c.id) && c.promoEmailOptIn === false).length,
    [items, selectedIds],
  );

  const totalRecipients = selectedIds.size + extraEmails.length;
  const canSend =
    totalRecipients > 0 &&
    invalidExtras.length === 0 &&
    subject.trim().length > 0 &&
    body.trim().length > 0;

  return (
    <DashboardShell title="Bulk Email" requiredRole="super_admin">
      <div className="space-y-6">

        {/* ── Company selector ── */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-h4 font-heading font-semibold text-slate-800">
                Select Recipients
                {selectedIds.size > 0 && (
                  <span className="ml-2 text-sm font-normal text-primary-600">
                    {selectedIds.size} selected
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} disabled={selectedIds.size === 0}>
                  Clear
                </Button>
                <Button variant="secondary" size="sm" onClick={() => void selectAll()} isLoading={isSelectingAll}>
                  Select All Companies
                </Button>
              </div>
            </div>
            <div className="relative mt-3 w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
              <Input
                placeholder="Search companies..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {companiesQ.isError ? (
              <div className="p-6">
                <QueryErrorState error={companiesQ.error} onRetry={() => companiesQ.refetch()} resource="companies" />
              </div>
            ) : (
              <>
                <CompanyTable
                  items={items}
                  isLoading={companiesQ.isLoading}
                  selectedIds={selectedIds}
                  allPageSelected={allPageSelected}
                  onToggleOne={toggleOne}
                  onTogglePage={togglePage}
                />
                {pagination && pagination.totalPages > 1 && (
                  <div className="px-4 pb-4">
                    <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setCurrentPage} />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Compose ── */}
        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading font-semibold text-slate-800">Compose Email</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="extra-emails" className="block text-sm font-medium text-slate-700 mb-1">
                Other recipients{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id="extra-emails"
                className="w-full min-h-[70px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                placeholder="someone@example.com, another@example.com"
                value={extraInput}
                onChange={(e) => setExtraInput(e.target.value)}
                aria-describedby="extra-emails-help"
              />
              <p id="extra-emails-help" className="mt-1 text-xs text-slate-500">
                Anyone who is not a registered company — separate addresses with a comma,
                space or new line. Up to 50.
              </p>
              {invalidExtras.length > 0 && (
                <p role="alert" className="mt-1 text-xs text-error-600">
                  Not a valid email address: {invalidExtras.slice(0, 3).join(", ")}
                  {invalidExtras.length > 3 ? ` and ${invalidExtras.length - 3} more` : ""}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <Input placeholder="Email subject..." value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={255} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Body</label>
              <textarea
                className="w-full min-h-[160px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                placeholder="Write your message here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={10000}
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{body.length}/10,000</p>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="text-sm text-slate-500">
                {totalRecipients === 0 ? (
                  "No recipients yet."
                ) : (
                  <>
                    Sending to{" "}
                    <strong className="text-slate-700">
                      {totalRecipients} recipient{totalRecipients === 1 ? "" : "s"}
                    </strong>
                    {selectedIds.size > 0 && extraEmails.length > 0 && (
                      <span className="text-slate-400">
                        {" "}
                        ({selectedIds.size} compan{selectedIds.size === 1 ? "y" : "ies"} +{" "}
                        {extraEmails.length} other)
                      </span>
                    )}
                    {/* An address in both lists is one email, not two — the server
                        deduplicates, so the count here would otherwise overstate it. */}
                    {optedOutSelected > 0 && (
                      <span className="block mt-1 text-warning-700">
                        {optedOutSelected} of the selected companies turned off promotional
                        email. Sending anyway will still reach them.
                      </span>
                    )}
                  </>
                )}
              </div>
              <Button variant="primary" onClick={() => sendMut.mutate()} isLoading={sendMut.isPending} disabled={!canSend}>
                <Send className="h-4 w-4 mr-2" aria-hidden="true" />
                Send Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Sent logs ── */}
        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading font-semibold text-slate-800">Sent Emails</h3>
          </CardHeader>
          <CardContent className="p-0">
            {logsQ.isError ? (
              <div className="p-6">
                <QueryErrorState error={logsQ.error} onRetry={() => logsQ.refetch()} resource="email logs" />
              </div>
            ) : (
              <>
                <LogsTable
                  items={logsQ.data?.items ?? []}
                  isLoading={logsQ.isLoading}
                  expandedLogId={expandedLogId}
                  onToggleExpand={(id) => setExpandedLogId(expandedLogId === id ? null : id)}
                />
                {logsQ.data?.pagination && logsQ.data.pagination.totalPages > 1 && (
                  <div className="px-4 pb-4">
                    <Pagination currentPage={logsQ.data.pagination.page} totalPages={logsQ.data.pagination.totalPages} onPageChange={setLogsPage} />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardShell>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function CompanyTable({
  items,
  isLoading,
  selectedIds,
  allPageSelected,
  onToggleOne,
  onTogglePage,
}: {
  items: Company[];
  isLoading: boolean;
  selectedIds: Set<string>;
  allPageSelected: boolean;
  onToggleOne: (id: string) => void;
  onTogglePage: () => void;
}) {
  const cols = ["", "Company", "Type", "Joined"];

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-slate-50 border-b border-slate-100" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-slate-100 flex items-center px-4 gap-4">
            {cols.map((_, j) => <div key={j} className="h-4 bg-slate-100 rounded flex-1" />)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="px-4 py-3 w-10">
              <Checkbox checked={allPageSelected} onChange={onTogglePage} aria-label="Select all on this page" />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Company</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">No companies found.</td>
            </tr>
          ) : (
            items.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 w-10">
                  <Checkbox checked={selectedIds.has(row.id)} onChange={() => onToggleOne(row.id)} aria-label={`Select ${row.name}`} />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-700">{row.name}</p>
                  <p className="text-xs text-slate-500">{row.owner?.email ?? "—"}</p>
                  {/* Shown where the decision is made. This flag is collected at
                      registration and editable in settings, but nothing has ever read
                      it — so an admin could not tell who had asked not to be emailed. */}
                  {row.promoEmailOptIn === false && (
                    <p className="mt-0.5 text-[11px] text-warning-700">Opted out of promo email</p>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {row.businessType === "fuel_station" ? "Fuel Station" : "Shop"}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(row.joinedAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function LogsTable({
  items,
  isLoading,
  expandedLogId,
  onToggleExpand,
}: {
  items: BulkEmailLog[];
  isLoading: boolean;
  expandedLogId: string | null;
  onToggleExpand: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-slate-50 border-b border-slate-100" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-slate-100 flex items-center px-4 gap-4">
            {[1, 2, 3, 4].map((j) => <div key={j} className="h-4 bg-slate-100 rounded flex-1" />)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Recipients</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Sent By</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Sent At</th>
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">No emails sent yet.</td>
            </tr>
          ) : (
            items.map((row) => (
              <>
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700 max-w-xs truncate">{row.subject}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {row.recipientCount}
                    {/* Which of them were typed in by hand rather than selected, so the
                        history can answer "who did we actually email" later. */}
                    {(row.extraEmails?.length ?? 0) > 0 && (
                      <span className="block text-[11px] text-slate-400">
                        incl. {row.extraEmails!.length} direct
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{row.sentByEmail}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(row.sentAt)}</td>
                  <td className="px-4 py-3 w-10">
                    <button
                      type="button"
                      onClick={() => onToggleExpand(row.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
                      aria-label="Toggle body preview"
                    >
                      {expandedLogId === row.id
                        ? <ChevronUp className="h-4 w-4" />
                        : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
                {expandedLogId === row.id && (
                  <tr key={`${row.id}-expanded`} className="bg-slate-50 border-b border-slate-100">
                    <td colSpan={5} className="px-4 py-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Body</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{row.body}</p>
                    </td>
                  </tr>
                )}
              </>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
