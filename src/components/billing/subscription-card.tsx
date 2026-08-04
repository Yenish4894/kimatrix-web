"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, RefreshCw, XCircle } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, Modal, Select } from "@/components/ui";
import { paymentService } from "@/services/payment.service";
import { parseApiError, errorMessageWithId } from "@/lib/errors";
import { formatDate } from "@/lib/utils";
import { invalidateCompanyProfile } from "@/hooks/useCompanyProfile";
import type { SubscriptionPlan } from "@/types";

interface SubscriptionCardProps {
  plans: SubscriptionPlan[];
}

const STATUS_COPY: Record<string, { label: string; tone: "success" | "warning" | "error" | "info" }> = {
  active: { label: "Active", tone: "success" },
  past_due: { label: "Payment failed", tone: "warning" },
  pending: { label: "Awaiting approval", tone: "info" },
  pending_cancel: { label: "Cancelled", tone: "warning" },
  cancelled: { label: "Cancelled", tone: "error" },
  expired: { label: "Expired", tone: "error" },
  suspended: { label: "Suspended", tone: "error" },
};

/**
 * Manage an existing recurring subscription.
 *
 * Renders nothing when there is no subscription — a customer who has never subscribed,
 * or who is on the legacy one-time Orders flow, should just see the plan picker.
 */
export function SubscriptionCard({ plans }: Readonly<SubscriptionCardProps>) {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<"cancel" | "change" | null>(null);
  const [targetPlanId, setTargetPlanId] = useState("");

  const statusQ = useQuery({
    queryKey: ["subscription", "status"],
    queryFn: paymentService.getSubscriptionStatus,
  });

  const refresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ["subscription", "status"] });
    await invalidateCompanyProfile(queryClient);
  };

  const onError = (err: unknown): void => {
    toast.error(errorMessageWithId(parseApiError(err)));
  };

  const cancelMut = useMutation({
    mutationFn: () => paymentService.cancelSubscription("Cancelled from the billing page"),
    onSuccess: async (result) => {
      toast.success(
        result.accessUntil
          ? `Cancelled. You keep access until ${formatDate(result.accessUntil)}.`
          : "Your subscription has been cancelled.",
      );
      await refresh();
      setModal(null);
    },
    onError,
  });

  const changeMut = useMutation({
    mutationFn: () => paymentService.changePlan(targetPlanId),
    onSuccess: async (result) => {
      if (result.approvalUrl) {
        // PayPal wants the buyer to re-approve — usually for a price increase.
        window.location.href = result.approvalUrl;
        return;
      }
      toast.success(
        result.effectiveFrom
          ? `Your plan changes on ${formatDate(result.effectiveFrom)}.`
          : "Your plan changes at your next renewal.",
      );
      await refresh();
      setModal(null);
    },
    onError,
  });

  const status = statusQ.data;
  if (!status || status.status === "none") return null;

  const copy = STATUS_COPY[status.status] ?? { label: status.status, tone: "info" as const };
  const canManage = status.status === "active" || status.status === "past_due";
  const otherPlans = plans.filter((p) => p.id !== status.planId);

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-h3 font-heading font-semibold text-slate-800">
              Your subscription
            </h2>
            <Badge variant={copy.tone}>{copy.label}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {status.status === "past_due" && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-accent-50 px-4 py-3 text-sm text-accent-900"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {/* Access is NOT cut off here: PayPal retries inside a period already paid
                  for, so the honest message is "we're retrying", not "you've lost access". */}
              <span>
                Your last payment didn&apos;t go through. PayPal will try again — your account
                stays active in the meantime. Check your payment method with PayPal.
              </span>
            </p>
          )}

          {status.accessUntilPeriodEnd && (
            <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span>
                You&apos;ve cancelled, and you keep full access for the time you&apos;ve already
                paid for. Nothing further will be charged.
              </span>
            </p>
          )}

          <dl className="space-y-2 text-sm">
            <Row label="Plan" value={status.planName ?? "—"} />
            <Row
              label={status.accessUntilPeriodEnd ? "Access until" : "Next payment"}
              value={
                status.nextBillingTime
                  ? formatDate(status.nextBillingTime)
                  : status.currentPeriodEnd
                    ? formatDate(status.currentPeriodEnd)
                    : "—"
              }
            />
          </dl>

          {canManage && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTargetPlanId(otherPlans[0]?.id ?? "");
                  setModal("change");
                }}
                disabled={otherPlans.length === 0}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Change plan
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setModal("cancel")}>
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Cancel subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Cancel ── */}
      <Modal
        open={modal === "cancel"}
        onClose={() => setModal(null)}
        title="Cancel your subscription?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Keep my subscription
            </Button>
            <Button variant="danger" onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}>
              {cancelMut.isPending ? "Cancelling…" : "Yes, cancel"}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            You&apos;ll keep full access until the end of the period you&apos;ve already paid for.
            Nothing further will be charged.
          </p>
          {/* Stated plainly because PayPal cancellation is terminal — there is no resume,
              and finding that out afterwards would be a genuinely unpleasant surprise. */}
          <p className="rounded-lg bg-accent-50 px-3 py-2 text-accent-900">
            <strong>This can&apos;t be undone.</strong> If you want to come back later you&apos;ll
            need to subscribe again from scratch — a cancelled subscription can&apos;t be resumed.
          </p>
          <p>Your customer data stays exactly as it is, and you can download it at any time.</p>
        </div>
      </Modal>

      {/* ── Change plan ── */}
      <Modal
        open={modal === "change"}
        onClose={() => setModal(null)}
        title="Change your plan"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => changeMut.mutate()}
              disabled={changeMut.isPending || !targetPlanId}
            >
              {changeMut.isPending ? "Saving…" : "Change plan"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="New plan"
            value={targetPlanId}
            onChange={(e) => setTargetPlanId(e.target.value)}
            options={otherPlans.map((p) => ({
              value: p.id,
              // Each plan's OWN currency — never the country-derived formatter, which
              // would render a USD plan with a local symbol and misstate the price.
              label: `${p.name} — ${p.currency} ${p.price} every ${p.durationDays} days`,
            }))}
          />
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {/* PayPal does not prorate, and the effective date varies by funding source,
                so we never promise a date we calculated ourselves. */}
            Your plan changes at your next renewal — you won&apos;t be charged today, and the
            time you&apos;ve already paid for is unaffected.
          </p>
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
