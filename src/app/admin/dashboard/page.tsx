"use client";

import { Building2, Shield, Fuel, Store, Users, Receipt, Wallet, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { StatCard } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { adminService } from "@/services";

export default function AdminDashboardPage() {
  const statsQ = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminService.getStats,
  });
  const stats = statsQ.data;
  const isLoading = statsQ.isLoading;
  const activePct = stats && stats.totalCompanies > 0
    ? Math.round((stats.activeCompanies / stats.totalCompanies) * 100)
    : 0;

  return (
    <DashboardShell title="Admin Dashboard" requiredRole="super_admin">
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

      <div className="mb-6">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Business Types
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <StatCard
            title="Fuel Stations"
            value={isLoading ? "—" : (stats?.totalFuelStations ?? 0).toLocaleString("en-US")}
            icon={Fuel}
          />
          <StatCard
            title="Shops"
            value={isLoading ? "—" : (stats?.totalShops ?? 0).toLocaleString("en-US")}
            icon={Store}
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
            value={isLoading ? "—" : formatCurrency(stats?.totalSpend ?? 0)}
            icon={Wallet}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
