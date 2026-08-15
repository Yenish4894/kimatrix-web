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
  const subtitle = `${formatNumber(rows.length)} ${
    dataset === "customers"
      ? `customer${rows.length === 1 ? "" : "s"}`
      : `purchase${rows.length === 1 ? "" : "s"}`
  } — complete export`;

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

  autoTable(doc, {
    startY,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => renderCell(c, row[c.key], country))),
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
      const column = columns[data.column.index];
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
