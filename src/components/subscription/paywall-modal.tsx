"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Download, LogOut, MailCheck } from "lucide-react";
import { Modal, Button } from "@/components/ui";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { authService } from "@/services/auth.service";
import { parseApiError } from "@/lib/errors";
import { toast } from "react-toastify";
import type { Entitlement } from "@/lib/entitlement";

interface PaywallModalProps {
  entitlement: Entitlement;
  companyName?: string;
  /**
   * `false` means the owner has never confirmed their email — and since the trial
   * clock only starts on confirmation, that is what is actually blocking them, not
   * money. `undefined` means an older backend that doesn't report it; treated as
   * "don't claim anything", so we fall back to the ordinary paywall.
   */
  emailVerified?: boolean;
}

function copyFor(
  entitlement: Entitlement,
  needsVerification: boolean,
): { heading: string; body: string } {
  // Checked before status, because for these customers the status is a SYMPTOM. They
  // are `pending` precisely because the confirmation email was never actioned — telling
  // them to buy a plan would take money for something they are entitled to free.
  if (needsVerification) {
    return {
      heading: "Confirm your email to start your free trial",
      body: "We sent a confirmation link when you signed up. Click it and your free trial starts straight away — no payment needed. If it never arrived, send yourself a new one below.",
    };
  }

  switch (entitlement.status) {
    case "trial_expired":
      return {
        heading: "Your free trial has ended",
        body: "Nothing has been deleted. Choose a plan and everything picks up exactly where it left off — the same QR code, the same customer list.",
      };
    case "expired":
      return {
        heading: "Your subscription has expired",
        body: "Your data is safe and untouched. Renew and everything resumes immediately — the same QR code, the same customer list.",
      };
    default:
      // `pending` — registered, never subscribed, and either ineligible for a trial or
      // yet to confirm their email. Deliberately never says which identifier was
      // already used; that would be an enumeration oracle and, more simply, it is not
      // information this person needs.
      return {
        heading: "Choose a plan to get started",
        body: "Pick a plan and your QR code goes live straight away. You'll be able to start collecting customer purchases immediately.",
      };
  }
}

/**
 * The blocking paywall.
 *
 * Non-dismissible on purpose — no close button, no overlay click, no Escape. That is
 * only defensible because it offers three real, keyboard-reachable exits: subscribe,
 * download your data, log out. The customer is never trapped. There is simply no
 * "dismiss back to the page behind", because the page behind is no longer theirs to
 * read.
 *
 * A deactivated account never reaches this: an admin-banned company gets a read-only
 * notice instead, since offering "choose a plan" to someone we just banned would take
 * their money and change nothing.
 */
export function PaywallModal({
  entitlement,
  companyName,
  emailVerified,
}: Readonly<PaywallModalProps>) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // Only `pending` can be caused by an unconfirmed email. Someone whose trial or
  // subscription has genuinely lapsed confirmed long ago, and offering them a
  // confirmation link would be nonsense.
  const needsVerification = emailVerified === false && entitlement.status === "pending";
  const { heading, body } = copyFor(entitlement, needsVerification);

  const handleResend = async (): Promise<void> => {
    setResending(true);
    try {
      await authService.resendEmailVerification();
      setResent(true);
      toast.success("Sent. Please check your inbox — and your spam folder.");
    } catch (err) {
      const parsed = parseApiError(err);
      toast.error(
        parsed.status === 429
          ? parsed.message || "Too many requests. Please wait a few minutes and try again."
          : parsed.message || "Couldn't send the email. Please try again.",
      );
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    await dispatch(logout());
    router.push("/login");
  };

  return (
    <Modal
      open
      onClose={() => {
        /* non-dismissible — see `dismissible={false}` below */
      }}
      dismissible={false}
      role="alertdialog"
      size="md"
      initialFocusRef={headingRef}
      ariaLabel={heading}
    >
      <div className="-mx-6 -mt-4">
        {/* Dark hero. `text-white` on the heading is REQUIRED, not decorative:
            globals.css sets `h1-h6 { color: #111827 }` in @layer base, so a heading on
            a dark background renders near-black and invisible without it. This has
            already caused three visible bugs in this codebase. */}
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <CreditCard className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-h2 font-heading font-semibold text-white focus:outline-none"
          >
            {heading}
          </h2>
          {companyName && <p className="mt-2 text-sm text-white/80">{companyName}</p>}
        </div>
      </div>

      <div className="pt-6 pb-2 text-center">
        <p className="text-body text-slate-600">{body}</p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {needsVerification ? (
          <>
            <Button
              onClick={() => void handleResend()}
              disabled={resending}
              className="w-full justify-center"
              size="lg"
            >
              <MailCheck className="h-4 w-4" aria-hidden="true" />
              {resending ? "Sending…" : resent ? "Sent — check your inbox" : "Resend confirmation email"}
            </Button>
            {/* Still offered, but secondary: someone who would rather just pay should
                not be prevented from doing so. */}
            <Button
              variant="secondary"
              onClick={() => router.push("/company/billing")}
              className="w-full justify-center"
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Choose a plan instead
            </Button>
          </>
        ) : (
          <Button
            onClick={() => router.push("/company/billing")}
            className="w-full justify-center"
            size="lg"
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            Choose a plan
          </Button>
        )}

        {entitlement.canExport && (
          <Button
            variant="secondary"
            onClick={() => router.push("/company/settings?export=1")}
            className="w-full justify-center"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download my data
          </Button>
        )}

        <Button variant="ghost" onClick={handleLogout} className="w-full justify-center">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        Your customer data stays exactly as it is. Nothing is deleted when a plan lapses.
      </p>
    </Modal>
  );
}
