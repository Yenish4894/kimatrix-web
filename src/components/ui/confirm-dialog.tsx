"use client";

import { Modal } from "./modal";
import { Button } from "./button";

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
}: Readonly<ConfirmDialogProps>) {
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
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
