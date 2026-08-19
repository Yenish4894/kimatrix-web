"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, KeyRound, Mail, Phone, Sparkles, Undo2 } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, Input, Modal } from "@/components/ui";
import { adminService, type AdminTrialIdentity } from "@/services/admin.service";
import { parseApiError, errorMessageWithId } from "@/lib/errors";
import { formatDate } from "@/lib/utils";
import type { Company } from "@/types";
import { GrantTrialModal } from "@/components/admin/grant-trial-modal";

interface SubscriptionPanelProps {
  company: Company;
}

const STATUS_TONE: Record<string, "success" | "warning" | "error" | "info"> = {
  active: "success",
  trialing: "info",
  pending: "warning",
  trial_expired: "error",
  expired: "error",
  past_due: "warning",
  deactivated: "error",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "On free trial",
  pending: "Never subscribed",
  trial_expired: "Trial expired",
  expired: "Subscription expired",
  past_due: "Payment failed",
  deactivated: "Deactivated",
};

export function SubscriptionPanel({ company }: Readonly<SubscriptionPanelProps>) {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<"trial" | "comp" | "release" | null>(null);
  const [compReason, setCompReason] = useState("");
  const [compUntil, setCompUntil] = useState("");
  const [releaseTarget, setReleaseTarget] = useState<AdminTrialIdentity | null>(null);
  const [releaseReason, setReleaseReason] = useState("");

  const status = company.subscriptionStatus ?? "pending";
  const isComped = company.isComped === true;

  const identitiesQ = useQuery({
    queryKey: ["admin", "trial-identities", company.id],
    queryFn: () => adminService.getTrialIdentities(company.id),
  });

  const refresh = async (): Promise<void> => {
    // Must match the detail page's key exactly — `["admin", "companies", id]`, plural.
    // With a mismatched key the mutation succeeds, the toast fires, and the card above
    // keeps showing the old trial date until a manual reload.
    await queryClient.invalidateQueries({ queryKey: ["admin", "companies", company.id] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "trial-identities", company.id] });
  };

  const close = (): void => {
    setModal(null);
    setReleaseTarget(null);
    setReleaseReason("");
  };

  const onError = (err: unknown): void => {
    const parsed = parseApiError(err);
    toast.error(errorMessageWithId(parsed));
  };

  const compMut = useMutation({
    mutationFn: (grant: boolean) =>
      adminService.setComp(
        company.id,
        grant
          ? {
              isComped: true,
              reason: compReason,
              // Empty means perpetual. Sent explicitly as null rather than omitted so
              // the intent is unambiguous on the wire.
              compedUntil: compUntil ? new Date(compUntil).toISOString() : null,
            }
          : { isComped: false },
      ),
    onSuccess: async (_r, grant) => {
      toast.success(grant ? "Complimentary access granted." : "Complimentary access removed.");
      await refresh();
      close();
    },
    onError,
  });

  const releaseMut = useMutation({
    mutationFn: () => adminService.releaseTrialIdentity(releaseTarget!.id, releaseReason),
    onSuccess: async () => {
      toast.success("That identifier can be used for a free trial again.");
      await refresh();
      close();
    },
    onError,
  });

  const activeIdentities = identitiesQ.data?.filter((i) => i.releasedAt === null) ?? [];
  const releasedIdentities = identitiesQ.data?.filter((i) => i.releasedAt !== null) ?? [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-h4 font-heading font-semibold text-slate-800">Subscription</h3>
            <Badge variant={STATUS_TONE[status] ?? "warning"}>
              {STATUS_LABEL[status] ?? status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <dl className="space-y-2 text-sm">
            <Row label="Trial ends" value={company.trialEndsAt ? formatDate(company.trialEndsAt) : "—"} />
            <Row
              label="Paid until"
              value={company.subscriptionExpiresAt ? formatDate(company.subscriptionExpiresAt) : "—"}
            />
            <Row
              label="Complimentary"
              value={
                isComped
                  ? company.compedUntil
                    ? `Until ${formatDate(company.compedUntil)}`
                    : "Perpetual"
                  : "No"
              }
            />
            {isComped && company.compReason && (
              <Row label="Reason" value={company.compReason} />
            )}
          </dl>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => setModal("trial")}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {company.trialEndsAt ? "Extend trial" : "Grant trial"}
            </Button>
            {isComped ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => compMut.mutate(false)}
                disabled={compMut.isPending}
              >
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                Remove complimentary access
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setModal("comp")}>
                <Gift className="h-4 w-4" aria-hidden="true" />
                Grant complimentary access
              </Button>
            )}
          </div>

          {/* Burned trial identifiers */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <KeyRound className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Trial identifiers
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Each of these has used its one free trial. Releasing one lets it start a trial again
              — use it if someone entered a number or address that was not theirs.
            </p>

            {identitiesQ.isLoading ? (
              <p className="mt-3 text-sm text-slate-400">Loading…</p>
            ) : activeIdentities.length === 0 && releasedIdentities.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                None — this company has not taken a free trial.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {activeIdentities.map((identity) => (
                  <li
                    key={identity.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span className="flex items-center gap-2 font-mono text-sm text-slate-700">
                      {identity.type === "email" ? (
                        <Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      ) : (
                        <Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      )}
                      {identity.preview}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReleaseTarget(identity);
                        setModal("release");
                      }}
                    >
                      Release
                    </Button>
                  </li>
                ))}
                {releasedIdentities.map((identity) => (
                  <li
                    key={identity.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-slate-400"
                  >
                    <span className="font-mono text-sm line-through">{identity.preview}</span>
                    <span className="text-xs">
                      Released {identity.releasedAt ? formatDate(identity.releasedAt) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <GrantTrialModal
        company={modal === "trial" ? company : null}
        onClose={close}
        onGranted={refresh}
      />

      {/* ── Grant complimentary access ── */}
      <Modal
        open={modal === "comp"}
        onClose={close}
        title="Grant complimentary access"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={() => compMut.mutate(true)}
              disabled={compMut.isPending || compReason.trim().length === 0}
            >
              {compMut.isPending ? "Saving…" : "Grant"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This gives full access without payment. It overrides everything else, including an
            expired subscription.
          </p>
          <Input
            label="Reason"
            required
            value={compReason}
            onChange={(e) => setCompReason(e.target.value)}
            placeholder="e.g. Launch partner — agreed with founder"
            helperText="Required. Someone reading this in six months needs to know why."
          />
          <Input
            label="Until (optional)"
            type="date"
            value={compUntil}
            onChange={(e) => setCompUntil(e.target.value)}
            helperText="Leave empty for permanent complimentary access."
          />
        </div>
      </Modal>

      {/* ── Release a burned identifier ── */}
      <Modal
        open={modal === "release"}
        onClose={close}
        title="Release this identifier"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={() => releaseMut.mutate()}
              disabled={releaseMut.isPending || releaseReason.trim().length < 3}
            >
              {releaseMut.isPending ? "Saving…" : "Release"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            <span className="font-mono font-medium text-slate-800">{releaseTarget?.preview}</span>{" "}
            will be able to start a free trial again, on this or any other account.
          </p>
          <Input
            label="Reason"
            required
            value={releaseReason}
            onChange={(e) => setReleaseReason(e.target.value)}
            placeholder="e.g. Entered by a third party in error"
            helperText="Required, and kept on the record."
          />
        </div>
      </Modal>
    </>
  );
}

function Row({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1.5 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}
