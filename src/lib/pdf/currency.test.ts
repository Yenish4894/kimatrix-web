import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { KNOWN_COUNTRIES, formatPdfCurrency, isPdfSafe, pdfCurrencySymbol } from "./currency";

describe("pdfCurrencySymbol", () => {
  it("covers every country the app knows about", () => {
    // The point of the whole module. A country added later with an exotic symbol and
    // no override fails here rather than shipping a report full of null bytes.
    const unsafe = KNOWN_COUNTRIES.filter((c) => !isPdfSafe(pdfCurrencySymbol(c)));
    assert.deepEqual(unsafe, []);
  });

  it("prints the CFA franc as FCFA, not U+20A3", () => {
    // Niger is the platform's primary market and "₣" is what broke the reports.
    for (const country of ["Niger", "Senegal", "Mali", "Burkina Faso", "Ivory Coast", "Cameroon"]) {
      assert.equal(pdfCurrencySymbol(country), "FCFA");
    }
  });

  it("leaves symbols that WinAnsi can already encode alone", () => {
    assert.equal(pdfCurrencySymbol("United Kingdom"), "£");
    assert.equal(pdfCurrencySymbol("Germany"), "€");
    assert.equal(pdfCurrencySymbol("South Africa"), "R");
    assert.equal(pdfCurrencySymbol("Kenya"), "KSh");
  });

  it("falls back to the dollar for an unknown country", () => {
    assert.equal(pdfCurrencySymbol("Atlantis"), "$");
    assert.equal(pdfCurrencySymbol(""), "$");
  });
});

describe("isPdfSafe", () => {
  it("accepts ASCII and the Latin-1 range", () => {
    assert.equal(isPdfSafe("Aicha Mahamadou"), true);
    assert.equal(isPdfSafe("Aïcha Ndèye Sarr"), true); // accented names are common here
    assert.equal(isPdfSafe("€ 10.00"), true);
  });

  it("rejects anything outside it", () => {
    assert.equal(isPdfSafe("₣"), false);
    assert.equal(isPdfSafe("₹"), false);
    assert.equal(isPdfSafe("zł"), false);
  });
});

describe("formatPdfCurrency", () => {
  it("formats an amount with the safe symbol", () => {
    assert.equal(formatPdfCurrency(125_000, "Niger"), "FCFA 125,000.00");
    assert.equal(formatPdfCurrency("1250.5", "United Kingdom"), "£ 1,250.50");
  });

  it("survives the nullable amounts the API can send", () => {
    // Same defence as formatCurrency: a null here used to take a whole render down.
    assert.equal(formatPdfCurrency(null, "Niger"), "FCFA 0.00");
    assert.equal(formatPdfCurrency(undefined, "Niger"), "FCFA 0.00");
    assert.equal(formatPdfCurrency("not a number", "Niger"), "FCFA 0.00");
  });
});
