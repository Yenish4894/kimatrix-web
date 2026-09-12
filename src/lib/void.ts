/**
 * Voiding a purchase — the client-side half of the rules. The server enforces the same
 * limits; these exist so the owner learns about a too-short reason before the request,
 * not from a 400.
 */

export const VOID_REASON_MIN = 3;
export const VOID_REASON_MAX = 500;

/** Returns an error message, or null when the reason is acceptable. Measures the trimmed text,
 *  as the server does — three spaces are not a reason. */
export function validateVoidReason(raw: string): string | null {
  const reason = raw.trim();
  if (reason.length === 0) return "Enter a reason for voiding this purchase.";
  if (reason.length < VOID_REASON_MIN) {
    return `The reason must be at least ${VOID_REASON_MIN} characters.`;
  }
  if (reason.length > VOID_REASON_MAX) {
    return `The reason must be ${VOID_REASON_MAX} characters or fewer.`;
  }
  return null;
}

/** Tolerates a backend that predates voiding, where the field is simply absent. */
export function isVoided(purchase: { voidedAt?: string | null } | null | undefined): boolean {
  return Boolean(purchase?.voidedAt);
}
