// Customer reports — Top 10 monthly + All customers full list.
// Both share the same row shape, so we use one autoTable call with a flag
// that toggles podium emojis for the top 10.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BRAND, PAGE, drawHeader, drawFooterOnAllPages, savePdf } from "./branding";
import { formatCurrency } from "@/lib/utils";

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

interface ReportOpts {
  title: string;
  subtitle: string;
  companyName: string;
  rows: ReportRow[];
  filename: string;
  /** Show podium markers (Gold/Silver/Bronze) on the first 3 rows */
  ranked?: boolean;
}

function buildReport({ title, subtitle, companyName, rows, filename, ranked = false }: ReportOpts) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const startY = drawHeader(doc, { title, subtitle, companyName });

  // Empty state
  if (rows.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.textFaint);
    doc.text("No data available for this period.", PAGE.width / 2, startY + 30, { align: "center" });
    drawFooterOnAllPages(doc);
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
    formatCurrency(r.totalSpend),
  ]);

  autoTable(doc, {
    startY,
    head: [["#", "Customer", "Mobile", "Purchases", "Total Spend"]],
    body,
    theme: "plain",
    margin: { left: PAGE.margin, right: PAGE.margin, bottom: PAGE.margin + 5 },
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
    columnStyles: {
      0: { halign: "center", cellWidth: 14, fontStyle: "bold" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 38, font: "courier", fontSize: 9 },
      3: { halign: "right", cellWidth: 22 },
      4: { halign: "right", cellWidth: 32, fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
    didParseCell: (data) => {
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

  let sy = finalY + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.textSoft);
  doc.text(
    `${rows.length} customer${rows.length === 1 ? "" : "s"}  •  ${totalPurchases} purchase${totalPurchases === 1 ? "" : "s"}  •  Total: ${formatCurrency(totalSpend)}`,
    PAGE.width - PAGE.margin,
    sy,
    { align: "right" }
  );

  drawFooterOnAllPages(doc);
  savePdf(doc, filename);
}

export function generateTop10Pdf(rows: ReportRow[], monthLabel: string, companyName: string) {
  // Page already passes the tie-aware list (may be >10 if customers tie at the
  // cutoff amount). Don't slice here — that would re-introduce the bug.
  buildReport({
    title: "Top 10 Customers",
    subtitle: monthLabel,
    companyName,
    rows,
    filename: `kimates-top10-${monthLabel.replaceAll(/\s+/g, "-").toLowerCase()}.pdf`,
    ranked: true,
  });
}

export function generateAllCustomersPdf(rows: ReportRow[], companyName: string) {
  buildReport({
    title: "All Customers",
    subtitle: "All-time totals — sorted by spend",
    companyName,
    rows,
    filename: `kimates-all-customers-${new Date().toISOString().split("T")[0]}.pdf`,
    ranked: false,
  });
}
