"use client";

import { useState } from "react";
import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { InvoiceDownloadButton } from "@/components/payments/invoice-download-button";
import { Badge, Button, Pagination, QueryErrorState, Table } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { PAGE_SIZE, formatPageRange } from "@/lib/pagination";
import { formatPaymentAmount, formatPaymentPeriod, paymentStatusBadge } from "@/lib/payments";
import { companyService } from "@/services";
import type { CompanyPayment } from "@/types";

/**
 * The company's receipts. `decideGate` lets this through after a plan or trial lapses,
 * like billing, because a lapsed customer still needs their invoices.
 */
export default function CompanyPaymentsPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const paymentsQ = useQuery({
    queryKey: ["company", "payments", { page: currentPage }],
    queryFn: () => companyService.getPayments({ page: currentPage, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  const items = paymentsQ.data?.items ?? [];
  const pagination = paymentsQ.data?.pagination;

  const columns = [
    {
      key: "paidAt",
      header: "Date",
      render: (row: CompanyPayment) => (
        <span className="whitespace-nowrap">{row.paidAt ? formatDate(row.paidAt) : "—"}</span>
      ),
    },
    {
      key: "invoiceNumber",
      header: "Invoice",
      render: (row: CompanyPayment) => (
        <span className="font-mono text-xs text-slate-700">{row.invoiceNumber || "—"}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (row: CompanyPayment) => <span className="text-slate-700">{row.description}</span>,
    },
    {
      key: "period",
      header: "Period",
      render: (row: CompanyPayment) => (
        <span className="text-xs text-slate-500">
          {formatPaymentPeriod(row.periodStart, row.periodEnd, formatDate)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row: CompanyPayment) => (
        <span className="font-semibold text-slate-800 tabular-nums whitespace-nowrap">
          {formatPaymentAmount(row.amount, row.currency)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: CompanyPayment) => {
        const badge = paymentStatusBadge(row.status);
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      // No header: the Table treats this as an action column and gives it its own
      // row on mobile, instead of squeezing the button into a truncating value cell.
      key: "invoice",
      header: "",
      className: "w-44 text-right",
      render: (row: CompanyPayment) => (
        <InvoiceDownloadButton
          invoiceNumber={row.invoiceNumber}
          download={() => companyService.downloadInvoice(row.id, row.invoiceNumber)}
        />
      ),
    },
  ];

  // Only a genuinely empty history gets the "go to Billing" empty state. An empty
  // later page (a stale page number) keeps the table and pagination so you can go back.
  const isEmpty = !paymentsQ.isLoading && !paymentsQ.isError && (pagination?.total ?? items.length) === 0;

  return (
    <DashboardShell title="Payments & invoices" requiredRole="company">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <p className="text-sm text-slate-500">
            Every payment to KIMates, with a downloadable invoice for each.
          </p>
          {pagination && (
            <span className="text-sm text-slate-500">
              {formatPageRange(pagination.page, PAGE_SIZE, pagination.total, {
                one: "payment",
                many: "payments",
              })}
            </span>
          )}
        </div>

        {paymentsQ.isError ? (
          <QueryErrorState
            error={paymentsQ.error}
            onRetry={() => paymentsQ.refetch()}
            resource="payments"
          />
        ) : isEmpty ? (
          <div className="bg-white border border-slate-200 rounded-lg px-6 py-12 text-center">
            <ReceiptText className="h-10 w-10 mx-auto mb-3 text-slate-300" aria-hidden="true" />
            <p className="font-medium text-slate-700">No payments yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Invoices appear here once you pay for a plan or lucky draw spins.
            </p>
            <Link href="/company/billing" className="inline-block mt-4">
              <Button variant="secondary">Go to Billing</Button>
            </Link>
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={items}
              keyExtractor={(row) => row.id}
              isLoading={paymentsQ.isLoading}
              emptyMessage="No payments on this page."
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
      </div>
    </DashboardShell>
  );
}
