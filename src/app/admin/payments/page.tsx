"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { InvoiceDownloadButton } from "@/components/payments/invoice-download-button";
import { Badge, Button, Input, Pagination, QueryErrorState, Select, Table } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { endOfLocalDayIso, startOfLocalDayIso } from "@/lib/dates";
import { PAGE_SIZE, formatPageRange } from "@/lib/pagination";
import {
  PAYMENT_KIND_LABEL,
  PAYMENT_STATUS_LABEL,
  canDownloadInvoice,
  formatPaymentAmount,
  paymentKindLabel,
  paymentStatusBadge,
} from "@/lib/payments";
import { adminService } from "@/services";
import type { AdminPayment, PaymentKind, PaymentStatus } from "@/types";

type StatusFilter = "all" | PaymentStatus;
type KindFilter = "all" | PaymentKind;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...(Object.entries(PAYMENT_STATUS_LABEL) as [PaymentStatus, string][]).map(([value, label]) => ({ value, label })),
];

const KIND_OPTIONS = [
  { value: "all", label: "All types" },
  ...(Object.entries(PAYMENT_KIND_LABEL) as [PaymentKind, string][]).map(([value, label]) => ({ value, label })),
];

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const hasFilters = !!search || statusFilter !== "all" || kindFilter !== "all" || !!fromDate || !!toDate;

  const paymentsQ = useQuery({
    queryKey: [
      "admin",
      "payments",
      { page: currentPage, search: debouncedSearch, status: statusFilter, kind: kindFilter, fromDate, toDate },
    ],
    queryFn: () =>
      adminService.getPayments({
        page: currentPage,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        kind: kindFilter === "all" ? undefined : kindFilter,
        // Local day boundaries as instants. A bare "2026-09-01" is read as UTC midnight,
        // which cuts the first hours off the day in South Africa and India, and drops
        // the whole end day. See lib/dates.
        from: fromDate ? startOfLocalDayIso(fromDate) : undefined,
        to: toDate ? endOfLocalDayIso(toDate) : undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const items = paymentsQ.data?.items ?? [];
  const pagination = paymentsQ.data?.pagination;

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setKindFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const columns = [
    {
      key: "paidAt",
      header: "Date",
      render: (row: AdminPayment) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {row.paidAt ? formatDate(row.paidAt) : "Not paid"}
        </span>
      ),
    },
    {
      key: "company",
      header: "Company",
      render: (row: AdminPayment) =>
        row.company?.id ? (
          <Link
            href={`/admin/companies/${row.company.id}`}
            className="inline-block py-1 -my-1 font-medium text-primary-700 hover:underline"
          >
            {row.company.name}
          </Link>
        ) : (
          <span className="text-slate-500">—</span>
        ),
    },
    {
      key: "invoiceNumber",
      header: "Invoice",
      render: (row: AdminPayment) => (
        <span className="font-mono text-xs text-slate-700">{row.invoiceNumber || "—"}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (row: AdminPayment) => (
        <div className="min-w-0">
          <p className="text-slate-700 truncate">{row.description}</p>
          <p className="text-xs text-slate-500">{paymentKindLabel(row.kind)}</p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row: AdminPayment) => (
        <span className="font-semibold text-slate-800 tabular-nums whitespace-nowrap">
          {formatPaymentAmount(row.amount, row.currency)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: AdminPayment) => {
        const badge = paymentStatusBadge(row.status);
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      // Header-less, so it becomes the action row on mobile (see Table).
      key: "invoice",
      header: "",
      className: "w-44 text-right",
      render: (row: AdminPayment) =>
        canDownloadInvoice(row.status) ? (
          <InvoiceDownloadButton
            invoiceNumber={row.invoiceNumber}
            label="Invoice"
            download={() => adminService.downloadPaymentInvoice(row.id, row.invoiceNumber)}
          />
        ) : null,
    },
  ];

  return (
    <DashboardShell title="Payments" requiredRole="super_admin">
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-5">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" aria-hidden="true" />
          <Input
            placeholder="Search company name..."
            aria-label="Search by company name"
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            name="status"
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setCurrentPage(1); }}
            options={STATUS_OPTIONS}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            name="kind"
            aria-label="Filter by type"
            value={kindFilter}
            onChange={(e) => { setKindFilter(e.target.value as KindFilter); setCurrentPage(1); }}
            options={KIND_OPTIONS}
          />
        </div>
        {/* Same control as the purchases page. The two inputs shrink to share the row
            at 375px instead of each keeping a fixed width that overflowed. */}
        <div className="flex items-center h-11 w-full sm:w-auto rounded-md border border-slate-200 bg-white hover:border-slate-300 divide-x divide-slate-200 overflow-hidden transition-colors focus-within:border-primary-500 focus-within:ring-[3px] focus-within:ring-primary-500/15">
          <div className="flex flex-1 min-w-0 items-center gap-1.5 self-stretch px-3">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
              className="h-full w-full sm:w-32 min-w-0 text-sm text-slate-700 bg-transparent focus:outline-none"
              aria-label="From date"
            />
          </div>
          <span className="px-2 text-xs text-slate-500 select-none" aria-hidden="true">to</span>
          <div className="flex flex-1 min-w-0 items-center gap-1.5 self-stretch px-3">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
              className="h-full w-full sm:w-32 min-w-0 text-sm text-slate-700 bg-transparent focus:outline-none"
              aria-label="To date"
            />
          </div>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="self-start sm:self-auto">
            Clear filters
          </Button>
        )}
        <span className="text-sm text-slate-500 sm:ml-auto">
          {formatPageRange(pagination?.page ?? 1, PAGE_SIZE, pagination?.total ?? 0, {
            one: "payment",
            many: "payments",
          }) ?? "No payments"}
        </span>
      </div>

      {paymentsQ.isError ? (
        <QueryErrorState
          error={paymentsQ.error}
          onRetry={() => paymentsQ.refetch()}
          resource="payments"
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={items}
            keyExtractor={(row) => row.id}
            isLoading={paymentsQ.isLoading}
            emptyMessage={hasFilters ? "No payments match these filters." : "No payments yet."}
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
