"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Building2, Mail, Phone, MessageCircle, MapPin,
  Calendar, User, Fuel, Store, Power, Send,
} from "lucide-react";
import { CompanyRecordsTabs } from "@/components/admin/company-records-tabs";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent, CardHeader, Badge, Button, ConfirmDialog, QueryErrorState } from "@/components/ui";
import { formatDate, formatDateTime, formatAddress } from "@/lib/utils";
import { adminService } from "@/services";
import { parseApiError, errorMessageWithId } from "@/lib/errors";
import {
  getAdminToggleAction,
  getCompanyBadge,
  TOGGLE_LABEL,
} from "@/lib/company-status";
import { SubscriptionPanel } from "@/components/admin/subscription-panel";
import { DeletionCard } from "@/components/admin/deletion-card";

export default function AdminCompanyDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [confirmModal, setConfirmModal] = useState<"activate" | "deactivate" | null>(null);
  // Required before a ban can be submitted — see the note on the textarea below.
  const [banReason, setBanReason] = useState("");

  const [confirmResend, setConfirmResend] = useState(false);

  const resendM = useMutation({
    mutationFn: () => adminService.resendInvite(id),
    onSuccess: (message) => {
      toast.success(message);
      setConfirmResend(false);
    },
    onError: (err) => {
      const parsed = parseApiError(err);
      // 409 = the owner verified since this page loaded. Say so in the server's words
      // and refresh, so the button disappears instead of inviting a second try.
      toast.error(parsed.status === 409 ? parsed.message : errorMessageWithId(parsed));
      if (parsed.status === 409) {
        setConfirmResend(false);
        void qc.invalidateQueries({ queryKey: ["admin", "companies", id] });
      }
    },
  });

  const companyQ = useQuery({
    queryKey: ["admin", "companies", id],
    queryFn: () => adminService.getCompany(id),
  });
  const company = companyQ.data;

  const toggleMut = useMutation({
    mutationFn: async (action: "activate" | "deactivate") => {
      if (action === "deactivate") {
        await adminService.deactivateCompany(id, banReason.trim());
      } else {
        await adminService.activateCompany(id);
      }
    },
    onSuccess: (_, action) => {
      toast.success(
        action === "deactivate"
          ? "Company banned. Owner signed out of all devices."
          : "Ban lifted. Their access now follows their subscription."
      );
      qc.invalidateQueries({ queryKey: ["admin", "companies", id] });
      qc.invalidateQueries({ queryKey: ["admin", "companies"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      setConfirmModal(null);
      setBanReason("");
    },
    onError: (err) => {
      toast.error(errorMessageWithId(parseApiError(err)));
    },
  });

  if (companyQ.isError) {
    // Only a 404 (or a malformed id, 400) means the company does not exist. A 500, a
    // timeout or an offline laptop used to read as "Company not found" too, which sent
    // admins looking for a deleted company that was fine (FE-12).
    const { status } = parseApiError(companyQ.error);
    if (status !== 404 && status !== 400) {
      return (
        <DashboardShell title="Company Detail" requiredRole="super_admin">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/admin/companies"
              className="inline-flex items-center gap-1 py-1.5 -mt-1.5 mb-2.5 text-sm text-slate-500 hover:text-primary-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Companies
            </Link>
            <QueryErrorState error={companyQ.error} onRetry={() => companyQ.refetch()} resource="this company" />
          </div>
        </DashboardShell>
      );
    }
    return (
      <DashboardShell title="Company Not Found" requiredRole="super_admin">
        <div className="text-center py-12">
          <p className="text-slate-500">Company not found.</p>
          <Link href="/admin/companies" className="mt-4 inline-block">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Companies
            </Button>
          </Link>
        </div>
      </DashboardShell>
    );
  }

  if (companyQ.isLoading || !company) {
    return (
      <DashboardShell title="Company Detail" requiredRole="super_admin">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="h-6 w-32 bg-slate-200 rounded" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64 bg-slate-100 rounded-2xl" />
            <div className="h-64 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  const isFuelStation = company.businessType === "fuel_station";
  const BizIcon = isFuelStation ? Fuel : Store;
  const badge = getCompanyBadge(company);
  const toggleAction = getAdminToggleAction(company);

  return (
    <DashboardShell title="Company Detail" requiredRole="super_admin">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/companies"
          className="inline-flex items-center gap-1 py-1.5 -mt-1.5 mb-2.5 text-sm text-slate-500 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Companies
        </Link>

        <Card className="mb-6">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="h-16 w-16 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0" aria-hidden="true">
              <BizIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-800">{company.name}</h2>
              <p className="text-sm text-slate-500 mt-1 font-mono">{company.registrationNumber}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="brand">{isFuelStation ? "Fuel Station" : "Shop"}</Badge>
                {/* Banned beats everything, then live complimentary access, then the precise
                    subscription state — see getCompanyBadge. The subscription state alone once
                    labelled a banned company "Active". */}
                <Badge variant={badge.tone}>{badge.label}</Badge>
                {company.promoEmailOptIn && <Badge variant="info">Promo opt-in</Badge>}
              </div>
            </div>
            {/* Keyed off whether the company is banned, not off the status badge —
                an expired company is inactive but was never banned, and offering it
                "Activate" only ever produced an error. See getAdminToggleAction. */}
            <Button
              variant={toggleAction === "deactivate" ? "danger" : "primary"}
              onClick={() => setConfirmModal(toggleAction)}
              disabled={confirmModal !== null || toggleMut.isPending}
              className="shrink-0"
            >
              <Power className="h-4 w-4" aria-hidden="true" />
              {TOGGLE_LABEL[toggleAction]}
            </Button>
          </CardContent>
        </Card>

        {/* Subscription, trial and complimentary-access controls. Full width: it holds
            the burned-identifier list, which needs the room. */}
        <div className="mb-4 sm:mb-6">
          <SubscriptionPanel company={company} />
        </div>

        {/* Deletion actioned on the customer's behalf — the privacy policy points them
            at support, and until this existed there was no way to honour that. */}
        <DeletionCard companyId={company.id} companyName={company.name} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-h4 font-heading font-semibold text-slate-800">Company Info</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <Detail icon={Building2} label="Business Type" value={isFuelStation ? "Fuel Station" : "Shop"} />
              <Detail icon={MapPin} label="Address" value={formatAddress(company)} />
              <Detail icon={Mail} label="Contact Email" value={company.contactEmail} />
              <Detail icon={Phone} label="Contact Phone" value={company.contactPhone} mono />
              {company.whatsappNumber && (
                <Detail icon={MessageCircle} label="WhatsApp" value={company.whatsappNumber} mono />
              )}
              <Detail icon={Calendar} label="Joined" value={formatDate(company.joinedAt)} />
              {company.deactivatedAt && (
                <Detail icon={Calendar} label="Deactivated" value={formatDate(company.deactivatedAt)} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-h4 font-heading font-semibold text-slate-800">Owner Account</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.owner ? (
                <>
                  <Detail icon={User} label="Username" value={company.owner.username} mono />
                  <Detail icon={Mail} label="Login Email" value={company.owner.email} />
                  {/* "Sign-in", not "Account Status".
                      This measures whether the owner can log in — nothing else. The
                      badge at the top of the page measures whether the BUSINESS is
                      entitled to operate. Both were labelled "status" and both used the
                      word "Active", so a pending company with a working login read as a
                      contradiction. They are not in conflict: only a ban stops sign-in,
                      precisely so a lapsed customer can still log in to pay or export. */}
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-sm text-slate-600">Sign-in:</span>
                    <Badge variant={company.owner.isActive ? "success" : "error"}>
                      {company.owner.isActive ? "Allowed" : "Blocked"}
                    </Badge>
                  </div>
                  {/* The usual reason a company sits at Pending forever: the trial clock
                      starts on verification, so an unverified owner never gets one. It
                      was not shown anywhere, leaving no way to tell a stuck company from
                      one that simply hasn't paid. */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">Email verified:</span>
                    <Badge variant={company.owner.emailVerifiedAt ? "success" : "warning"}>
                      {company.owner.emailVerifiedAt ? "Yes" : "Not yet"}
                    </Badge>
                  </div>
                  {!company.owner.emailVerifiedAt && (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Their trial has not started, and will not until they confirm this
                      address. You can start one for them with <strong>Grant trial</strong> above.
                    </p>
                  )}
                  {/* Only an admin-onboarded company has an invite to resend. A self-signup
                      gets a verification email instead, which the owner resends from
                      their own paywall. */}
                  {company.createdByAdmin === true && !company.owner.emailVerifiedAt && (
                    <Button variant="secondary" size="sm" onClick={() => setConfirmResend(true)}>
                      <Send className="h-4 w-4" aria-hidden="true" /> Resend invite
                    </Button>
                  )}
                  {company.owner.lastLoginAt && (
                    <Detail icon={Calendar} label="Last Login" value={formatDateTime(company.owner.lastLoginAt)} />
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500">No owner data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Read-only customers, purchases, draws and audit trail — what support needs
            to answer "what does this owner see?" without signing in as them. */}
        <CompanyRecordsTabs company={company} />
      </div>

      <ConfirmDialog
        open={confirmResend}
        onClose={() => setConfirmResend(false)}
        onConfirm={() => resendM.mutate()}
        title="Resend invite?"
        confirmLabel={<><Send className="h-4 w-4" aria-hidden="true" /> Send invite</>}
        isLoading={resendM.isPending}
        error={resendM.error}
      >
        <p className="text-sm text-slate-600">
          We&apos;ll email a fresh invite to{" "}
          <strong className="break-all text-slate-800">{company.owner?.email ?? "the owner"}</strong>{" "}
          so they can confirm the address and sign in.
        </p>
      </ConfirmDialog>

      {confirmModal && (
        <ConfirmDialog
          open={true}
          // Cancel, Escape and the X all close through here — the reason is cleared on
          // every path, so it never survives into the next ban dialog.
          onClose={() => { setConfirmModal(null); setBanReason(""); }}
          onConfirm={() => toggleMut.mutate(confirmModal)}
          title={`${TOGGLE_LABEL[confirmModal]} — ${company.name}`}
          size="md"
          confirmLabel={TOGGLE_LABEL[confirmModal]}
          confirmVariant={confirmModal === "activate" ? "primary" : "danger"}
          isLoading={toggleMut.isPending}
          error={toggleMut.error}
          confirmDisabled={confirmModal === "deactivate" && banReason.trim().length < 3}
        >
          <p className="text-sm text-slate-600">
            {confirmModal === "activate"
              ? "This lifts the ban and lets the owner log in again. Access is then decided by their subscription — if it has expired or never started, they will land on the paywall rather than a working dashboard."
              : "This blocks the owner from logging in at all and signs them out everywhere. It does not cancel any subscription — it overrides it."}
          </p>
          {confirmModal === "deactivate" && (
            <>
              <p className="text-sm text-error-600 mt-3 bg-error-50 border border-error-100 rounded-lg p-3">
                <span aria-hidden="true">⚠</span>{" "}The owner is signed out of every device immediately and cannot log in again until the ban is lifted. They also cannot export their data while banned.
              </p>
              {/* Mandatory — see the matching note on the companies list. The reason is
                  stored on the company and written to the audit log, so a ban can be
                  explained later without reading server logs. */}
              <label htmlFor="ban-reason" className="mt-4 block text-sm font-medium text-slate-700">
                Why are you banning this company?
              </label>
              <textarea
                id="ban-reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
                maxLength={255}
                placeholder="e.g. Fraudulent purchase data reported by the owner's customers"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">
                Stored against the company and written to the audit log. Minimum 3 characters.
              </p>
            </>
          )}
        </ConfirmDialog>
      )}
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
      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0" aria-hidden="true">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-sm text-slate-800 ${mono ? "font-mono" : ""} break-words`}>{value}</p>
      </div>
    </div>
  );
}
