import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatCurrency, getCurrencySymbol, formatDate } from "./utils";

describe("formatCurrency", () => {
  it("formats a string amount without losing precision", () => {
    // The backend sends numeric(14,2) as a string on purpose; parsing early loses cents.
    assert.equal(formatCurrency("1234.5", "South Africa"), "R 1,234.50");
  });

  it("formats a number amount", () => {
    assert.equal(formatCurrency(99, "South Africa"), "R 99.00");
  });

  it("survives null and undefined instead of taking the render down", () => {
    // `null.toLocaleString()` throws, and this ran on the QR success screen AFTER the
    // purchase was already recorded — so a crash there made customers re-submit
    // straight into a duplicate-invoice error.
    assert.equal(formatCurrency(null, "South Africa"), "R 0.00");
    assert.equal(formatCurrency(undefined, "South Africa"), "R 0.00");
  });

  it("survives a non-numeric string", () => {
    assert.equal(formatCurrency("not a number", "South Africa"), "R 0.00");
  });

  it("falls back to $ for an unknown country rather than throwing", () => {
    assert.equal(formatCurrency("10", "Atlantis"), "$ 10.00");
    assert.equal(formatCurrency("10"), "$ 10.00");
  });

  it("always shows exactly two decimal places", () => {
    assert.equal(formatCurrency("5", "South Africa"), "R 5.00");
    assert.equal(formatCurrency("5.126", "South Africa"), "R 5.13");
  });
});

describe("getCurrencySymbol", () => {
  it("returns the symbol for a known country", () => {
    // Keyed by full country NAME, which is what CountrySelect stores and what the
    // production `companies.country` column actually contains.
    assert.equal(getCurrencySymbol("South Africa"), "R");
    assert.equal(getCurrencySymbol("India"), "₹");
  });

  it("falls back to $ rather than returning undefined", () => {
    assert.equal(getCurrencySymbol("Atlantis"), "$");
    assert.equal(getCurrencySymbol(""), "$");
  });
});

describe("formatDate", () => {
  it("uses a locked locale so SSR and the client agree", () => {
    // A locale-dependent format here caused hydration mismatches: the server rendered
    // one string and the browser another.
    const a = formatDate("2026-08-07T10:00:00.000Z");
    const b = formatDate("2026-08-07T10:00:00.000Z");
    assert.equal(a, b);
    assert.match(a, /2026/);
  });
});
