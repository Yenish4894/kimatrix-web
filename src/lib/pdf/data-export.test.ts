import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EXPORT_COLUMNS } from "./data-export";

/**
 * The backend's column list, copied from ExportService's DATASETS spec.
 *
 * The PDF is built from the JSON the API streams, so these snake_case keys are the
 * contract between the two services. A column added server-side and not here is
 * silently missing from the customer's download — no error, no warning, just absent
 * data in the file they asked for because they are leaving.
 */
const BACKEND_COLUMNS = {
  customers: [
    "mobile",
    "full_name",
    "vehicle_number",
    "total_invoice_amount",
    "submission_count",
    "first_submission_at",
    "last_submission_at",
  ],
  purchases: [
    "invoice_number",
    "invoice_amount",
    "mobile",
    "full_name_snapshot",
    "vehicle_number_snapshot",
    "submitted_at",
  ],
} as const;

describe("export PDF columns", () => {
  for (const dataset of ["customers", "purchases"] as const) {
    it(`${dataset}: every backend column reaches the PDF`, () => {
      const inPdf = EXPORT_COLUMNS[dataset].map((c) => c.key).sort();
      const expected = [...BACKEND_COLUMNS[dataset]].sort();
      assert.deepEqual(inPdf, expected);
    });

    it(`${dataset}: no column is listed twice`, () => {
      const keys = EXPORT_COLUMNS[dataset].map((c) => c.key);
      assert.equal(new Set(keys).size, keys.length);
    });

    it(`${dataset}: every column has a header`, () => {
      for (const c of EXPORT_COLUMNS[dataset]) {
        assert.ok(c.header.trim().length > 0, `${c.key} needs a header`);
      }
    });
  }

  it("money columns are the amount fields, so they get currency formatting", () => {
    // Getting this wrong prints a raw "125000" where the rest of the platform shows
    // "FCFA 125,000.00".
    assert.deepEqual(
      EXPORT_COLUMNS.customers.filter((c) => c.kind === "money").map((c) => c.key),
      ["total_invoice_amount"],
    );
    assert.deepEqual(
      EXPORT_COLUMNS.purchases.filter((c) => c.kind === "money").map((c) => c.key),
      ["invoice_amount"],
    );
  });

  it("every timestamp column is formatted as a date", () => {
    for (const dataset of ["customers", "purchases"] as const) {
      for (const c of EXPORT_COLUMNS[dataset]) {
        if (c.key.endsWith("_at")) {
          assert.equal(c.kind, "date", `${c.key} should render as a date`);
        }
      }
    }
  });
});
