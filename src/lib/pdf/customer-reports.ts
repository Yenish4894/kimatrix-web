// Customer reports — Top 10 monthly + All customers full list.
// Both share the same row shape, so we use one autoTable call with a flag
// that toggles podium emojis for the top 10.

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
  savePdf,
} from "./branding";
import { formatPdfCurrency } from "./currency";
import { formatNumber } from "@/lib/utils";

export interface ReportRow {
  fullName: string;
  mobile: string;
  vehicleNumber: string | null;
  totalSpend: number;
  purchaseCount: number;
  /**
   * ISO timestamp — most recent purchase. Used by the page-side sort as a
   * tiebreaker when totalSpend is equal. Not displayed in the PDF.
   */
  lastActivity: string;
}

/**
 * Fixed column widths in mm. The Customer column takes whatever is left of the
 * 170mm content width, so these four decide how much room a name gets.
 *
 * Each is the widest string the column can hold, measured with jsPDF at the styles
 * below, plus the 6mm of horizontal cell padding:
 *   rank      "1234"                 7.4 + 6
 *   mobile    "+234 8012345678"     28.6 + 6   (the longest format in the country list)
 *   purchases the "Purchases" label 15.7 + 6
 *   spend     "FCFA 999,999,999.99" 32.7 + 6
 */
const COL = { rank: 14, mobile: 36, purchases: 22, spend: 40 } as const;

/** Header labels must sit on the same side as the figures under them. */
const HEAD_ALIGN: Record<number, "center" | "right"> = { 0: "center", 3: "right", 4: "right" };

interface ReportOpts {
  title: string;
  subtitle: string;
  companyName: string;
  country?: string;
  rows: ReportRow[];
  filename: string;
  /** Show podium markers (Gold/Silver/Bronze) on the first 3 rows */
  ranked?: boolean;
}

async function buildReport({ title, subtitle, companyName, country = "", rows, filename, ranked = false }: ReportOpts) {
  // Awaited before anything is drawn so the logo is in hand synchronously by the time
  // autoTable's page callbacks run. Cached, so a second download costs nothing.
  const assets = await loadBrandAssets();

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const startY = drawHeader(doc, assets, { title, subtitle, companyName });

  // Empty state
  if (rows.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.textFaint);
    doc.text("No data available for this period.", PAGE.width / 2, startY + 30, { align: "center" });
    drawFooterOnAllPages(doc, assets);
    savePdf(doc, filename);
    return;
  }

  const rankLabel = (i: number) => {
    if (!ranked) return String(i + 1);
    if (i === 0) return "1st";
    if (i === 1) return "2nd";
    if (i === 2) return "3rd";
    return String(i + 1);
  };

  const body = rows.map((r, i) => [
    rankLabel(i),
    r.fullName + (r.vehicleNumber ? `\n${r.vehicleNumber}` : ""),
    r.mobile,
    String(r.purchaseCount),
    formatPdfCurrency(r.totalSpend, country),
  ]);

  autoTable(doc, {
    startY,
    head: [["#", "Customer", "Mobile", "Purchases", "Total Spend"]],
    body,
    theme: "plain",
    // `top` applies to continuation pages only (page 1 uses startY), which is exactly
    // the room drawRunningHeader needs.
    margin: {
      left: PAGE.margin,
      right: PAGE.margin,
      top: RUNNING_HEADER_HEIGHT,
      bottom: PAGE.margin + 5,
    },
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      textColor: BRAND.text,
      lineColor: BRAND.border,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: BRAND.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
    },
    // Widths are sized to the widest value each column can actually hold, measured
    // rather than guessed. Text wraps, which is right for a name and wrong for a
    // number: "FCFA 12,345,678.90" broken over two lines reads as a mangled figure.
    // FCFA amounts run large by nature — a station's all-time total is routinely in
    // the millions — so Total Spend gets the room to hold a 10-digit figure whole.
    columnStyles: {
      0: { halign: "center", cellWidth: COL.rank, fontStyle: "bold" },
      1: { cellWidth: "auto" },
      2: { cellWidth: COL.mobile, font: "courier", fontSize: 9 },
      3: { halign: "right", cellWidth: COL.purchases },
      4: { halign: "right", cellWidth: COL.spend, fontStyle: "bold" },
    },
    // A row whose name wraps to three lines must not be torn in half by a page break.
    rowPageBreak: "avoid",
    alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
    didDrawPage: (data) => {
      // Page 1 already has the full masthead; every page after it would otherwise be
      // an unbranded table, and on a long customer list that is most of the document.
      if (data.pageNumber > 1) drawRunningHeader(doc, assets, title);
    },
    didParseCell: (data) => {
      // columnStyles.halign does not reach the header row, so the "Purchases" and
      // "Total Spend" labels sat left while their figures sat right.
      if (data.section === "head") {
        const halign = HEAD_ALIGN[data.column.index];
        if (halign) data.cell.styles.halign = halign;
      }

      // Podium tint on top 3 in ranked mode
      if (ranked && data.section === "body" && data.row.index < 3) {
        data.cell.styles.fillColor = BRAND.rowAlt;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // Summary row under the table
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const totalSpend = rows.reduce((s, r) => s + r.totalSpend, 0);
  const totalPurchases = rows.reduce((s, r) => s + r.purchaseCount, 0);

  const sy = finalY + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.textSoft);
  doc.text(
    `${formatNumber(rows.length)} customer${rows.length === 1 ? "" : "s"}  •  ${formatNumber(totalPurchases)} purchase${totalPurchases === 1 ? "" : "s"}  •  Total: ${formatPdfCurrency(totalSpend, country)}`,
    PAGE.width - PAGE.margin,
    sy,
    { align: "right" }
  );

  drawFooterOnAllPages(doc, assets);
  savePdf(doc, filename);
}

export function generateTop10Pdf(rows: ReportRow[], monthLabel: string, companyName: string, country = "") {
  return buildReport({
    title: "Top 10 Customers",
    subtitle: monthLabel,
    companyName,
    country,
    rows,
    filename: `kimates-top10-${monthLabel.replaceAll(/\s+/g, "-").toLowerCase()}.pdf`,
    ranked: true,
  });
}

export function generateAllCustomersPdf(rows: ReportRow[], companyName: string, country = "") {
  return buildReport({
    title: "All Customers",
    subtitle: "All-time totals — sorted by spend",
    companyName,
    country,
    rows,
    filename: `kimates-all-customers-${new Date().toISOString().split("T")[0]}.pdf`,
    ranked: false,
  });
}
