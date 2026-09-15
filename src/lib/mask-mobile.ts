/**
 * Masks a mobile number for display on a public screen (lucky-draw "Draw mode").
 *
 * Only the last digits survive, so the winner can recognise their own number while
 * the rest of the shop can't copy it down: `+27 82 555 4567` → `••••4567`.
 *
 * - Formatting (spaces, dashes, brackets, a leading `+`) is ignored; only digits count.
 * - Up to 4 trailing digits are shown, but never more than half the number, so a
 *   short value is not revealed in full (`1234` → `••••34`, `12` → `••••`).
 * - No digits at all → empty string, so callers can simply skip the line.
 */
export const MASK = "••••";

export function maskMobile(raw: string | null | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  const visible = Math.min(4, Math.floor(digits.length / 2));
  return MASK + (visible > 0 ? digits.slice(-visible) : "");
}
