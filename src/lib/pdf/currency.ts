/**
 * Currency formatting for PDF output.
 *
 * jsPDF's built-in Helvetica is a WinAnsi (CP1252) font. Hand it a single character
 * outside that set and it does not fail — it silently switches the whole string to
 * UTF-16 output against a font with no such encoding. The result is a run of null
 * bytes interleaved with the digits, which renders as a wrong glyph followed by
 * widely-spaced, unreadable numbers.
 *
 * That is not hypothetical. `getCurrencySymbol("Niger")` returns "₣" (U+20A3), so
 * every Total Spend value in every report downloaded in the platform's primary market
 * came out mangled — the one column the report exists for.
 *
 * The fix is to substitute an ASCII form in PDFs only. On screen the symbols are fine,
 * and "FCFA" is what people in West Africa actually write anyway.
 */

import { COUNTRY_CURRENCY, getCurrencySymbol } from "@/lib/utils";

/**
 * Replacements for symbols the PDF fonts cannot encode.
 *
 * Keyed on the symbol rather than the country so one entry covers every country that
 * shares it — "₣" is used by six.
 */
const PDF_SYMBOL_OVERRIDES: Record<string, string> = {
  "₣": "FCFA", // XOF / XAF — the local written form, not "F"
  "₦": "NGN",
  "GH₵": "GHS",
  "₹": "INR",
  "₩": "KRW",
  "฿": "THB",
  "₱": "PHP",
  "₫": "VND",
  "৳": "BDT",
  "₨": "PKR",
  "₪": "ILS",
  "₺": "TRY",
  "zł": "PLN",
};

/**
 * The characters CP1252 can represent: printable ASCII, the Latin-1 supplement, and
 * the 0x80–0x9F block that WinAnsi fills with typographic punctuation and the euro.
 */
const CP1252_EXTRAS = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

export function isPdfSafe(text: string): boolean {
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code >= 0x20 && code <= 0x7e) continue;
    if (code >= 0xa0 && code <= 0xff) continue;
    if (CP1252_EXTRAS.includes(ch)) continue;
    return false;
  }
  return true;
}

/** The currency symbol to print in a PDF for a given country. */
export function pdfCurrencySymbol(country: string): string {
  const symbol = getCurrencySymbol(country);
  const mapped = PDF_SYMBOL_OVERRIDES[symbol] ?? symbol;
  // A symbol that is still unencodable would corrupt the amount next to it, so drop
  // it. A number with no symbol is readable; a number rendered as null bytes is not.
  return isPdfSafe(mapped) ? mapped : "";
}

/**
 * Same shape as `formatCurrency`, but guaranteed to survive PDF encoding.
 * Kept separate rather than changing `formatCurrency` — on screen the real symbols
 * render correctly and are the better choice.
 */
export function formatPdfCurrency(
  amount: string | number | null | undefined,
  country = "",
): string {
  const symbol = pdfCurrencySymbol(country);
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  const value =
    typeof num !== "number" || !Number.isFinite(num)
      ? "0.00"
      : num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return symbol ? `${symbol} ${value}` : value;
}

/** Every country the app knows about — used by the tests to prove full coverage. */
export const KNOWN_COUNTRIES = Object.keys(COUNTRY_CURRENCY);
