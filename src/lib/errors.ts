import type { AxiosError } from "axios";
import type { ApiErrorResponse } from "@/types";

export interface ParsedApiError {
  status: number;
  code: string; // e.g., VALIDATION_ERROR, UNAUTHORIZED, RESOURCE_CONFLICT
  message: string;
  details?: Array<{ field: string; message: string }>;
  requestId?: string;
  retryAfterSeconds?: number;
  isSessionInvalidated?: boolean;
}

// Parse an axios error into our standard backend envelope shape.
// Falls back to sensible defaults for network errors or unexpected shapes.
export function parseApiError(err: unknown): ParsedApiError {
  const axiosErr = err as AxiosError<ApiErrorResponse>;

  // Network error (no response) — backend unreachable
  if (!axiosErr.response) {
    return {
      status: 0,
      code: "NETWORK_ERROR",
      message:
        "Unable to reach the server. Please check your connection and try again.",
    };
  }

  const { status, data, headers } = axiosErr.response;
  const retryAfterHeader = headers?.["retry-after"];
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : undefined;

  // Not our envelope (HTML error page, etc)
  if (!data || typeof data !== "object") {
    return {
      status,
      code: "INTERNAL_ERROR",
      message: `Server returned ${status}. Please try again.`,
    };
  }

  const message = data.message || "Something went wrong.";
  const isSessionInvalidated =
    status === 401 && /session\s+invalidated/i.test(message);

  return {
    status,
    code: data.error || "INTERNAL_ERROR",
    message,
    details: data.details,
    requestId: data.requestId,
    retryAfterSeconds: resolveRetryAfterSeconds(data.retryAfterSeconds, retryAfterSeconds, message),
    isSessionInvalidated,
  };
}

/**
 * How long a 429 asks us to wait, best source first.
 *
 * The `Retry-After` header is not CORS-safelisted, so a cross-origin browser cannot read
 * it unless the API exposes it; the body field is what the API sends for exactly that
 * reason. The "about N more minutes" copy is the last resort, for an API that predates
 * the body field — otherwise the QR form counted down "45s" under "wait 14 minutes".
 */
export function resolveRetryAfterSeconds(
  body: unknown,
  header: number | undefined,
  message: string,
): number | undefined {
  if (typeof body === "number" && Number.isFinite(body) && body > 0) return Math.ceil(body);
  if (typeof header === "number" && Number.isFinite(header) && header > 0) return Math.ceil(header);
  const minutes = /about (\d+) more minutes?/i.exec(message);
  if (minutes) return Number(minutes[1]) * 60;
  return undefined;
}

/**
 * The message a failed action shows the admin/customer — in a dialog or a toast.
 * A 429 gets fixed, plain wording (and the wait, when known) instead of whichever
 * limiter's phrasing happened to answer.
 */
export function actionErrorMessage(err: unknown): string {
  const parsed = parseApiError(err);
  if (parsed.status === 429) {
    const wait = parsed.retryAfterSeconds;
    if (wait && wait >= 120) return `Too many requests, please wait about ${Math.ceil(wait / 60)} minutes and try again.`;
    if (wait) return `Too many requests, please wait ${wait} seconds and try again.`;
    return "Too many requests, please wait a moment and try again.";
  }
  return errorMessageWithId(parsed);
}

// Map a backend `details[]` array to a form-errors dict keyed by field.
export function fieldErrorsFromDetails(
  details?: Array<{ field: string; message: string }>
): Record<string, string> {
  if (!details) return {};
  const result: Record<string, string> = {};
  details.forEach((d) => {
    if (!result[d.field]) result[d.field] = d.message;
  });
  return result;
}

// Format an error message with an optional requestId for support UI.
export function errorMessageWithId(e: ParsedApiError): string {
  if (!e.requestId) return e.message;
  return `${e.message} (ID: ${e.requestId.slice(0, 8)})`;
}
