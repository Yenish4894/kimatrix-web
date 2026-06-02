"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./button";
import { parseApiError, errorMessageWithId } from "@/lib/errors";

interface QueryErrorStateProps {
  /** Error from React Query's `query.error` or any thrown error */
  error: unknown;
  /** Refetch handler, typically `query.refetch` */
  onRetry?: () => void;
  /** Optional: override the human label of what failed loading (e.g. "customers") */
  resource?: string;
  /** Compact (single-line) variant for tight spaces */
  compact?: boolean;
  className?: string;
}

/**
 * Inline error UI for failed `useQuery` calls. Shows the parsed message,
 * surfaces requestId for support tickets, and offers a retry button.
 *
 * Use everywhere a list-page query can fail — `customersQ`, `purchasesQ`,
 * `companiesQ`, etc. — instead of letting the table render an empty state
 * when the API actually errored.
 */
export function QueryErrorState({
  error,
  onRetry,
  resource = "data",
  compact,
  className,
}: Readonly<QueryErrorStateProps>) {
  const parsed = parseApiError(error);
  const message = errorMessageWithId(parsed);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm text-error-600 ${className ?? ""}`}>
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate">Couldn&apos;t load {resource}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-primary-600 hover:underline text-sm font-medium"
            type="button"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`bg-white border border-error-100 rounded-xl p-6 sm:p-8 text-center ${className ?? ""}`}
    >
      <div className="mx-auto h-12 w-12 rounded-full bg-error-50 flex items-center justify-center mb-3">
        <AlertCircle className="h-6 w-6 text-error-500" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">
        Couldn&apos;t load {resource}
      </h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-4">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}
