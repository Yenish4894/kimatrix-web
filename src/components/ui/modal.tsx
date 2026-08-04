"use client";

import { useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  /**
   * When false the dialog cannot be dismissed: no close button, no overlay click, no
   * Escape. Used only by the paywall, where there is no "back to the page behind"
   * because the page behind is no longer the customer's to view.
   *
   * A non-dismissible dialog is only defensible when it offers real exits of its own.
   * The paywall offers three, all keyboard-reachable: subscribe, download my data, log
   * out. Do not set this false on a dialog that is merely important.
   *
   * Defaults to true, so all existing call sites keep their current behaviour.
   */
  dismissible?: boolean;
  /**
   * `alertdialog` tells a screen reader this interrupts the workflow and requires a
   * response, which is exactly right for the paywall and wrong for an ordinary form.
   */
  role?: "dialog" | "alertdialog";
  /**
   * Where to put focus on open. Without it the first focusable element wins, which on
   * the paywall is the primary "Choose a plan" button — fine, but the heading carries
   * the context a screen-reader user needs first.
   */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /**
   * Accessible name when the dialog draws its own header instead of using `title`.
   * A dialog with neither is announced only as "dialog", which tells a screen-reader
   * user nothing about what just interrupted them.
   */
  ariaLabel?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

// Focusable element selector — covers everything keyboard users can land on
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  className,
  dismissible = true,
  role = "dialog",
  initialFocusRef,
  ariaLabel,
}: Readonly<ModalProps>) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // The focus trap below still runs when non-dismissible: the dialog stays
        // keyboard-navigable, it just cannot be escaped out of.
        if (dismissible) onClose();
        return;
      }
      // Focus trap on Tab: cycle focus within the dialog
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose, dismissible]
  );

  useEffect(() => {
    if (!open) return;

    // Remember which element had focus before the modal opened, restore on close
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    // Move initial focus into the dialog (the first focusable, or the dialog root)
    const dialog = dialogRef.current;
    if (dialog) {
      const explicit = initialFocusRef?.current;
      const first = dialog.querySelector<HTMLElement>(FOCUSABLE);
      (explicit ?? first ?? dialog).focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [open, handleKeyDown, initialFocusRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay — a plain div, not a button. As a <button aria-label="Close dialog">
          it sat outside the aria-modal container and before it in DOM order, so screen
          readers announced a stray "Close dialog, button". Escape and the explicit
          close button already cover keyboard users. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-fade-in"
        {...(dismissible ? { onClick: onClose } : {})}
      />
      {/* Content */}
      <div
        ref={dialogRef}
        role={role}
        aria-modal="true"
        aria-label={title ?? ariaLabel}
        tabIndex={-1}
        className={cn(
          // flex + capped height so a tall body scrolls INSIDE the panel. Without this,
          // body scroll is locked and the mobile sheet is pinned to bottom-0, so
          // anything taller than the viewport had its top rendered off-screen and
          // permanently unreachable — the plan form was unusable on a phone.
          "relative w-full mx-4 bg-white rounded-2xl shadow-[0_24px_48px_-12px_rgba(15,23,42,0.25),0_0_0_1px_rgba(15,23,42,0.06)] animate-scale-in focus:outline-none",
          "flex flex-col max-h-[85dvh]",
          "max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:mx-0 max-sm:rounded-b-none max-sm:animate-slide-up max-sm:max-h-[92dvh]",
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h3 className="text-h3 font-heading font-semibold text-slate-800">{title}</h3>
            {dismissible && (
            <button
              onClick={onClose}
              className="tap-target h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Close"
              type="button"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            )}
          </div>
        )}
        {/* Body — scrolls independently; overscroll-contain stops the page behind it
            from scrolling once the body hits its end. */}
        <div className="px-6 py-4 overflow-y-auto overscroll-contain">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
