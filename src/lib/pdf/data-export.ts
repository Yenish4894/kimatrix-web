// PDF rendering for the "download your data" export.
//
// Built on the JSON the export endpoint already streams, rather than a second
// server-side format: the API is unchanged, and this reuses the branded masthead,
// running header and footer that every other KIMates document uses.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BRAND,
  PAGE,
  RUNNING_HEADER_HEIGHT,
  drawFooterOnAllPages,
  drawHeader,
  drawRunningHeader,
  loadBrandAssets,
  pageSize,
  savePdf,
} from "./branding";
import { formatPdfCurrency } from "./currency";
import { formatNumber } from "@/lib/utils";

export type ExportDataset = "customers" | "purchases";

type Cell = { key: string; header: string; align?: "right"; kind?: "money" | "date" | "count" };

/**
 * Columns, matching the backend's DATASETS spec key-for-key.
 *
 * The API emits snake_case keys, so these are the contract between the two. A column
 * added server-side and not here is silently dropped from the PDF — which is why the
 * test asserts the two lists agree.
 */
const COLUMNS: Record<ExportDataset, Cell[]> = {
  customers: [
    { key: "full_name", header: "Full name" },
    { key: "mobile", header: "Mobile" },
    { key: "vehicle_number", header: "Vehicle number" },
    { key: "total_invoice_amount", header: "Total spend", align: "right", kind: "money" },
    { key: "submission_count", header: "Submissions", align: "right", kind: "count" },
    { key: "first_submission_at", header: "First submission", kind: "date" },
    { key: "last_submission_at", header: "Last submission", kind: "date" },
  ],
  purchases: [
    { key: "invoice_number", header: "Invoice number" },
    { key: "invoice_amount", header: "Amount", align: "right", kind: "money" },
    { key: "full_name_snapshot", header: "Customer name" },
    { key: "mobile", header: "Customer mobile" },
    { key: "vehicle_number_snapshot", header: "Vehicle number" },
    { key: "submitted_at", header: "Submitted at", kind: "date" },
  ],
};

/**
 * The column each dataset is ranked on.
 *
 * The API streams in keyset-pagination order — newest submission first — because that
 * is what its cursor requires. Re-sorting server-side would mean a different cursor
 * column and a new index, and would change CSV and JSON too. The PDF holds every row
 * in memory by the time it renders, so it ranks here and leaves the stream alone.
 */
const RANK_BY: Record<ExportDataset, string> = {
  customers: "total_invoice_amount",
  purchases: "invoice_amount",
};

function amount(row: Record<string, unknown>, key: string): number {
  const n = Number(row[key]);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Highest value first, so the top of page one is the customer who spent the most and
 * the document can be used to run a draw directly.
 *
 * Ties break on mobile — an arbitrary rule, but a fixed one. Without it two customers
 * on the same total could swap places between two downloads of identical data, and a
 * prize list that reorders itself is not one anyone can trust.
 */
export function rankRows(
  dataset: ExportDataset,
  rows: Record<string, unknown>[],
): { row: Record<string, unknown>; rank: number }[] {
  const key = RANK_BY[dataset];
  const sorted = [...rows].sort((a, b) => {
    const diff = amount(b, key) - amount(a, key);
    if (diff !== 0) return diff;
    return String(a["mobile"] ?? "").localeCompare(String(b["mobile"] ?? ""));
  });

  // RANK(), not ROW_NUMBER(): equal totals share a position. Printing 1, 2, 3 down a
  // column of identical amounts would tell someone running a draw there is a winner
  // where there is actually a tie to resolve.
  const out: { row: Record<string, unknown>; rank: number }[] = [];
  let rank = 0;
  let previous: number | null = null;
  sorted.forEach((row, i) => {
    const value = amount(row, key);
    if (previous === null || value !== previous) rank = i + 1;
    previous = value;
    out.push({ row, rank });
  });
  return out;
}

const TITLE: Record<ExportDataset, string> = {
  customers: "Customer export",
  purchases: "Purchase export",
};

/** Dates arrive as ISO strings. Locked locale so the output does not vary by machine. */
function formatDateTime(value: unknown): string {
  if (value == null || value === "") return "";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderCell(cell: Cell, value: unknown, country: string): string {
  if (value == null) return "";
  switch (cell.kind) {
    case "money":
      return formatPdfCurrency(value as string | number, country);
    case "date":
      return formatDateTime(value);
    case "count":
      return formatNumber(Number(value));
    default:
      return String(value);
  }
}

export interface ExportPdfOptions {
  dataset: ExportDataset;
  rows: Record<string, unknown>[];
  companyName: string;
  country?: string;
}

/**
 * Render an export to a branded PDF and trigger the download.
 *
 * Landscape: the customer dataset is seven columns, which cannot be read across a
 * 170mm portrait page without shrinking the type past legibility.
 */
export async function generateExportPdf({
  dataset,
  rows,
  companyName,
  country = "",
}: ExportPdfOptions): Promise<void> {
  const assets = await loadBrandAssets();
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const { width, margin } = pageSize(doc);

  const columns = COLUMNS[dataset];
  const title = TITLE[dataset];
  const noun =
    dataset === "customers"
      ? `customer${rows.length === 1 ? "" : "s"}`
      : `purchase${rows.length === 1 ? "" : "s"}`;
  const orderedBy = dataset === "customers" ? "total spend" : "purchase amount";
  const subtitle = `${formatNumber(rows.length)} ${noun} — complete export, highest ${orderedBy} first`;

  const startY = drawHeader(doc, assets, { title, subtitle, companyName });

  if (rows.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.textFaint);
    doc.text("There is no data to export yet.", width / 2, startY + 25, { align: "center" });
    drawFooterOnAllPages(doc, assets);
    savePdf(doc, filenameFor(dataset));
    return;
  }

  const ranked = rankRows(dataset, rows);

  autoTable(doc, {
    startY,
    head: [["#", ...columns.map((c) => c.header)]],
    body: ranked.map(({ row, rank }) => [
      String(rank),
      ...columns.map((c) => renderCell(c, row[c.key], country)),
    ]),
    theme: "plain",
    margin: { left: margin, right: margin, top: RUNNING_HEADER_HEIGHT, bottom: PAGE.margin + 5 },
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: { top: 2.4, right: 2.5, bottom: 2.4, left: 2.5 },
      textColor: BRAND.text,
      lineColor: BRAND.border,
      lineWidth: 0.1,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: BRAND.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    // A row torn across a page break loses the line that identifies it.
    rowPageBreak: "avoid",
    didParseCell: (data) => {
      if (data.column.index === 0) {
        data.cell.styles.halign = "center";
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.cellWidth = 12;
        return;
      }
      // Offset by the rank column, which is not part of the backend contract.
      const column = columns[data.column.index - 1];
      if (!column) return;
      if (column.align === "right") data.cell.styles.halign = "right";
      // Mobile numbers are easier to scan and compare in a fixed-width face.
      if (column.key === "mobile" && data.section === "body") data.cell.styles.font = "courier";
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawRunningHeader(doc, assets, `${title} — ${companyName}`);
    },
  });

  drawFooterOnAllPages(doc, assets);
  savePdf(doc, filenameFor(dataset));
}

function filenameFor(dataset: ExportDataset): string {
  const today = new Date().toISOString().split("T")[0];
  return `kimates-${dataset}-${today}.pdf`;
}

/** Exported for the test that keeps these columns in step with the backend. */
export const EXPORT_COLUMNS = COLUMNS;
