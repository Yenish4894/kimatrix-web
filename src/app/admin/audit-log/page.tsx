"use client";

import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { AuditLogList } from "@/components/admin/audit-log-list";

export default function AdminAuditLogPage() {
  return (
    <DashboardShell title="Audit log" requiredRole="super_admin">
      <div className="max-w-5xl mx-auto">
        <p className="text-sm text-slate-500 mb-5">
          Every recorded change on the platform: who made it, when, and what it changed.
          Expand an entry to compare the values before and after.
        </p>
        <AuditLogList />
      </div>
    </DashboardShell>
  );
}
