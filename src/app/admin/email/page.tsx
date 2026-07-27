"use client";

import { Mail, Construction } from "lucide-react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent } from "@/components/ui";

export default function AdminBulkEmailPage() {
  return (
    <DashboardShell title="Bulk Email" requiredRole="super_admin">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-warning-100 flex items-center justify-center mb-4" aria-hidden="true">
              <Construction className="h-7 w-7 text-warning-600" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-slate-800">Coming Soon</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Bulk promotional email to opted-in companies is under development and will be available
              in a future release.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-xs text-slate-400">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              Feature coming soon
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
