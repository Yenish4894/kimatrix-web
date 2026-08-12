"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Building2, Mail, Phone, MessageCircle, MapPin,
  Calendar, User, Fuel, Store, Power,
} from "lucide-react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent, CardHeader, Badge, Button, Modal } from "@/components/ui";
import { formatDate, formatDateTime, formatAddress } from "@/lib/utils";
import { adminService } from "@/services";
import { parseApiError, errorMessageWithId } from "@/lib/errors";
import {
  getAdminToggleAction,
  getCompanyStatus,
  STATUS_BADGE_VARIANT,
  STATUS_LABEL,
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

  const companyQ = useQuery({
    queryKey: ["admin", "companies", id],
    queryFn: () => adminService.getCompany(id),
  });
  const company = companyQ.data;

  const toggleMut = useMutation({
    mutationFn: async (action: "activate" | "deactivate") => {
      if (action === "deactivate") {
        await adminService.deactivateCompany(id);
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
    },
    onError: (err) => {
      toast.error(errorMessageWithId(parseApiError(err)));
    },
  });

  if (companyQ.isError) {
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
  const status = getCompanyStatus(company);
  const toggleAction = getAdminToggleAction(company);

  return (
    <DashboardShell title="Company Detail" requiredRole="super_admin">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/companies"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 mb-4"
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
                <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
                {company.promoEmailOptIn && <Badge variant="info">Promo opt-in</Badge>}
              </div>
            </div>
            {/* Keyed off whether the company is banned, not off the status badge —
                an expired company is inactive but was never banned, and offering it
                "Activate" only ever produced an error. See getAdminToggleAction. */}
            <Button
              variant={toggleAction === "deactivate" ? "danger" : "primary"}
              onClick={() => setConfirmModal(toggleAction)}
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
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-sm text-slate-600">Account Status:</span>
                    <Badge variant={company.owner.isActive ? "success" : "error"}>
                      {company.owner.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
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
      </div>

      {confirmModal && (
        <Modal
          open={true}
          onClose={() => setConfirmModal(null)}
          title={`${TOGGLE_LABEL[confirmModal]} — ${company.name}`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button
                variant={confirmModal === "activate" ? "primary" : "danger"}
                isLoading={toggleMut.isPending}
                onClick={() => toggleMut.mutate(confirmModal)}
              >
                {TOGGLE_LABEL[confirmModal]}
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            {confirmModal === "activate"
              ? "This lifts the ban and lets the owner log in again. Access is then decided by their subscription — if it has expired or never started, they will land on the paywall rather than a working dashboard."
              : "This blocks the owner from logging in at all and signs them out everywhere. It does not cancel any subscription — it overrides it."}
          </p>
          {confirmModal === "deactivate" && (
            <p className="text-sm text-error-600 mt-3 bg-error-50 border border-error-100 rounded-lg p-3">
              <span aria-hidden="true">⚠</span>{" "}The owner is signed out of every device immediately and cannot log in again until the ban is lifted.
            </p>
          )}
        </Modal>
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
