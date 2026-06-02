"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Button } from "@/components/ui";
import { PageLoader } from "@/components/ui/loader";
import { paymentService } from "@/services/payment.service";
import { useAppDispatch } from "@/store/hooks";
import { setCompanyIsActive } from "@/store/slices/authSlice";
import { setSubscription, fetchCompanyProfile } from "@/store/slices/companySlice";

type CaptureState = "loading" | "success" | "error";

// Inner component owns useSearchParams — must be inside a Suspense boundary
function CaptureHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const paypalOrderId = searchParams.get("token");

  const [state, setState] = useState<CaptureState>("loading");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const capturedRef = useRef(false);

  useEffect(() => {
    if (!paypalOrderId) {
      setState("error");
      return;
    }
    // Guard against double-call in React StrictMode or user page refresh
    if (capturedRef.current) return;
    capturedRef.current = true;

    paymentService
      .captureOrder(paypalOrderId)
      .then((result) => {
        setExpiresAt(result.subscriptionEndsAt);
        // Sync Redux so sidebar + gate reflect activation immediately
        dispatch(setCompanyIsActive(true));
        dispatch(setSubscription({ subscriptionEndsAt: result.subscriptionEndsAt }));
        // Refetch full profile to get currentPlan details
        dispatch(fetchCompanyProfile());
        setState("success");
      })
      .catch(() => {
        setState("error");
        toast.error("We couldn't confirm your payment. Please contact support if you were charged.");
      });
  }, [paypalOrderId, dispatch]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 text-primary-400 animate-spin" />
        <p className="text-slate-500 text-sm">Confirming your payment with PayPal…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center gap-5 pt-12 text-center">
        <div className="h-16 w-16 rounded-full bg-error-50 flex items-center justify-center">
          <XCircle className="h-8 w-8 text-error-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Payment Confirmation Failed</h2>
          <p className="text-slate-500 text-sm mt-2">
            We couldn&apos;t verify your payment. If you were charged, please contact support with your PayPal transaction ID.
          </p>
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
      <div className="h-16 w-16 rounded-full bg-success-50 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-success-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-800">Subscription Activated!</h2>
        <p className="text-slate-500 text-sm mt-2">
          Your account is now active.
          {formattedDate && (
            <> Your subscription runs until <strong className="text-slate-700">{formattedDate}</strong>.</>
          )}
        </p>
      </div>
      <Button onClick={() => router.push("/company/dashboard")}>
        Go to Dashboard
      </Button>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <DashboardShell title="Payment" requiredRole="company">
      <Suspense fallback={<PageLoader />}>
        <CaptureHandler />
      </Suspense>
    </DashboardShell>
  );
}
