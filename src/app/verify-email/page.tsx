"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui";
import { PageLoader } from "@/components/ui/loader";
import { authService } from "@/services";
import { parseApiError, errorMessageWithId } from "@/lib/errors";

type Status = "verifying" | "success" | "invalid" | "error";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>(token ? "verifying" : "invalid");
  const [message, setMessage] = useState("");

  // React 18 StrictMode double-invokes effects in development, and the token is
  // single-use — without this guard the second call consumes nothing and reports
  // "invalid link" over a verification that actually succeeded.
  const attempted = useRef(false);

  const verify = useCallback(async (raw: string) => {
    setStatus("verifying");
    try {
      await authService.confirmEmailVerification(raw);
      setStatus("success");
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.status === 401 || parsed.status === 400) {
        setStatus("invalid");
      } else {
        setStatus("error");
        setMessage(errorMessageWithId(parsed));
      }
    }
  }, []);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    void verify(token);
  }, [token, verify]);

  if (status === "verifying") {
    return (
      <AuthLayout title="Confirming your email" subtitle="This will only take a moment">
        <div className="text-center space-y-4 py-4" aria-live="polite">
          <Loader2
            className="h-8 w-8 text-primary-600 animate-spin mx-auto"
            aria-hidden="true"
          />
          <p className="text-slate-600 text-sm">Confirming your email address…</p>
        </div>
      </AuthLayout>
    );
  }

  if (status === "success") {
    return (
      <AuthLayout title="Email confirmed" subtitle="Your account is ready">
        <div className="text-center space-y-4" role="status">
          <div
            className="mx-auto h-16 w-16 rounded-full bg-success-100 flex items-center justify-center"
            aria-hidden="true"
          >
            <CheckCircle className="h-8 w-8 text-success-500" />
          </div>
          <p className="text-slate-600">
            Thanks — your email address is confirmed and your account is active.
          </p>
          <Link href="/company/dashboard" className="inline-block">
            <Button variant="primary" className="mt-2">
              Go to dashboard
            </Button>
          </Link>
          <p className="text-xs text-slate-400">
            Not signed in?{" "}
            <Link href="/login" className="text-primary-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (status === "invalid") {
    return (
      <AuthLayout title="Link no longer valid" subtitle="This confirmation link can't be used">
        <div className="text-center space-y-4" role="alert">
          <div
            className="mx-auto h-16 w-16 rounded-full bg-error-100 flex items-center justify-center"
            aria-hidden="true"
          >
            <AlertTriangle className="h-8 w-8 text-error-500" />
          </div>
          <p className="text-slate-600">
            This link has expired or has already been used. Log in and we&apos;ll send you a
            fresh one.
          </p>
          <Link href="/login" className="inline-block">
            <Button variant="primary" className="mt-2">
              Log in
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Something went wrong" subtitle="We couldn't confirm your email">
      <div className="text-center space-y-4" role="alert">
        <div
          className="mx-auto h-16 w-16 rounded-full bg-error-100 flex items-center justify-center"
          aria-hidden="true"
        >
          <AlertTriangle className="h-8 w-8 text-error-500" />
        </div>
        <p className="text-slate-600 text-sm">{message}</p>
        <Button
          variant="primary"
          className="mt-2"
          onClick={() => token && void verify(token)}
        >
          Try again
        </Button>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <VerifyEmailInner />
    </Suspense>
  );
}
