"use client";

// Route-level error boundary. Triggered for any unhandled error inside a
// route segment (other than the root). Pairs with `global-error.tsx` which
// handles errors that escape the root layout itself.
//
// Keeps the chrome (sidebar/header rendered by parent layouts) and only
// replaces the affected segment.

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO when Sentry is wired: Sentry.captureException(error)
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[route error]", error);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-error-100 rounded-2xl p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="mx-auto h-14 w-14 rounded-full bg-error-50 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-error-500" aria-hidden="true" />
        </div>
        <h2 className="text-h3 font-heading font-semibold text-slate-800">Something went wrong</h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          We hit an unexpected error rendering this page. Try again, or head back home.
        </p>

        {error.digest && (
          <p className="mt-3 text-xs text-slate-400 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="secondary" onClick={reset}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Link href="/">
            <Button variant="primary">
              <Home className="h-4 w-4" aria-hidden="true" />
              Go home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
