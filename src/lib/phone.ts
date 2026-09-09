/**
 * Turns whatever someone types into the local part of a phone number.
 *
 * Both phone inputs previously did `value.replace(/\D/g, "")` and then prefixed the
 * country's dial code. That is wrong in two ways that reached production data:
 *
 *  - Pasting a full international number (`+27 82 123 4567`) lost the `+`, kept the
 *    `27`, and got the dial code added again — `+2727821234567`. The form then
 *    rejected it with "not a valid number for the selected country", which reads as
 *    the app refusing a perfectly correct number.
 *  - Typing the number the way South Africans actually write it (`082 123 4567`) kept
 *    the national trunk `0`, storing `+270821234567`. That is not a dialable number,
 *    and nothing downstream noticed: one company and three customer records are
 *    currently unreachable because of it.
 */

/**
 * @param raw       exactly what is in the input, punctuation and all
 * @param dialCode  the selected country's calling code, e.g. "27" — null when no
 *                  country is chosen yet, in which case only digits are extracted
 */
export function toLocalDigits(raw: string, dialCode: string | null): string {
  // Whether the user meant an international number, decided before punctuation is
  // discarded. This is the load-bearing part: an Indian mobile legitimately starts
  // "91", so stripping the dial code whenever the digits happen to begin with it
  // would corrupt real numbers. Only an explicit "+" makes the intent unambiguous.
  const isInternational = raw.trimStart().startsWith("+");
  let digits = raw.replace(/\D/g, "");

  if (dialCode && isInternational && digits.startsWith(dialCode)) {
    digits = digits.slice(dialCode.length);
  }

  // National trunk prefix. Written before the subscriber number when dialling
  // domestically and dropped in international format — 082… is +2782…, never
  // +27082…. Applied after the dial-code strip so a paste of an already-broken
  // "+270821234567" is repaired rather than preserved.
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits;
}

/** The E.164 value to store, or "" when there is nothing usable yet. */
export function toE164(raw: string, dialCode: string | null): string {
  const local = toLocalDigits(raw, dialCode);
  return dialCode && local ? `+${dialCode}${local}` : "";
}
