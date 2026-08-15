import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EXPORT_COLUMNS, rankRows } from "./data-export";

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

describe("rankRows — the draw order", () => {
  const customers = [
    { mobile: "+227 90000001", total_invoice_amount: "5000.00" },
    { mobile: "+227 90000002", total_invoice_amount: "125000.50" },
    { mobile: "+227 90000003", total_invoice_amount: "40000.00" },
  ];

  it("puts the biggest spender first", () => {
    // The whole point: the merchant runs a draw straight off page one.
    const ranked = rankRows("customers", customers);
    assert.equal(ranked[0]!.row["mobile"], "+227 90000002");
    assert.equal(ranked[0]!.rank, 1);
    assert.deepEqual(ranked.map((r) => r.rank), [1, 2, 3]);
  });

  it("does not mutate the caller's array", () => {
    const input = [...customers];
    rankRows("customers", input);
    assert.deepEqual(input, customers);
  });

  it("gives tied customers the same rank, then skips", () => {
    // RANK(), not ROW_NUMBER(). Printing 1, 2, 3 down a column of identical totals
    // claims there is a winner where there is really a tie to resolve.
    const tied = [
      { mobile: "b", total_invoice_amount: "100" },
      { mobile: "a", total_invoice_amount: "100" },
      { mobile: "c", total_invoice_amount: "50" },
    ];
    assert.deepEqual(rankRows("customers", tied).map((r) => r.rank), [1, 1, 3]);
  });

  it("orders ties the same way every time", () => {
    // Two downloads of identical data must not disagree about who is above whom;
    // a prize list that reorders itself is not one anyone can trust.
    const tied = [
      { mobile: "+227 90000009", total_invoice_amount: "100" },
      { mobile: "+227 90000002", total_invoice_amount: "100" },
    ];
    const first = rankRows("customers", tied).map((r) => r.row["mobile"]);
    const second = rankRows("customers", [...tied].reverse()).map((r) => r.row["mobile"]);
    assert.deepEqual(first, second);
  });

  it("sorts numerically, not as text", () => {
    // String ordering would put "9" above "125000" and hand the prize to the wrong
    // customer. The API sends these amounts as strings.
    const ranked = rankRows("customers", [
      { mobile: "a", total_invoice_amount: "9" },
      { mobile: "b", total_invoice_amount: "125000" },
    ]);
    assert.equal(ranked[0]!.row["mobile"], "b");
  });

  it("treats a missing or unparseable amount as zero rather than dropping the row", () => {
    // Every customer must appear in the draw, even one whose total never computed.
    const ranked = rankRows("customers", [
      { mobile: "a", total_invoice_amount: null },
      { mobile: "b", total_invoice_amount: "10" },
      { mobile: "c" },
    ]);
    assert.equal(ranked.length, 3);
    assert.equal(ranked[0]!.row["mobile"], "b");
  });

  it("ranks purchases on their own amount column", () => {
    const ranked = rankRows("purchases", [
      { mobile: "a", invoice_amount: "10" },
      { mobile: "b", invoice_amount: "900" },
    ]);
    assert.equal(ranked[0]!.row["mobile"], "b");
  });
});
