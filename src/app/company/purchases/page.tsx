"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { Search, Eye, Calendar, Ban } from "lucide-react";
import { VoidPurchaseModal } from "@/components/purchases/void-purchase-modal";
import { VoidedAmount } from "@/components/purchases/voided-amount";
import { isVoided } from "@/lib/void";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Table, Pagination, Input, QueryErrorState } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { endOfLocalDayIso, startOfLocalDayIso } from "@/lib/dates";
import { PAGE_SIZE, formatPageRange } from "@/lib/pagination";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import { companyService } from "@/services";
import type { Purchase } from "@/types";


export default function PurchasesPage() {
  const fmtCurrency = useCurrencyFormatter();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<"submittedAt" | "invoiceAmount">("submittedAt");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [voidTarget, setVoidTarget] = useState<Purchase | null>(null);

  // Shared hook, not an inline useQuery on the same key: the hook sets
  // `retry: 1` because the access gate depends on this query, and an inline copy
  // silently inherits the default retry instead — whichever observer fetches
  // first decides, which made the gate\'s retry behaviour nondeterministic.
  const profileQ = useCompanyProfile();
  const isFuelStation = profileQ.data?.businessType === "fuel_station";

  const purchasesQ = useQuery({
    queryKey: [
      "company",
      "purchases",
      { page: currentPage, search: debouncedSearch, fromDate, toDate, sortBy: sortKey, sortOrder: sortDir },
    ],
    queryFn: () =>
      companyService.getPurchases({
        page: currentPage,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        // The inputs hold bare dates, which the server reads as UTC midnight and
        // compares with `<=`: the whole end day was dropped (a single-day filter
        // returned nothing) and the start began at 02:00 / 05:30 local. Send the
        // user's local day boundaries as instants instead.
        from: fromDate ? startOfLocalDayIso(fromDate) : undefined,
        to: toDate ? endOfLocalDayIso(toDate) : undefined,
        sortBy: sortKey,
        sortOrder: sortDir,
      }),
    placeholderData: (prev) => prev,
  });

  const items = purchasesQ.data?.items ?? [];
  const pagination = purchasesQ.data?.pagination;

  const handleSort = (key: string) => {
    const k = key as "submittedAt" | "invoiceAmount";
    if (sortKey === k) {
      setSortDir((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortKey(k);
      setSortDir("DESC");
    }
    setCurrentPage(1);
  };

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
          <p className="text-xs text-slate-500">{row.customer?.mobile}</p>
        </div>
      ),
    },
    ...(isFuelStation
      ? [{
          key: "vehicleNumberSnapshot",
          header: "Vehicle",
          render: (row: Purchase) => (
            <span className="font-mono text-xs">{row.vehicleNumberSnapshot ?? "—"}</span>
          ),
        }]
      : []),
    {
      key: "invoiceAmount",
      header: "Amount",
      sortable: true,
      render: (row: Purchase) => (
        <VoidedAmount formatted={fmtCurrency(row.invoiceAmount)} purchase={row} />
      ),
    },
    {
      key: "submittedAt",
      header: "Date",
      sortable: true,
      render: (row: Purchase) => (
        <span className="text-xs text-slate-500">{formatDateTime(row.submittedAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (row: Purchase) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/company/purchases/${row.id}`}
            aria-label={`View invoice ${row.invoiceNumber}`}
            className="tap-target inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-primary-600 transition-colors"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Link>
          {!isVoided(row) && (
            <button
              type="button"
              onClick={() => setVoidTarget(row)}
              aria-label={`Void invoice ${row.invoiceNumber}`}
              title="Void purchase"
              className="tap-target inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-error-50 hover:text-error-600 transition-colors"
            >
              <Ban className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardShell title="Purchases" requiredRole="company">
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-5">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" aria-hidden="true" />
          <Input
            placeholder="Search invoice, name, vehicle..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="flex w-full sm:w-auto items-center h-11 rounded-md border border-slate-200 bg-white hover:border-slate-300 divide-x divide-slate-200 overflow-hidden transition-colors focus-within:border-primary-500 focus-within:ring-[3px] focus-within:ring-primary-500/15">
          <div className="flex flex-1 min-w-0 items-center gap-1.5 self-stretch px-3 sm:flex-none">
            <Calendar className="hidden sm:block h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
              className="h-full w-full min-w-0 sm:w-32 text-sm text-slate-700 bg-transparent focus:outline-none"
              aria-label="From date"
            />
          </div>
          <span className="px-2 text-xs text-slate-500 select-none" aria-hidden="true">to</span>
          <div className="flex flex-1 min-w-0 items-center gap-1.5 self-stretch px-3 sm:flex-none">
            <Calendar className="hidden sm:block h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
              className="h-full w-full min-w-0 sm:w-32 text-sm text-slate-700 bg-transparent focus:outline-none"
              aria-label="To date"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-sm text-slate-500">
            {formatPageRange(pagination?.page ?? 1, PAGE_SIZE, pagination?.total ?? 0, {
              one: "purchase",
              many: "purchases",
            }) ?? "No purchases"}
          </span>
        </div>
      </div>

      {purchasesQ.isError ? (
        <QueryErrorState
          error={purchasesQ.error}
          onRetry={() => purchasesQ.refetch()}
          resource="purchases"
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={items}
            keyExtractor={(row) => row.id}
            onSort={handleSort}
            sortKey={sortKey}
            sortDirection={sortDir.toLowerCase() as "asc" | "desc"}
            isLoading={purchasesQ.isLoading}
            emptyMessage="No purchases found."
          />

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
              className="mt-6"
            />
          )}
        </>
      )}

      <VoidPurchaseModal purchase={voidTarget} onClose={() => setVoidTarget(null)} />
    </DashboardShell>
  );
}
