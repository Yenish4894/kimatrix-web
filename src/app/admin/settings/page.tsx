"use client";

import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { PasswordChangeCard } from "@/components/settings/password-change-card";
import { useAppSelector } from "@/store/hooks";

export default function AdminSettingsPage() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <DashboardShell title="Settings" requiredRole="super_admin">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading font-semibold text-slate-800">Account</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-sm text-slate-500">Username</span>
              <span className="text-sm font-medium text-slate-800 font-mono">{user?.username ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-sm font-medium text-slate-800">{user?.email ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-sm text-slate-500">Role</span>
              <span className="text-sm font-medium text-slate-800">Super Admin</span>
            </div>
          </CardContent>
        </Card>

        <PasswordChangeCard />
      </div>
    </DashboardShell>
  );
}
