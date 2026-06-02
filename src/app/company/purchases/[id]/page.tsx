"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Receipt, Calendar, Wallet, User, Phone, Car, MapPin, Monitor, Globe,
} from "lucide-react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent, CardHeader, Button } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { companyService } from "@/services";

export default function PurchaseDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = use(params);

  const purchaseQ = useQuery({
    queryKey: ["company", "purchases", id],
    queryFn: () => companyService.getPurchase(id),
  });

  const profileQ = useQuery({
    queryKey: ["company", "profile"],
    queryFn: companyService.getProfile,
  });
  const isFuelStation = profileQ.data?.businessType === "fuel_station";

  const purchase = purchaseQ.data;

  if (purchaseQ.isError) {
    return (
      <DashboardShell title="Purchase Not Found" requiredRole="company">
        <div className="text-center py-12">
          <p className="text-slate-500">Purchase not found.</p>
          <Link href="/company/purchases" className="mt-4 inline-block">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" /> Back to Purchases
            </Button>
          </Link>
        </div>
      </DashboardShell>
    );
  }

  if (purchaseQ.isLoading || !purchase) {
    return (
      <DashboardShell title="Purchase Detail" requiredRole="company">
        <div className="max-w-3xl mx-auto animate-pulse space-y-4">
          <div className="h-6 w-32 bg-slate-200 rounded" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Purchase Detail" requiredRole="company">
      <div className="max-w-3xl mx-auto">
        <Link href="/company/purchases" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Purchases
        </Link>

        <Card className="mb-6 bg-gradient-to-br from-primary-50 to-white border-primary-100">
          <CardContent className="py-6 sm:py-8 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 text-primary-600 mb-4">
              <Receipt className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoice #</p>
            <p className="text-lg font-mono font-bold text-slate-800 mt-1">{purchase.invoiceNumber}</p>
            <p className="text-4xl sm:text-5xl font-bold font-heading text-primary-700 mt-4">
              {formatCurrency(purchase.invoiceAmount)}
            </p>
            <p className="text-sm text-slate-500 mt-2">{formatDateTime(purchase.submittedAt)}</p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-h4 font-heading font-semibold text-slate-800">Customer</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <Detail icon={User} label="Full Name" value={purchase.fullNameSnapshot} />
            {purchase.customer && (
              <Detail icon={Phone} label="Mobile" value={purchase.customer.mobile} />
            )}
            {isFuelStation && purchase.vehicleNumberSnapshot && (
              <Detail icon={Car} label="Vehicle" value={purchase.vehicleNumberSnapshot} mono />
            )}
            {purchase.customer && (
              <div className="pt-3 border-t border-slate-100">
                <Link
                  href={`/company/customers/${purchase.customer.id}`}
                  className="text-sm text-primary-600 hover:underline"
                >
                  View customer profile →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading font-semibold text-slate-800">Submission Details</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <Detail icon={Calendar} label="Submitted At" value={formatDateTime(purchase.submittedAt)} />
            <Detail icon={Wallet} label="Amount" value={formatCurrency(purchase.invoiceAmount)} />
            {purchase.ipAddress && <Detail icon={Globe} label="IP Address" value={purchase.ipAddress} mono />}
            {purchase.userAgent && <Detail icon={Monitor} label="Device" value={purchase.userAgent.slice(0, 60)} />}
            {purchase.latitude && purchase.longitude && (
              <Detail
                icon={MapPin}
                label="Location"
                value={`${purchase.latitude}, ${purchase.longitude}` + (purchase.locationAccuracy ? ` (±${purchase.locationAccuracy}m)` : "")}
                mono
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function Detail({ icon: Icon, label, value, mono }: Readonly<{
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}>) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-sm text-slate-800 ${mono ? "font-mono" : ""} truncate`}>{value}</p>
      </div>
    </div>
  );
}
