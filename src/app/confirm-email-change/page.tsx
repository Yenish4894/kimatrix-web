"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, TriangleAlert, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui";
import { PageLoader } from "@/components/ui/loader";
import { authService } from "@/services";
import { parseApiError, errorMessageWithId } from "@/lib/errors";
import { TokenStorage } from "@/lib/tokens";
import { getQueryClient } from "@/lib/query-client";
import { useAppDispatch } from "@/store/hooks";
import { clearAuth } from "@/store/slices/authSlice";
import { clearCompany } from "@/store/slices/companySlice";

type Status = "confirming" | "success" | "invalid" | "error";

function ConfirmEmailChangeInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const dispatch = useAppDispatch();

  const [status, setStatus] = useState<Status>(token ? "confirming" : "invalid");
  const [message, setMessage] = useState("");
  const [newEmail, setNewEmail] = useState<string | null>(null);

  // The token is single-use, and StrictMode runs effects twice in development — the
  // second call would report "invalid link" over a change that actually succeeded.
  const attempted = useRef(false);

  const confirm = useCallback(
    async (raw: string) => {
      setStatus("confirming");
      try {
        const res = await authService.confirmEmailChange(raw);
        // The server revoked every refresh token with the change, so the session this
        // tab holds is already dead. Clear it now rather than letting the next request
        // discover that and toast "Your session has ended" at someone who just
        // succeeded. Same teardown as a password change.
        TokenStorage.clear();
        dispatch(clearAuth());
        dispatch(clearCompany());
        getQueryClient().clear();
        setNewEmail(res.email);
        setStatus("success");
      } catch (err) {
        const parsed = parseApiError(err);
        if (parsed.status === 400 || parsed.status === 401 || parsed.status === 404 || parsed.status === 409 || parsed.status === 410) {
          // The server knows why it refused (expired, used, address taken meanwhile).
          setMessage(parsed.message);
          setStatus("invalid");
        } else {
          setMessage(errorMessageWithId(parsed));
          setStatus("error");
        }
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    void confirm(token);
  }, [token, confirm]);

  // `redirectIfAuthenticated={false}` throughout: the person opening this link is very
  // likely signed in on this browser, and the default AuthLayout behaviour would send
  // them to their dashboard before they could read the result.
  if (status === "confirming") {
    return (
      <AuthLayout title="Confirming your new email" subtitle="This will only take a moment" redirectIfAuthenticated={false}>
        <div className="text-center space-y-4 py-4" aria-live="polite">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto" aria-hidden="true" />
          <p className="text-slate-600 text-sm">Confirming your new login email…</p>
        </div>
      </AuthLayout>
    );
  }

  if (status === "success") {
    return (
      <AuthLayout title="Login email changed" subtitle="Please log in again" redirectIfAuthenticated={false}>
        <div className="text-center space-y-4" role="status">
          <div className="mx-auto h-16 w-16 rounded-full bg-success-100 flex items-center justify-center" aria-hidden="true">
            <CheckCircle className="h-8 w-8 text-success-500" />
          </div>
          <p className="text-slate-600">
            {newEmail ? (
              <>Your login email is now <strong className="break-all text-slate-800">{newEmail}</strong> — please log in again.</>
            ) : (
              <>Your login email has been changed — please log in again.</>
            )}
          </p>
          <p className="text-xs text-slate-500">
            For your security you have been signed out on every device.
          </p>
          <Link href="/login" className="inline-block">
            <Button variant="primary" className="mt-2">Log in</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (status === "invalid") {
    return (
      <AuthLayout title="Link no longer valid" subtitle="This confirmation link can't be used" redirectIfAuthenticated={false}>
        <div className="text-center space-y-4" role="alert">
          <div className="mx-auto h-16 w-16 rounded-full bg-error-100 flex items-center justify-center" aria-hidden="true">
            <TriangleAlert className="h-8 w-8 text-error-500" />
          </div>
          <p className="text-slate-600">
            {message || "This link is missing, has expired or has already been used."} Your
            login email has not changed. You can request a new link from Settings.
          </p>
          <Link href="/login" className="inline-block">
            <Button variant="primary" className="mt-2">Go to login</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Something went wrong" subtitle="We couldn't confirm your new email" redirectIfAuthenticated={false}>
      <div className="text-center space-y-4" role="alert">
        <div className="mx-auto h-16 w-16 rounded-full bg-error-100 flex items-center justify-center" aria-hidden="true">
          <TriangleAlert className="h-8 w-8 text-error-500" />
        </div>
        <p className="text-slate-600 text-sm">{message}</p>
        <Button variant="primary" className="mt-2" onClick={() => token && void confirm(token)}>
          Try again
        </Button>
      </div>
    </AuthLayout>
  );
}

export default function ConfirmEmailChangePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ConfirmEmailChangeInner />
    </Suspense>
  );
}
