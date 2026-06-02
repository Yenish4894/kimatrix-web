"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { Search, Eye, Calendar } from "lucide-react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Table, Pagination, Input, QueryErrorState } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { companyService } from "@/services";
import type { Purchase } from "@/types";

const PAGE_SIZE = 20;

export default function PurchasesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<"submittedAt" | "invoiceAmount">("submittedAt");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const profileQ = useQuery({
    queryKey: ["company", "profile"],
    queryFn: companyService.getProfile,
  });
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
        from: fromDate || undefined,
        to: toDate || undefined,
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
          <p className="text-xs text-slate-400">{row.customer?.mobile}</p>
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
        <span className="font-semibold">{formatCurrency(row.invoiceAmount)}</span>
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
      className: "w-12",
      render: (row: Purchase) => (
        <Link
          href={`/company/purchases/${row.id}`}
          aria-label={`View invoice ${row.invoiceNumber}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-primary-600 transition-colors"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
        </Link>
      ),
    },
  ];

  return (
    <DashboardShell title="Purchases" requiredRole="company">
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-5">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search invoice, name, vehicle..."
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="flex items-center h-10 rounded-md border border-slate-200 bg-white hover:border-slate-300 divide-x divide-slate-200 overflow-hidden">
          <div className="flex items-center gap-1.5 px-3">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
              className="w-32 text-sm text-slate-700 bg-transparent focus:outline-none"
            />
          </div>
          <span className="px-2 text-xs text-slate-400 select-none">to</span>
          <div className="flex items-center gap-1.5 px-3">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
              className="w-32 text-sm text-slate-700 bg-transparent focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-sm text-slate-500">{pagination?.total ?? 0} purchases</span>
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
    </DashboardShell>
  );
}
