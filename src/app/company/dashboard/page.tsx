"use client";

import { Users, Receipt, Trophy, Wallet, ArrowRight } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { StatCard, Card, CardContent, Button, Table } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { companyService } from "@/services";
import type { Purchase } from "@/types";

export default function CompanyDashboardPage() {
  const profileQ = useQuery({
    queryKey: ["company", "profile"],
    queryFn: companyService.getProfile,
  });

  const statsQ = useQuery({
    queryKey: ["company", "stats"],
    queryFn: companyService.getStats,
  });

  const recentPurchasesQ = useQuery({
    queryKey: ["company", "purchases", { page: 1, limit: 5 }],
    queryFn: () =>
      companyService.getPurchases({ page: 1, limit: 5, sortBy: "submittedAt", sortOrder: "DESC" }),
  });

  const company = profileQ.data;
  const stats = statsQ.data;
  const recentPurchases = recentPurchasesQ.data?.items ?? [];
  const isFuelStation = company?.businessType === "fuel_station";
  const isLoading = profileQ.isLoading || statsQ.isLoading;

  const columns = [
    { key: "fullNameSnapshot", header: "Name" },
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
      render: (row: Purchase) => formatDate(row.submittedAt),
    },
  ];

  return (
    <DashboardShell title="Dashboard" requiredRole="company">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Customers"
          value={isLoading ? "—" : (stats?.totalCustomers ?? 0).toLocaleString("en-US")}
          icon={Users}
        />
        <StatCard
          title="Total Purchases"
          value={isLoading ? "—" : (stats?.totalPurchases ?? 0).toLocaleString("en-US")}
          icon={Receipt}
        />
        <StatCard
          title="Total Spend"
          value={isLoading ? "—" : formatCurrency(stats?.totalSpend ?? 0)}
          icon={Wallet}
        />
        <StatCard
          title="Top Spender"
          value={isLoading ? "—" : (stats?.topSpender?.fullName ?? "No data yet")}
          icon={Trophy}
          trend={
            stats?.topSpender
              ? { value: formatCurrency(stats.topSpender.totalInvoiceAmount), positive: true }
              : undefined
          }
        />
      </div>

      {/* QR Code + Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="text-center py-6 sm:py-8">
            <h3 className="text-h3 font-heading font-semibold text-slate-800 mb-4 sm:mb-6">Your QR Code</h3>
            <div className="bg-primary-50 rounded-2xl p-4 sm:p-6 inline-block mb-6 border border-primary-100">
              <div className="bg-white rounded-xl p-3">
                {company?.qrUrl ? (
                  <QRCodeSVG value={company.qrUrl} size={160} level="H" bgColor="#ffffff" fgColor="#0F766E" />
                ) : (
                  <div className="h-[160px] w-[160px] bg-slate-100 animate-pulse rounded" />
                )}
              </div>
            </div>
            <p className="text-sm font-medium text-slate-700">{company?.name ?? "Loading..."}</p>
            {company?.qrToken && (
              <p className="text-xs text-slate-400 mt-1 font-mono break-all">
                /qr/{company.qrToken}
              </p>
            )}
            <div className="flex gap-3 justify-center mt-4">
              <Link href="/company/qr-code">
                <Button variant="primary" size="sm">View & Download</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 font-heading font-semibold text-slate-800">Recent Purchases</h3>
            <Link href="/company/purchases">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <Table
            columns={columns}
            data={recentPurchases}
            keyExtractor={(row) => row.id}
            isLoading={recentPurchasesQ.isLoading}
            emptyMessage="No purchases yet. Share your QR code to get started!"
          />
        </div>
      </div>
    </DashboardShell>
  );
}
