"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Phone, Car, User, Calendar, TrendingUp, Receipt } from "lucide-react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent, Badge, Table, Pagination, Button, StatCard, QueryErrorState } from "@/components/ui";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { companyService } from "@/services";
import type { Purchase } from "@/types";

export default function CustomerDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = use(params);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const customerQ = useQuery({
    queryKey: ["company", "customers", id],
    queryFn: () => companyService.getCustomer(id),
  });

  const purchasesQ = useQuery({
    queryKey: ["company", "purchases", { customerId: id, page: currentPage }],
    queryFn: () =>
      companyService.getPurchases({ customerId: id, page: currentPage, limit: PAGE_SIZE }),
    enabled: !!customerQ.data,
    placeholderData: (prev) => prev,
  });

  const profileQ = useQuery({
    queryKey: ["company", "profile"],
    queryFn: companyService.getProfile,
  });
  const isFuelStation = profileQ.data?.businessType === "fuel_station";

  const customer = customerQ.data;
  const purchases = purchasesQ.data?.items ?? [];
  const pagination = purchasesQ.data?.pagination;

  if (customerQ.isError) {
    return (
      <DashboardShell title="Customer Not Found" requiredRole="company">
        <div className="text-center py-12">
          <p className="text-slate-500">Customer not found or doesn&apos;t belong to your company.</p>
          <Link href="/company/customers" className="mt-4 inline-block">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" /> Back to Customers
            </Button>
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const columns = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      render: (row: Purchase) => <span className="font-mono text-xs">{row.invoiceNumber}</span>,
    },
    {
      key: "invoiceAmount",
      header: "Amount",
      render: (row: Purchase) => (
        <span className="font-semibold">{formatCurrency(row.invoiceAmount)}</span>
      ),
    },
    {
      key: "submittedAt",
      header: "Date",
      render: (row: Purchase) => formatDateTime(row.submittedAt),
    },
    {
      key: "actions",
      header: "",
      className: "w-20 text-right",
      render: (row: Purchase) => (
        <Link href={`/company/purchases/${row.id}`}>
          <Button variant="ghost" size="sm">View</Button>
        </Link>
      ),
    },
  ];

  return (
    <DashboardShell title="Customer Detail" requiredRole="company">
      <div className="max-w-5xl mx-auto">
        <Link href="/company/customers" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>

        <Card className="mb-6">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {customerQ.isLoading ? (
              <div className="animate-pulse flex gap-4 w-full">
                <div className="h-16 w-16 bg-slate-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-48 bg-slate-200 rounded" />
                  <div className="h-4 w-32 bg-slate-100 rounded" />
                </div>
              </div>
            ) : customer ? (
              <>
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-bold shrink-0">
                  {customer.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-800">{customer.fullName}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {customer.mobile}
                    </span>
                    {isFuelStation && customer.vehicleNumber && (
                      <span className="flex items-center gap-1.5">
                        <Car className="h-3.5 w-3.5" /> <span className="font-mono">{customer.vehicleNumber}</span>
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="brand" className="shrink-0">
                  Customer since {formatDate(customer.firstSubmissionAt)}
                </Badge>
              </>
            ) : null}
          </CardContent>
        </Card>

        {customer && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard title="Total Spend" value={formatCurrency(customer.totalInvoiceAmount)} icon={TrendingUp} />
            <StatCard title="Visits" value={customer.submissionCount.toString()} icon={Receipt} />
            <StatCard title="First Visit" value={formatDate(customer.firstSubmissionAt)} icon={Calendar} />
            <StatCard title="Last Visit" value={formatDate(customer.lastSubmissionAt)} icon={User} />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 font-heading font-semibold text-slate-800">Purchase History</h3>
            {pagination && (
              <span className="text-sm text-slate-500">{pagination.total} purchases</span>
            )}
          </div>
          {purchasesQ.isError ? (
            <QueryErrorState
              error={purchasesQ.error}
              onRetry={() => purchasesQ.refetch()}
              resource="purchase history"
            />
          ) : (
            <>
              <Table
                columns={columns}
                data={purchases}
                keyExtractor={(row) => row.id}
                isLoading={purchasesQ.isLoading}
                emptyMessage="No purchases recorded for this customer."
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
      </div>
    </DashboardShell>
  );
}
