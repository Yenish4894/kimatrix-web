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
    retryAfterSeconds,
    isSessionInvalidated,
  };
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
