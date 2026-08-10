// Branded QR code poster — designed to be printed and stuck on a wall at
// the fuel station / shop. Customers scan it to submit a purchase.

import { jsPDF } from "jspdf";
import {
  BRAND,
  PAGE,
  PLATFORM_DOMAIN,
  WORDMARK_RATIO,
  drawWordmark,
  loadBrandAssets,
  savePdf,
} from "./branding";
import { formatAddress } from "@/lib/utils";
import type { Company } from "@/types";

/**
 * Generate a printable QR poster.
 * @param company   The company profile (name, address, qrUrl, businessType)
 * @param qrCanvas  An HTMLCanvasElement that already has the QR rendered on it
 *                  (typically the canvas from <QRCodeCanvas ref=... />)
 */
export async function generateQrPosterPdf(
  company: Company,
  qrCanvas: HTMLCanvasElement,
): Promise<void> {
  const assets = await loadBrandAssets();

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const { width, height, margin } = PAGE;

  // ─── Outer brand border ────────────────────────────────────
  doc.setDrawColor(...BRAND.primary);
  doc.setLineWidth(2);
  doc.rect(margin / 2, margin / 2, width - margin, height - margin);

  // ─── Top brand strip ───────────────────────────────────────
  // Taller than it needs to be for the logo alone: this poster goes on a wall and is
  // read from a distance, so the band is the thing that identifies it across a room.
  const bandHeight = 27;
  const bandTop = margin / 2;
  doc.setFillColor(...BRAND.primary);
  doc.rect(bandTop, bandTop, width - margin, bandHeight, "F");

  // The logo sits on a white plate rather than being reversed out of the teal. The
  // full-colour lockup is the strongest version of the mark, and it is the only asset
  // that is tightly cropped — the white variant carries ~35% transparent padding, so
  // at any given box height it renders visibly smaller than it should.
  const plateW = 108;
  const plateH = 18;
  const plateX = (width - plateW) / 2;
  const plateY = bandTop + (bandHeight - plateH) / 2;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(plateX, plateY, plateW, plateH, 2.5, 2.5, "F");

  const logoH = 12.5;
  const logoW = logoH * WORDMARK_RATIO;
  drawWordmark(doc, assets, plateX + (plateW - logoW) / 2, plateY + (plateH - logoH) / 2, logoH);

  // ─── Headline ──────────────────────────────────────────────
  let y = bandTop + bandHeight + 12;
  doc.setTextColor(...BRAND.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("Scan to Submit", width / 2, y, { align: "center" });

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...BRAND.textSoft);
  doc.text("Your Purchase Receipt", width / 2, y, { align: "center" });

  // ─── QR code (centered) ────────────────────────────────────
  const qrSize = 110; // mm
  const qrX = (width - qrSize) / 2;
  const qrY = y + 12;

  // Soft tinted background frame around the QR
  doc.setFillColor(...BRAND.rowAlt);
  doc.roundedRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 4, 4, "F");

  const qrDataUrl = qrCanvas.toDataURL("image/png", 1.0);
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // ─── Company info under the QR ─────────────────────────────
  let infoY = qrY + qrSize + 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...BRAND.text);
  doc.text(company.name, width / 2, infoY, { align: "center" });

  infoY += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.textSoft);
  const businessLabel = company.businessType === "fuel_station" ? "Fuel Station" : "Shop";
  doc.text(businessLabel, width / 2, infoY, { align: "center" });

  // Address — formatted as a single line, wrapped to width
  const addressLine = formatAddress(company);
  if (addressLine) {
    infoY += 6;
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.textFaint);
    const addressLines = doc.splitTextToSize(addressLine, width - margin * 4);
    doc.text(addressLines, width / 2, infoY, { align: "center" });
    infoY += addressLines.length * 4.5;
  }

  // ─── Step hint at the bottom ───────────────────────────────
  const hintY = height - margin - 20;

  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.3);
  doc.line(margin + 10, hintY - 8, width - margin - 10, hintY - 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.accent);
  doc.text("HOW TO USE", width / 2, hintY - 2, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.textSoft);
  const steps = "1. Scan with your phone camera   2. Fill in your purchase details   3. Submit";
  doc.text(steps, width / 2, hintY + 4, { align: "center" });

  // ─── "Powered by KIMates" lockup at the very bottom ────────
  // Anchored to the page rather than to the company block above it: the address wraps
  // to an unknown number of lines, and this must not be pushed into it.
  const markH = 6.5;
  const markW = markH * WORDMARK_RATIO;
  const markBaseline = height - margin / 2 - 11;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.textSoft);
  const prefix = "Powered by ";
  const prefixW = doc.getTextWidth(prefix);
  const lockupX = (width - (prefixW + markW)) / 2;
  doc.text(prefix, lockupX, markBaseline);
  drawWordmark(doc, assets, lockupX + prefixW, markBaseline - markH + 1.4, markH);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.textFaint);
  doc.text(PLATFORM_DOMAIN, width / 2, height - margin / 2 - 4, { align: "center" });

  // ─── Save ──────────────────────────────────────────────────
  const safeName = company.name.replaceAll(/[^a-z0-9]+/gi, "-").toLowerCase();
  savePdf(doc, `kimates-qr-${safeName}.pdf`);
}
