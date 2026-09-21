"use client";

import { useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { Calendar, Search } from "lucide-react";
import { Card, CardContent, Input, Pagination, QueryErrorState, Table } from "@/components/ui";
import { AuditLogList } from "@/components/admin/audit-log-list";
import { VoidedAmount } from "@/components/purchases/voided-amount";
import { adminService } from "@/services";
import { endOfLocalDayIso, startOfLocalDayIso } from "@/lib/dates";
import { PAGE_SIZE, formatPageRange } from "@/lib/pagination";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { Company, Customer, LuckyDrawHistoryItem, Purchase } from "@/types";

type TabKey = "customers" | "purchases" | "draws" | "activity";

const TABS: { key: TabKey; label: string }[] = [
  { key: "customers", label: "Customers" },
  { key: "purchases", label: "Purchases" },
  { key: "draws", label: "Lucky draw" },
  { key: "activity", label: "Activity" },
];

/**
 * Read-only views of one company's records, for support.
 *
 * Only the active panel is mounted, so opening a company does not fire four list
 * requests for tabs nobody looks at. Amounts use the company's own currency, not the
 * admin's — the admin has no country, and a rand amount shown as rupees is wrong data.
 */
export function CompanyRecordsTabs({ company }: Readonly<{ company: Company }>) {
  const [active, setActive] = useState<TabKey>("customers");
  const baseId = useId();
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    customers: null, purchases: null, draws: null, activity: null,
  });

  // Arrow-key movement between tabs, per the WAI-ARIA tabs pattern.
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = TABS[(index + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length]!;
    setActive(next.key);
    tabRefs.current[next.key]?.focus();
  };

  return (
    <Card className="mt-4 sm:mt-6">
      <div
        role="tablist"
        aria-label="Company records"
        className="flex overflow-x-auto border-b border-slate-200 px-2"
      >
        {TABS.map((tab, i) => {
          const selected = tab.key === active;
          return (
            <button
              key={tab.key}
              ref={(el) => { tabRefs.current[tab.key] = el; }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "shrink-0 whitespace-nowrap px-4 h-12 text-sm font-medium border-b-2 -mb-px transition-colors",
                selected
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <CardContent>
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active}`}
          aria-labelledby={`${baseId}-tab-${active}`}
          className="pt-2"
        >
          {active === "customers" && <CustomersPanel company={company} />}
          {active === "purchases" && <PurchasesPanel company={company} />}
          {active === "draws" && <DrawsPanel company={company} />}
          {active === "activity" && <AuditLogList companyId={company.id} />}
        </div>
      </CardContent>
    </Card>
  );
}

function CustomersPanel({ company }: Readonly<{ company: Company }>) {
  const [search, setSearch] = useState("");
  const [debounced] = useDebounce(search.trim(), 300);
  const [page, setPage] = useState(1);
  const isFuel = company.businessType === "fuel_station";

  const q = useQuery({
    queryKey: ["admin", "companies", company.id, "customers", { page, search: debounced }],
    queryFn: () =>
      adminService.getCompanyCustomers(company.id, {
        page,
        limit: PAGE_SIZE,
        search: debounced || undefined,
      }),
    placeholderData: (prev) => prev,
  });
  const pagination = q.data?.pagination;

  const columns = [
    {
      key: "fullName",
      header: "Customer",
      render: (row: Customer) => (
        <div>
          <p className="font-medium text-slate-700">{row.fullName}</p>
          <p className="text-xs text-slate-500">{row.mobile}</p>
        </div>
      ),
    },
    ...(isFuel
      ? [{
          key: "vehicleNumber",
          header: "Vehicle",
          render: (row: Customer) => <span className="font-mono text-xs">{row.vehicleNumber ?? "—"}</span>,
        }]
      : []),
    {
      key: "totalInvoiceAmount",
      header: "Total Spend",
      render: (row: Customer) => (
        <span className="font-semibold">{formatCurrency(row.totalInvoiceAmount, company.country)}</span>
      ),
    },
    { key: "submissionCount", header: "Visits" },
    {
      key: "lastSubmissionAt",
      header: "Last Visit",
      render: (row: Customer) => (
        <span className="text-xs text-slate-500">{row.lastSubmissionAt ? formatDate(row.lastSubmissionAt) : "—"}</span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" aria-hidden="true" />
          <Input
            aria-label="Search customers"
            placeholder="Search name, mobile, vehicle..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <span className="text-sm text-slate-500">
          {formatPageRange(pagination?.page ?? 1, PAGE_SIZE, pagination?.total ?? 0, {
            one: "customer",
            many: "customers",
          }) ?? ""}
        </span>
      </div>
      {q.isError ? (
        <QueryErrorState error={q.error} onRetry={() => q.refetch()} resource="customers" />
      ) : (
        <Table
          columns={columns}
          data={q.data?.items ?? []}
          keyExtractor={(row) => row.id}
          isLoading={q.isLoading}
          emptyMessage={debounced ? "No customers match this search." : "No customers yet."}
        />
      )}
      {pagination && pagination.totalPages > 1 && (
        <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} className="mt-6" />
      )}
    </div>
  );
}

function PurchasesPanel({ company }: Readonly<{ company: Company }>) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const isFuel = company.businessType === "fuel_station";

  const q = useQuery({
    queryKey: ["admin", "companies", company.id, "purchases", { page, fromDate, toDate }],
    queryFn: () =>
      adminService.getCompanyPurchases(company.id, {
        page,
        limit: PAGE_SIZE,
        from: fromDate ? startOfLocalDayIso(fromDate) : undefined,
        to: toDate ? endOfLocalDayIso(toDate) : undefined,
      }),
    placeholderData: (prev) => prev,
  });
  const pagination = q.data?.pagination;

  const columns = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      render: (row: Purchase) => <span className="font-mono text-xs">{row.invoiceNumber}</span>,
    },
    {
      key: "fullNameSnapshot",
      header: "Customer",
      render: (row: Purchase) => (
        <div>
          <p className="font-medium text-slate-700">{row.fullNameSnapshot}</p>
          {row.customer?.mobile && <p className="text-xs text-slate-500">{row.customer.mobile}</p>}
        </div>
      ),
    },
    ...(isFuel
      ? [{
          key: "vehicleNumberSnapshot",
          header: "Vehicle",
          render: (row: Purchase) => <span className="font-mono text-xs">{row.vehicleNumberSnapshot ?? "—"}</span>,
        }]
      : []),
    {
      key: "invoiceAmount",
      header: "Amount",
      render: (row: Purchase) => (
        <VoidedAmount formatted={formatCurrency(row.invoiceAmount, company.country)} purchase={row} />
      ),
    },
    {
      key: "submittedAt",
      header: "Date",
      render: (row: Purchase) => <span className="text-xs text-slate-500">{formatDateTime(row.submittedAt)}</span>,
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
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
        <span className="text-sm text-slate-500">
          {formatPageRange(pagination?.page ?? 1, PAGE_SIZE, pagination?.total ?? 0, {
            one: "purchase",
            many: "purchases",
          }) ?? ""}
        </span>
      </div>
      {q.isError ? (
        <QueryErrorState error={q.error} onRetry={() => q.refetch()} resource="purchases" />
      ) : (
        <Table
          columns={columns}
          data={q.data?.items ?? []}
          keyExtractor={(row) => row.id}
          isLoading={q.isLoading}
          emptyMessage={fromDate || toDate ? "No purchases in this date range." : "No purchases yet."}
        />
      )}
      {pagination && pagination.totalPages > 1 && (
        <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} className="mt-6" />
      )}
    </div>
  );
}

function DrawsPanel({ company }: Readonly<{ company: Company }>) {
  const q = useQuery({
    queryKey: ["admin", "companies", company.id, "draws"],
    queryFn: () => adminService.getCompanyDraws(company.id),
  });

  const columns = [
    {
      key: "drawnAt",
      header: "Drawn",
      render: (row: LuckyDrawHistoryItem) => (
        <span className="text-xs text-slate-500">{row.drawnAt ? formatDateTime(String(row.drawnAt)) : "—"}</span>
      ),
    },
    {
      key: "fullName",
      header: "Winner",
      render: (row: LuckyDrawHistoryItem) => (
        <div>
          <p className="font-medium text-slate-700">{row.fullName}</p>
          <p className="text-xs text-slate-500">{row.mobile}</p>
        </div>
      ),
    },
    {
      key: "invoiceNumber",
      header: "Invoice",
      render: (row: LuckyDrawHistoryItem) => <span className="font-mono text-xs">{row.invoiceNumber}</span>,
    },
    {
      key: "invoiceAmount",
      header: "Amount",
      render: (row: LuckyDrawHistoryItem) => formatCurrency(row.invoiceAmount, company.country),
    },
    {
      key: "entriesCount",
      header: "Entries",
      render: (row: LuckyDrawHistoryItem) => (
        <span title={`${row.eligibleCustomers ?? "?"} eligible customers`}>{row.entriesCount ?? "—"}</span>
      ),
    },
  ];

  if (q.isError) {
    return <QueryErrorState error={q.error} onRetry={() => q.refetch()} resource="lucky draw history" />;
  }
  return (
    <Table
      columns={columns}
      data={q.data ?? []}
      keyExtractor={(row) => row.id}
      isLoading={q.isLoading}
      emptyMessage="This company has not run a lucky draw yet."
    />
  );
}
