"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarX, ShieldAlert, Trash2, Undo2 } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, Input, Modal } from "@/components/ui";
import { adminService } from "@/services/admin.service";
import { parseApiError, errorMessageWithId } from "@/lib/errors";
import { formatDate } from "@/lib/utils";

interface DeletionCardProps {
  companyId: string;
  companyName: string;
}

/**
 * Lets support action the deletion request a customer sent by email.
 *
 * This exists because the privacy policy says "request deletion by contacting
 * support@kimates.com" — and every deletion endpoint until now required the *customer*
 * to be logged in. The promise was unfulfillable: whoever read that mailbox had no way
 * to carry it out, and the alternative was hand-editing five tables in psql, where the
 * rules differ per table (purchases and customers hard-deleted, company and owner
 * scrubbed in place, payments and subscriptions retained as the money ledger, trial
 * identities deliberately kept).
 */
export function DeletionCard({ companyId, companyName }: Readonly<DeletionCardProps>) {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<"request" | "cancel" | null>(null);
  const [reason, setReason] = useState("");

  const statusQ = useQuery({
    queryKey: ["admin", "deletion", companyId],
    queryFn: () => adminService.getDeletionStatus(companyId),
  });

  const close = (): void => {
    setModal(null);
    setReason("");
  };

  const refresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "deletion", companyId] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "companies", companyId] });
  };

  const onError = (err: unknown): void => {
    toast.error(errorMessageWithId(parseApiError(err)));
  };

  const requestMut = useMutation({
    mutationFn: () => adminService.requestDeletion(companyId, reason),
    onSuccess: async (s) => {
      toast.success(
        s.purgeAt ? `Scheduled. Data is erased on ${formatDate(s.purgeAt)}.` : "Deletion scheduled.",
      );
      await refresh();
      close();
    },
    onError,
  });

  const cancelMut = useMutation({
    mutationFn: () => adminService.cancelDeletion(companyId, reason),
    onSuccess: async () => {
      toast.success("Called off. Nothing will be erased.");
      await refresh();
      close();
    },
    onError,
  });

  const status = statusQ.data;
  const pending = status?.requested === true;

  return (
    <>
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-h4 font-heading font-semibold text-slate-800">Account deletion</h3>
            {pending && <Badge variant="error">Scheduled</Badge>}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {pending ? (
            <>
              <p className="flex items-start gap-2 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-800">
                <CalendarX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Data is erased on{" "}
                  <strong>{status?.purgeAt ? formatDate(status.purgeAt) : "—"}</strong>
                  {status?.daysRemaining !== null && status?.daysRemaining !== undefined && (
                    <> — {status.daysRemaining} day{status.daysRemaining === 1 ? "" : "s"} left</>
                  )}
                  . The customer keeps full access and can still export until then, and this can
                  be called off any time before it runs.
                </span>
              </p>
              <Button variant="secondary" size="sm" onClick={() => setModal("cancel")}>
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                Call off deletion
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500">
                Use this when a customer emails support asking to close their account. It starts a
                30-day grace period — nothing is erased until then, and they keep working
                throughout.
              </p>
              <Button variant="ghost" size="sm" onClick={() => setModal("request")}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Schedule deletion
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Schedule ── */}
      <Modal
        open={modal === "request"}
        onClose={close}
        title="Schedule account deletion"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => requestMut.mutate()}
              disabled={requestMut.isPending || reason.trim().length < 3}
            >
              {requestMut.isPending ? "Scheduling…" : "Schedule deletion"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-800">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {/* Spelled out because it is genuinely irreversible once it runs, and the
                person clicking is acting for someone who is not in the room. */}
            <span>
              After 30 days, every purchase and customer record for{" "}
              <strong>{companyName}</strong> is permanently erased and the account details are
              scrubbed. This cannot be undone once it runs.
            </span>
          </p>
          <p className="text-sm text-slate-600">
            Billing stops immediately. They keep access and can export their data for the whole 30
            days, and you can call this off at any point before it runs.
          </p>
          <Input
            label="Who asked, and how"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Owner emailed support@kimates.com on 7 Aug"
            helperText="Required, and kept on the record — the email is the only other evidence this was requested."
          />
        </div>
      </Modal>

      {/* ── Call off ── */}
      <Modal
        open={modal === "cancel"}
        onClose={close}
        title="Call off deletion"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Keep it scheduled
            </Button>
            <Button
              onClick={() => cancelMut.mutate()}
              disabled={cancelMut.isPending || reason.trim().length < 3}
            >
              {cancelMut.isPending ? "Saving…" : "Call it off"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Nothing will be erased. Note that their subscription was cancelled when the request
            was made and <strong>is not restored</strong> — PayPal cancellations are final, so
            they&apos;ll need to subscribe again.
          </p>
          <Input
            label="Why"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer changed their mind"
            helperText="Required, and kept on the record."
          />
        </div>
      </Modal>
    </>
  );
}
