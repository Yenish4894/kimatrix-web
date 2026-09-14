"use client";

import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { PasswordChangeCard } from "@/components/settings/password-change-card";
import { LoginEmailCard } from "@/components/settings/login-email-card";
import { useAppSelector } from "@/store/hooks";

// The admin's own account only. Platform-wide knobs live on their own pages: trial
// length and currency on Plans & Trial, spin price and free trial spins on Lucky Draw.
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
            {/* Only when there is one. The super admin account has no username, so this
                row used to read "Username –", which looked like a failed load. The login
                email is shown in its own card below. */}
            {user?.username && (
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-sm text-slate-500">Username</span>
                <span className="text-sm font-medium text-slate-800 font-mono">{user.username}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1.5">
              <span className="text-sm text-slate-500">Role</span>
              <span className="text-sm font-medium text-slate-800">
                {user?.userType === "super_admin" ? "Super Admin" : user?.userType ?? "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <LoginEmailCard />

        <PasswordChangeCard />
      </div>
    </DashboardShell>
  );
}
