"use client";

import Link from "next/link";
import { Building2, CreditCard, LogOut } from "lucide-react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Badge, Button, Card, CardContent, CardHeader } from "@/components/ui";
import { ExportDataCard } from "@/components/subscription/export-data-card";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

/**
 * The one page a company can still use after its trial or plan ends.
 *
 * `decideGate` lets this route through the paywall — see ALWAYS_REACHABLE. It exists
 * as its own page rather than as a link into Settings because Settings is full of
 * controls whose APIs require an active subscription: rendering it to a lapsed
 * customer would fire a wall of 403s behind the paywall and offer them a dozen
 * things they cannot do.
 *
 * Everything here works on an expired account. The profile endpoint is deliberately
 * not subscription-guarded, and the export endpoints assert `canExport`, which stays
 * true for every status except a company an admin has banned.
 */
export default function CompanyExportPage() {
  const { data: profile, isLoading } = useCompanyProfile();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await dispatch(logout());
    router.push("/login");
  };

  const hasAccess = profile?.hasAccess === true;

  return (
    <DashboardShell title="Your data" requiredRole="company">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Why they are here. Shown only once access has actually lapsed — an active
            customer can reach this page too, and telling them their plan ended would
            be alarming and wrong. */}
        {!isLoading && !hasAccess && (
          <Card>
            <CardContent className="py-5">
              <h2 className="text-base font-semibold font-heading text-slate-800">
                Your access has ended
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Your QR code has stopped accepting new submissions and your dashboard is
                closed. Nothing has been deleted — every customer and purchase you
                collected is still here, and you can download all of it below, as many
                times as you like.
              </p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Choose a plan whenever you are ready and everything switches back on
                exactly as you left it.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Read-only company details. No edit controls: those APIs are behind the
            subscription guard, so offering them here would only produce errors. */}
        <Card>
          <CardHeader>
            <h3 className="text-h4 font-heading font-semibold text-slate-800 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Business details
            </h3>
          </CardHeader>
          <CardContent className="py-4">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : profile ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="Business name" value={profile.name} />
                <Detail
                  label="Type"
                  value={profile.businessType === "fuel_station" ? "Fuel Station" : "Shop"}
                />
                <Detail label="Contact email" value={profile.contactEmail} />
                <Detail label="Contact phone" value={profile.contactPhone} />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
                  <dd className="mt-1">
                    <Badge variant={hasAccess ? "success" : "warning"}>
                      {hasAccess ? "Active" : "Access ended"}
                    </Badge>
                  </dd>
                </div>
                {profile.accessUntil && (
                  <Detail
                    label={hasAccess ? "Access until" : "Access ended"}
                    value={formatDate(profile.accessUntil)}
                  />
                )}
              </dl>
            ) : (
              <p className="text-sm text-slate-500">
                We couldn&apos;t load your details just now. Your downloads below still work.
              </p>
            )}
          </CardContent>
        </Card>

        <ExportDataCard />

        <div className="flex flex-wrap gap-3">
          <Link href="/company/billing">
            <Button>
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              {hasAccess ? "Manage plan" : "Choose a plan"}
            </Button>
          </Link>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}

function Detail({ label, value }: Readonly<{ label: string; value?: string | null }>) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800 break-words">{value || "—"}</dd>
    </div>
  );
}
