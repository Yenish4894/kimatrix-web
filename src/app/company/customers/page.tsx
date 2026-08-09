"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Table, Pagination, Input, QueryErrorState } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import { companyService } from "@/services";
import type { Customer } from "@/types";

const PAGE_SIZE = 20;

type SortKey = "totalInvoiceAmount" | "submissionCount" | "lastSubmissionAt" | "firstSubmissionAt";

export default function CustomersPage() {
  const fmtCurrency = useCurrencyFormatter();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("totalInvoiceAmount");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");

  // Shared hook, not an inline useQuery on the same key: the hook sets
  // `retry: 1` because the access gate depends on this query, and an inline copy
  // silently inherits the default retry instead — whichever observer fetches
  // first decides, which made the gate\'s retry behaviour nondeterministic.
  const profileQ = useCompanyProfile();
  const isFuelStation = profileQ.data?.businessType === "fuel_station";

  const customersQ = useQuery({
    queryKey: ["company", "customers", { page: currentPage, search: debouncedSearch, sortBy: sortKey, sortOrder: sortDir }],
    queryFn: () =>
      companyService.getCustomers({
        page: currentPage,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        sortBy: sortKey,
        sortOrder: sortDir,
      }),
    placeholderData: (prev) => prev,
  });

  const items = customersQ.data?.items ?? [];
  const pagination = customersQ.data?.pagination;

  const handleSort = (key: string) => {
    const k = key as SortKey;
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
      key: "fullName",
      header: "Customer",
      render: (row: Customer) => (
        <div>
          <p className="font-medium text-slate-700">{row.fullName}</p>
          <p className="text-xs text-slate-500">{row.mobile}</p>
        </div>
      ),
    },
    ...(isFuelStation
      ? [{
          key: "vehicleNumber",
          header: "Vehicle",
          render: (row: Customer) => (
            <span className="font-mono text-xs">{row.vehicleNumber ?? "—"}</span>
          ),
        }]
      : []),
    {
      key: "totalInvoiceAmount",
      header: "Total Spend",
      sortable: true,
      render: (row: Customer) => (
        <span className="font-semibold">{fmtCurrency(row.totalInvoiceAmount)}</span>
      ),
    },
    {
      key: "submissionCount",
      header: "Visits",
      sortable: true,
      render: (row: Customer) => <span className="font-mono text-xs">{row.submissionCount}</span>,
    },
    {
      key: "lastSubmissionAt",
      header: "Last Visit",
      sortable: true,
      render: (row: Customer) => (
        <span className="text-xs text-slate-500">{formatDate(row.lastSubmissionAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (row: Customer) => (
        <Link
          href={`/company/customers/${row.id}`}
          aria-label={`View ${row.fullName}`}
          className="tap-target inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-primary-600 transition-colors"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
        </Link>
      ),
    },
  ];

  return (
    <DashboardShell title="Customers" requiredRole="company">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
          <Input
            placeholder="Search by name, mobile, vehicle..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{pagination?.total ?? 0} total</span>
        </div>
      </div>

      {customersQ.isError ? (
        <QueryErrorState
          error={customersQ.error}
          onRetry={() => customersQ.refetch()}
          resource="customers"
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
            isLoading={customersQ.isLoading}
            emptyMessage="No customers found."
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
