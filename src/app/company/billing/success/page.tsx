"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Button } from "@/components/ui";
import { PageLoader } from "@/components/ui/loader";
import { paymentService } from "@/services/payment.service";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateCompanyProfile } from "@/hooks/useCompanyProfile";
import { parseApiError, errorMessageWithId } from "@/lib/errors";

type CaptureState = "loading" | "success" | "error";

// Inner component owns useSearchParams — must be inside a Suspense boundary
function CaptureHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  // Read `subscription_id` FIRST.
  //
  // A subscription return carries BOTH `subscription_id` and `token` — where `token`
  // is the billing-agreement token, not an order id. Checking `token` first (as this
  // did) therefore sent a BA token to captureOrder on every subscription approval,
  // which fails and leaves the customer staring at an error after they have just paid.
  const paypalSubscriptionId = searchParams.get("subscription_id");
  const paypalOrderId = paypalSubscriptionId ? null : searchParams.get("token");

  const [state, setState] = useState<CaptureState>("loading");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isSpinAddon, setIsSpinAddon] = useState(false);
  // The server's reason for a failed confirmation, kept on the page rather than only in
  // a toast that disappears after a few seconds (FE-10).
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const capturedRef = useRef(false);

  useEffect(() => {
    if (!paypalOrderId && !paypalSubscriptionId) {
      setState("error");
      return;
    }
    // Guard against double-call in React StrictMode or user page refresh
    if (capturedRef.current) return;
    capturedRef.current = true;

    const fail = (err: unknown) => {
      const parsed = parseApiError(err);
      setErrorMessage(errorMessageWithId(parsed));
      setState("error");
      toast.error(
        parsed.message || "We couldn't confirm your payment. Please contact support if you were charged."
      );
    };

    // Everything a payment can change: access (profile), the recurring subscription
    // card, the payment history and the lucky-draw spins. Also run on failure — a
    // confirmation that errored after PayPal took the money may still have been recorded.
    const refreshAfterPayment = () => {
      void invalidateCompanyProfile(queryClient);
      void queryClient.invalidateQueries({ queryKey: ["subscription", "status"] });
      void queryClient.invalidateQueries({ queryKey: ["company", "draws"] });
      void queryClient.invalidateQueries({ queryKey: ["company", "payments"] });
    };

    if (paypalSubscriptionId) {
      paymentService
        .confirmSubscription(paypalSubscriptionId)
        .then((status) => {
          setExpiresAt(status.currentPeriodEnd);
          setState("success");
        })
        .catch(fail)
        .finally(refreshAfterPayment);
      return;
    }

    paymentService
      .captureOrder(paypalOrderId!)
      .then((result) => {
        setExpiresAt(result.subscriptionEndsAt);
        setIsSpinAddon(result.kind === "spin_addon");
        // refreshAfterPayment invalidates the shared profile query, so the gate, sidebar
        // and every page see the new subscription immediately. A Redux flag used to be
        // set here too; it duplicated the profile and drifted from it (ARC-5).
        setState("success");
      })
      .catch(fail)
      .finally(refreshAfterPayment);
  }, [paypalOrderId, paypalSubscriptionId, queryClient]);

  if (state === "loading") {
    return (
      <div role="status" className="flex flex-col items-center justify-center min-h-100 gap-4">
        <Loader2 className="h-10 w-10 text-primary-400 animate-spin" aria-hidden="true" />
        <p className="text-slate-500 text-sm">Confirming your payment with PayPal…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center gap-5 pt-12 text-center">
        <div className="h-16 w-16 rounded-full bg-error-50 flex items-center justify-center" aria-hidden="true">
          <XCircle className="h-8 w-8 text-error-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Payment Confirmation Failed</h2>
          <p className="text-slate-500 text-sm mt-2">
            {paypalOrderId || paypalSubscriptionId
              ? "We couldn't verify your payment. If you were charged, please contact support with your PayPal transaction ID."
              : "This page was opened without a PayPal reference, so there is no payment to confirm."}
          </p>
          {errorMessage && (
            <p className="text-sm text-error-600 bg-error-50 border border-error-100 rounded-lg p-3 mt-3 break-words">
              {errorMessage}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.push("/company/billing")}>
            Try Again
          </Button>
          <Button onClick={() => router.push("/company/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const formattedDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <div className="max-w-md mx-auto flex flex-col items-center gap-5 pt-12 text-center">
      <div className="h-16 w-16 rounded-full bg-success-50 flex items-center justify-center" aria-hidden="true">
        <CheckCircle2 className="h-8 w-8 text-success-500" />
      </div>
      <div>
        {isSpinAddon ? (
          <>
            <h2 className="text-xl font-bold text-slate-800">Spins Added!</h2>
            <p className="text-slate-500 text-sm mt-2">
              Your Lucky Draw spins have been added and are ready to use.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-slate-800">Subscription Activated!</h2>
            <p className="text-slate-500 text-sm mt-2">
              Your account is now active.
              {formattedDate && (
                <> Your subscription runs until <strong className="text-slate-700">{formattedDate}</strong>.</>
              )}
            </p>
          </>
        )}
      </div>
      <Button onClick={() => router.push(isSpinAddon ? "/company/lucky-draw" : "/company/dashboard")}>
        {isSpinAddon ? "Go to Lucky Draw" : "Go to Dashboard"}
      </Button>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <DashboardShell title="Payment Confirmation" requiredRole="company">
      <Suspense fallback={<PageLoader />}>
        <CaptureHandler />
      </Suspense>
    </DashboardShell>
  );
}
