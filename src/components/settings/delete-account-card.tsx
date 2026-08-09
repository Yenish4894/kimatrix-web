"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarX, Download, Trash2, Undo2 } from "lucide-react";
import { Button, Card, CardContent, CardHeader, Input, Modal } from "@/components/ui";
import { companyService } from "@/services/company.service";
import { parseApiError, errorMessageWithId } from "@/lib/errors";
import { formatDate } from "@/lib/utils";

const CONFIRM_WORD = "DELETE";

/**
 * Self-service account closure.
 *
 * The privacy policy directs customers to email support, and that route works (an
 * admin can action it), but making somebody write an email to leave is a dark pattern
 * — easy to sign up, hard to go. This gives them the same 30-day grace period without
 * the round trip.
 *
 * Nothing here is a one-click destructive action: it takes a typed confirmation, and
 * the whole point of the grace period is that it stays reversible until it runs.
 */
export function DeleteAccountCard() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<"request" | "cancel" | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const statusQ = useQuery({
    queryKey: ["company", "deletion"],
    queryFn: companyService.getDeletionStatus,
  });

  const close = (): void => {
    setModal(null);
    setConfirmText("");
  };

  const refresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ["company", "deletion"] });
  };

  const onError = (err: unknown): void => {
    toast.error(errorMessageWithId(parseApiError(err)));
  };

  const requestMut = useMutation({
    mutationFn: companyService.requestDeletion,
    onSuccess: async (s) => {
      toast.success(
        s.purgeAt
          ? `Scheduled. Your data is erased on ${formatDate(s.purgeAt)}.`
          : "Deletion scheduled.",
      );
      await refresh();
      close();
    },
    onError,
  });

  const cancelMut = useMutation({
    mutationFn: companyService.cancelDeletion,
    onSuccess: async () => {
      toast.success("Deletion called off. Nothing will be erased.");
      await refresh();
      close();
    },
    onError,
  });

  const status = statusQ.data;
  const pending = status?.requested === true;

  return (
    <>
      {/* Red border rather than a red card: this is a destructive area, but a settings
          page that shouts at you every visit is worse than one that stays calm. */}
      <Card className="border-error-200">
        <CardHeader>
          <h3 className="text-h4 font-heading font-semibold text-slate-800">Close your account</h3>
        </CardHeader>

        <CardContent className="space-y-4">
          {pending ? (
            <>
              <p className="flex items-start gap-2 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-800">
                <CalendarX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Your account closes on{" "}
                  <strong>{status?.purgeAt ? formatDate(status.purgeAt) : "—"}</strong>
                  {typeof status?.daysRemaining === "number" && (
                    <> — {status.daysRemaining} day{status.daysRemaining === 1 ? "" : "s"} left</>
                  )}
                  . Everything keeps working until then, and you can still download your data.
                </span>
              </p>
              <Button variant="secondary" size="sm" onClick={() => setModal("cancel")}>
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                Keep my account
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Closing your account starts a 30-day countdown. Nothing is deleted until then,
                everything keeps working, and you can change your mind at any point.
              </p>
              <p className="flex items-start gap-2 text-sm text-slate-500">
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                {/* Pointing at the export first is the honest order: once the 30 days are
                    up the purchase and customer records are gone for good. */}
                <span>
                  Download your customer and purchase data first — after 30 days it can&apos;t be
                  recovered.
                </span>
              </p>
              <Button variant="ghost" size="sm" onClick={() => setModal("request")}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Close my account
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Request ── */}
      <Modal
        open={modal === "request"}
        onClose={close}
        title="Close your account?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Keep my account
            </Button>
            <Button
              variant="danger"
              onClick={() => requestMut.mutate()}
              disabled={requestMut.isPending || confirmText.trim().toUpperCase() !== CONFIRM_WORD}
            >
              {requestMut.isPending ? "Scheduling…" : "Close my account"}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            You have <strong>30 days</strong> to change your mind. Until then your QR code, your
            dashboard and your data all keep working exactly as they do now.
          </p>
          <p className="rounded-lg bg-error-50 px-3 py-2 text-error-800">
            After 30 days every customer record and purchase is{" "}
            <strong>permanently erased</strong> and cannot be recovered.
          </p>
          <p>
            If you have a subscription it is cancelled straight away, so you will not be charged
            again — and because PayPal cancellations are final, coming back later means
            subscribing from scratch.
          </p>
          <Input
            label={`Type ${CONFIRM_WORD} to confirm`}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_WORD}
            autoComplete="off"
          />
        </div>
      </Modal>

      {/* ── Cancel ── */}
      <Modal
        open={modal === "cancel"}
        onClose={close}
        title="Keep your account?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Leave it scheduled
            </Button>
            <Button onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}>
              {cancelMut.isPending ? "Saving…" : "Keep my account"}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p>Nothing will be erased and your account carries on as normal.</p>
          <p>
            Note that your subscription was cancelled when you asked to close the account and is{" "}
            <strong>not restored</strong> — you&apos;ll need to choose a plan again from the
            billing page.
          </p>
        </div>
      </Modal>
    </>
  );
}
