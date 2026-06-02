"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Button } from "@/components/ui";

export default function BillingCancelPage() {
  const router = useRouter();

  return (
    <DashboardShell title="Payment Cancelled" requiredRole="company">
      <div className="max-w-md mx-auto flex flex-col items-center gap-5 pt-12 text-center">
        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
          <XCircle className="h-8 w-8 text-slate-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Payment Cancelled</h2>
          <p className="text-slate-500 text-sm mt-2">
            You cancelled the PayPal checkout. No charge was made.
            You can choose a plan and try again whenever you&apos;re ready.
          </p>
        </div>
        <Button onClick={() => router.push("/company/billing")}>
          Back to Plans
        </Button>
      </div>
    </DashboardShell>
  );
}