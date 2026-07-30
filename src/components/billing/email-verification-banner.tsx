"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { MailWarning } from "lucide-react";
import { Button } from "@/components/ui";
import { authService } from "@/services";
import { parseApiError } from "@/lib/errors";

interface EmailVerificationBannerProps {
  /** From `GET /company/profile`. Optional so an older backend simply renders nothing. */
  emailVerified?: boolean;
  /** The address the link was sent to, shown so a typo is obvious. */
  email?: string;
}

/**
 * Shown until the owner confirms their address. This is not merely cosmetic — from
 * Phase 3 the free-trial clock does not start until verification, so an unverified
 * account is sitting idle rather than quietly burning trial days.
 */
export function EmailVerificationBanner({
  emailVerified,
  email,
}: Readonly<EmailVerificationBannerProps>) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  // `undefined` means the backend predates this field — render nothing rather than
  // nagging every user with a banner we can't substantiate.
  if (emailVerified !== false) return null;

  const handleResend = async () => {
    setIsSending(true);
    try {
      await authService.resendEmailVerification();
      setSent(true);
      toast.success("Verification email sent. Please check your inbox.");
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.status === 429) {
        toast.error(
          parsed.message || "Too many requests. Please wait a few minutes and try again.",
        );
      } else {
        toast.error(parsed.message || "Couldn't send the email. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      role="status"
      className="mb-5 flex flex-col gap-3 rounded-xl border border-warning-100 bg-warning-50 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning-100"
          aria-hidden="true"
        >
          <MailWarning className="h-4 w-4 text-warning-700" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-warning-700">Confirm your email address</p>
          <p className="mt-0.5 text-sm leading-relaxed text-warning-700/90">
            {email ? (
              <>
                We sent a confirmation link to <strong className="break-all">{email}</strong>.
              </>
            ) : (
              <>We sent you a confirmation link.</>
            )}{" "}
            Your free trial starts once you confirm, so none of it is spent waiting.
          </p>
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleResend}
        isLoading={isSending}
        disabled={sent}
        className="shrink-0 self-start sm:self-auto"
      >
        {sent ? "Email sent" : "Resend email"}
      </Button>
    </div>
  );
}
