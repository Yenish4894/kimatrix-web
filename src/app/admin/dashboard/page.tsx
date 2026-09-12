"use client";

import { Building2, Shield, Fuel, Users, Receipt, Wallet, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { StatCard, QueryErrorState } from "@/components/ui";
import { VisitorsCard } from "@/components/admin/visitors-card";
import { ServiceOutageBanner, ServiceStatusPanel, useSystemStatus } from "@/components/admin/service-status";
import { formatSpendByCurrency } from "@/lib/utils";
import { adminService } from "@/services";

export default function AdminDashboardPage() {
  const statsQ = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminService.getStats,
  });
  const systemQ = useSystemStatus();
  const stats = statsQ.data;
  const isLoading = statsQ.isLoading;
  const activePct = stats && stats.totalCompanies > 0
    ? Math.round((stats.activeCompanies / stats.totalCompanies) * 100)
    : 0;

  return (
    <DashboardShell title="Admin Dashboard" requiredRole="super_admin">
      {/* First thing on the page, and independent of the stats request: an outage is
          the most urgent thing an admin can learn here. */}
      <ServiceOutageBanner status={systemQ.data} />
      {/* Without this a failed request rendered every card as 0, which reads as a real
          (and alarming) platform state rather than an error. */}
      {statsQ.isError ? (
        <QueryErrorState error={statsQ.error} onRetry={() => statsQ.refetch()} resource="platform stats" />
      ) : (
      <>
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Platform Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Companies"
            value={isLoading ? "—" : (stats?.totalCompanies ?? 0).toLocaleString("en-US")}
            icon={Building2}
          />
          <StatCard
            title="Active"
            value={isLoading ? "—" : (stats?.activeCompanies ?? 0).toLocaleString("en-US")}
            icon={Shield}
            trend={stats ? { value: `${activePct}% active`, positive: true } : undefined}
          />
          <StatCard
            title="Inactive"
            value={isLoading ? "—" : (stats?.inactiveCompanies ?? 0).toLocaleString("en-US")}
            icon={AlertCircle}
          />
          <StatCard
            title="Fuel vs Shops"
            value={isLoading ? "—" : `${stats?.totalFuelStations ?? 0} / ${stats?.totalShops ?? 0}`}
            icon={Fuel}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Platform Activity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
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
            value={isLoading ? "—" : formatSpendByCurrency(stats?.spendByCountry, stats?.totalSpend ?? 0)}
            icon={Wallet}
          />
        </div>
      </div>
      </>
      )}
      {/* Outside the stats branch, with its own query and error state: a failing or
          not-yet-deployed metrics endpoint must not take the rest of the page with it. */}
      <div className="mt-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Website Traffic
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          <VisitorsCard />
        </div>
      </div>
      {/* Outside the stats error branch, so a failed stats call still shows health. */}
      <ServiceStatusPanel query={systemQ} />
    </DashboardShell>
  );
}
