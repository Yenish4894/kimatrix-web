"use client";

import { Users, Receipt, Trophy, Wallet, ArrowRight } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { StatCard, Card, CardContent, Button, Table, QueryErrorState } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import { EmailVerificationBanner } from "@/components/billing/email-verification-banner";
import { TrialBanner } from "@/components/subscription/trial-banner";
import { companyService } from "@/services";
import type { Purchase } from "@/types";

export default function CompanyDashboardPage() {
  // Shared hook, not an inline useQuery on the same key: the hook sets
  // `retry: 1` because the access gate depends on this query, and an inline copy
  // silently inherits the default retry instead — whichever observer fetches
  // first decides, which made the gate\'s retry behaviour nondeterministic.
  const profileQ = useCompanyProfile();

  const statsQ = useQuery({
    queryKey: ["company", "stats"],
    queryFn: companyService.getStats,
  });

  const recentPurchasesQ = useQuery({
    queryKey: ["company", "purchases", { page: 1, limit: 5 }],
    queryFn: () =>
      companyService.getPurchases({ page: 1, limit: 5, sortBy: "submittedAt", sortOrder: "DESC" }),
  });

  const fmtCurrency = useCurrencyFormatter();

  const company = profileQ.data;
  const stats = statsQ.data;
  const recentPurchases = recentPurchasesQ.data?.items ?? [];
  const isFuelStation = company?.businessType === "fuel_station";
  const isLoading = profileQ.isLoading || statsQ.isLoading;
  // Without this, a failed /stats call rendered 0 customers, 0 purchases and 0.00
  // total spend — indistinguishable from a brand-new account, and the currency symbol
  // silently fell back to "$" because the profile was missing too.
  const hasFatalError = profileQ.isError || statsQ.isError;

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
        <span className="font-semibold">{fmtCurrency(row.invoiceAmount)}</span>
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
      <TrialBanner />
      {hasFatalError ? (
        <QueryErrorState
          error={profileQ.error ?? statsQ.error}
          resource="your dashboard"
          onRetry={() => {
            void profileQ.refetch();
            void statsQ.refetch();
          }}
        />
      ) : (
        <>
      <EmailVerificationBanner
        emailVerified={company?.emailVerified}
        email={company?.contactEmail}
      />

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
          value={isLoading ? "—" : fmtCurrency(stats?.totalSpend ?? 0)}
          icon={Wallet}
        />
        <StatCard
          title="Top Spender"
          value={isLoading ? "—" : (stats?.topSpender?.fullName ?? "No data yet")}
          icon={Trophy}
          trend={
            stats?.topSpender
              ? { value: fmtCurrency(stats.topSpender.totalInvoiceAmount), positive: true }
              : undefined
          }
        />
      </div>

      {/* QR Code + Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="text-center py-6 sm:py-8">
            <h2 className="text-h3 font-heading font-semibold text-slate-800 mb-4 sm:mb-6">Your QR Code</h2>
            <div className="bg-primary-50 rounded-2xl p-4 sm:p-6 inline-block mb-6 border border-primary-100">
              <div className="bg-white rounded-xl p-3">
                {company?.qrUrl ? (
                  <QRCodeSVG value={company.qrUrl} size={160} level="H" bgColor="#ffffff" fgColor="#0891B2" />
                ) : (
                  <div className="h-40 w-40 bg-slate-100 animate-pulse rounded" />
                )}
              </div>
            </div>
            <p className="text-sm font-medium text-slate-700">{company?.name ?? "Loading..."}</p>
            {company?.qrToken && (
              <p className="text-xs text-slate-500 mt-1 font-mono break-all">
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
            <h2 className="text-h3 font-heading font-semibold text-slate-800">Recent Purchases</h2>
            <Link href="/company/purchases">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
          {/* Degrades independently of the stat cards — a failed purchases call must
              not claim "No purchases yet. Share your QR code to get started!" to a
              merchant who has plenty. */}
          {recentPurchasesQ.isError ? (
            <QueryErrorState
              compact
              error={recentPurchasesQ.error}
              resource="recent purchases"
              onRetry={() => recentPurchasesQ.refetch()}
            />
          ) : (
            <Table
              columns={columns}
              data={recentPurchases}
              keyExtractor={(row) => row.id}
              isLoading={recentPurchasesQ.isLoading}
              emptyMessage="No purchases yet. Share your QR code to get started!"
            />
          )}
        </div>
      </div>
        </>
      )}
    </DashboardShell>
  );
}
