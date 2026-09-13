"use client";

import { useState } from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { actionErrorMessage } from "@/lib/errors";

type ButtonVariant = React.ComponentProps<typeof Button>["variant"];

export interface ConfirmDialogProps {
  open: boolean;
  /** Every dismissal path — Cancel, Escape, the X and the overlay — goes through here. */
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  /** The explanation, and any field the action needs (a reason, a checkbox). */
  children: React.ReactNode;
  confirmLabel: React.ReactNode;
  cancelLabel?: React.ReactNode;
  /** Omit for the Button default (primary); "danger" for destructive actions. */
  confirmVariant?: ButtonVariant;
  /** Spinner on the confirm button while the action runs. */
  isLoading?: boolean;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  size?: "sm" | "md" | "lg";
  role?: "dialog" | "alertdialog";
  /**
   * The action's failure — pass the mutation's `error` straight through. Shown inside
   * the dialog, so a failed confirm (a 429 included) can never look like a dialog that
   * simply did nothing. An error that already existed when the dialog opened (left over
   * from a previous attempt) is not shown.
   */
  error?: unknown;
}

/**
 * The one confirm dialog (CON-4).
 *
 * Every "are you sure?" in the app used to hand-roll the same Modal + footer, and each
 * copy had to get two things right on its own: a stable focus (FE-1 — fixed once in
 * Modal) and clearing its own state on EVERY close path, not only Cancel (FE-6). Here
 * Cancel and every other dismissal share `onClose`, so a caller that resets its state
 * in `onClose` is correct on all of them.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmVariant,
  isLoading,
  confirmDisabled,
  cancelDisabled,
  size = "sm",
  role,
  error,
}: Readonly<ConfirmDialogProps>) {
  // The error present at the moment the dialog (re)opened belongs to an earlier attempt.
  // Mutation errors are new objects per failure, so identity is enough to tell them apart.
  // (State adjusted during render — React's pattern for deriving from a changed prop.)
  const [prevOpen, setPrevOpen] = useState(open);
  const [staleError, setStaleError] = useState<unknown>(error);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setStaleError(error);
  }
  const shownError = error && error !== staleError && !isLoading ? error : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      {...(role ? { role } : {})}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={cancelDisabled}>
            {cancelLabel}
          </Button>
          <Button
            {...(confirmVariant ? { variant: confirmVariant } : {})}
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={confirmDisabled || isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      {shownError ? (
        <p role="alert" className="mt-3 text-sm text-error-600 bg-error-50 border border-error-100 rounded-lg p-3">
          {actionErrorMessage(shownError)}
        </p>
      ) : null}
    </Modal>
  );
}
