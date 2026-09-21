"use client";

import { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { TriangleAlert } from "lucide-react";
import { ConfirmDialog } from "@/components/ui";
import { companyService } from "@/services";
import { parseApiError, errorMessageWithId, fieldErrorsFromDetails } from "@/lib/errors";
import { VOID_REASON_MAX, validateVoidReason } from "@/lib/void";

/**
 * Confirms and performs a purchase void.
 *
 * A reason is required, and the dialog spells out every consequence before the button
 * is pressed, because a void cannot be undone and it silently changes numbers the owner
 * relies on elsewhere: totals, reports and who can win the lucky draw.
 */
export function VoidPurchaseModal({
  purchase,
  onClose,
  onVoided,
}: Readonly<{
  /** Null keeps the dialog closed. */
  purchase: { id: string; invoiceNumber: string } | null;
  onClose: () => void;
  onVoided?: () => void;
}>) {
  const qc = useQueryClient();
  const fieldId = useId();
  const [reason, setReason] = useState("");
  // Validation shows after the first submit attempt, not on the first keystroke —
  // "must be at least 3 characters" flashing as someone types the first letter is noise.
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const clientError = validateVoidReason(reason);
  const error = serverError ?? (attempted ? clientError : null);

  const close = () => {
    setReason("");
    setAttempted(false);
    setServerError(null);
    onClose();
  };

  const voidM = useMutation({
    mutationFn: () => companyService.voidPurchase(purchase!.id, reason.trim()),
    onSuccess: async (res) => {
      toast.success(res.message ?? `Invoice ${purchase?.invoiceNumber} voided.`);
      // Every number derived from purchases is now stale. Prefix keys, so each page,
      // filter and detail view of these lists is refreshed, not only the current one.
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["company", "purchases"] }),
        qc.invalidateQueries({ queryKey: ["company", "customers"] }),
        qc.invalidateQueries({ queryKey: ["company", "stats"] }),
        qc.invalidateQueries({ queryKey: ["company", "draws"] }),
      ]);
      onVoided?.();
      close();
    },
    onError: (err) => {
      const parsed = parseApiError(err);
      const fields = fieldErrorsFromDetails(parsed.details);
      if (fields.reason) setServerError(fields.reason);
      else toast.error(errorMessageWithId(parsed));
    },
  });

  const submit = () => {
    setAttempted(true);
    if (clientError || voidM.isPending) return;
    voidM.mutate();
  };

  return (
    <ConfirmDialog
      open={purchase !== null}
      onClose={close}
      onConfirm={submit}
      title="Void this purchase?"
      role="alertdialog"
      size="md"
      cancelDisabled={voidM.isPending}
      confirmLabel="Void purchase"
      confirmVariant="danger"
      isLoading={voidM.isPending}
      error={voidM.error}
    >
      {purchase && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Invoice <span className="font-mono font-semibold text-slate-800">{purchase.invoiceNumber}</span>
          </p>
          <div className="rounded-lg border border-error-100 bg-error-50 p-3 text-sm text-error-700">
            <p className="flex items-center gap-2 font-semibold">
              <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              This can&apos;t be undone.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>The purchase stays in your list, marked <strong>Voided</strong>, with your reason.</li>
              <li>It is removed from your totals, reports and customer spend.</li>
              <li>It is no longer an entry in the lucky draw.</li>
            </ul>
          </div>
          <div>
            <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
              Why are you voiding it?
            </label>
            <textarea
              id={fieldId}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setServerError(null);
              }}
              rows={3}
              maxLength={VOID_REASON_MAX + 50}
              placeholder="e.g. Duplicate submission — the customer scanned twice"
              aria-invalid={Boolean(error)}
              aria-describedby={`${fieldId}-hint${error ? ` ${fieldId}-error` : ""}`}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-base sm:text-sm text-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
            />
            <div className="mt-1 flex justify-between gap-3 text-xs">
              <span id={`${fieldId}-hint`} className="text-slate-500">
                Required, 3–{VOID_REASON_MAX} characters.
              </span>
              <span
                className={reason.trim().length > VOID_REASON_MAX ? "text-error-600" : "text-slate-500"}
                aria-hidden="true"
              >
                {reason.trim().length}/{VOID_REASON_MAX}
              </span>
            </div>
            {error && (
              <p id={`${fieldId}-error`} role="alert" className="mt-1 text-[13px] text-error-500">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}
