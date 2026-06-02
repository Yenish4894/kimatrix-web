// Shared PDF branding — used by all generated documents.
// Keep colors / fonts in sync with the on-screen design tokens (globals.css).

import type { jsPDF } from "jspdf";

// Brand colors (RGB tuples — jsPDF wants R/G/B not hex)
export const BRAND = {
  primary: [13, 148, 136] as [number, number, number],   // teal-600
  primaryDark: [15, 118, 110] as [number, number, number], // teal-700
  accent: [249, 115, 22] as [number, number, number],    // orange-500
  text: [15, 23, 42] as [number, number, number],        // slate-900
  textSoft: [100, 116, 139] as [number, number, number], // slate-500
  textFaint: [148, 163, 184] as [number, number, number],// slate-400
  border: [226, 232, 240] as [number, number, number],   // slate-200
  rowAlt: [240, 253, 250] as [number, number, number],   // teal-50
};

// A4 dimensions in mm (jsPDF default unit)
export const PAGE = {
  width: 210,
  height: 297,
  margin: 20,
};

/**
 * Draw the standard branded header at the top of a page.
 * Returns the Y position where content can start below the header.
 */
export function drawHeader(
  doc: jsPDF,
  opts: { title: string; subtitle?: string; companyName?: string }
): number {
  const { margin } = PAGE;
  let y = margin;

  // KIMATES wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.primary);
  doc.text("KIMATES", margin, y);

  // Right-aligned generated date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.textFaint);
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  doc.text(`Generated ${dateStr}`, PAGE.width - margin, y, { align: "right" });

  y += 8;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...BRAND.text);
  doc.text(opts.title, margin, y);

  y += 6;

  // Subtitle
  if (opts.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.textSoft);
    doc.text(opts.subtitle, margin, y);
    y += 5;
  }

  // Company name
  if (opts.companyName) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.textSoft);
    doc.text(opts.companyName, margin, y);
    y += 5;
  }

  // Divider
  y += 2;
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.4);
  doc.line(margin, y, PAGE.width - margin, y);
  y += 6;

  return y;
}

/**
 * Draw the footer — KIMates brand strip + @KIMates attribution + page number —
 * on every page. Call after content is written, before saving.
 *
 * Layout: "KIMates — Customer Purchase Tracking Platform" (left)
 *         "@KIMates · Page N of M" (right, accent-tinted attribution)
 */
export function drawFooterOnAllPages(doc: jsPDF) {
  const { margin } = PAGE;
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    const y = PAGE.height - margin + 5;

    // Top divider
    doc.setDrawColor(...BRAND.border);
    doc.setLineWidth(0.3);
    doc.line(margin, y - 4, PAGE.width - margin, y - 4);

    // Left: KIMates brand strip
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.textFaint);
    doc.text("KIMates — Customer Purchase Tracking Platform", margin, y);

    // Right: @KIMates attribution + page count
    // @KIMates rendered in accent color so it pops without dominating
    const pageLabel = `Page ${i} of ${pageCount}`;
    const pageWidth = doc.getTextWidth(pageLabel);
    doc.text(pageLabel, PAGE.width - margin, y, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.accent);
    const kim = "@KIMates";
    const kimWidth = doc.getTextWidth(kim);
    const sep = " · ";
    const sepWidth = doc.getTextWidth(sep);
    doc.text(kim, PAGE.width - margin - pageWidth - sepWidth - kimWidth, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.textFaint);
    doc.text(sep, PAGE.width - margin - pageWidth - sepWidth, y);
  }
}

/**
 * Trigger the browser download for a generated jsPDF document.
 */
export function savePdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}
