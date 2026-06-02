// Branded QR code poster — designed to be printed and stuck on a wall at
// the fuel station / shop. Customers scan it to submit a purchase.

import { jsPDF } from "jspdf";
import { BRAND, PAGE, savePdf } from "./branding";
import { formatAddress } from "@/lib/utils";
import type { Company } from "@/types";

/**
 * Generate a printable QR poster.
 * @param company   The company profile (name, address, qrUrl, businessType)
 * @param qrCanvas  An HTMLCanvasElement that already has the QR rendered on it
 *                  (typically the canvas from <QRCodeCanvas ref=... />)
 */
export function generateQrPosterPdf(company: Company, qrCanvas: HTMLCanvasElement) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const { width, height, margin } = PAGE;

  // ─── Outer brand border ────────────────────────────────────
  doc.setDrawColor(...BRAND.primary);
  doc.setLineWidth(2);
  doc.rect(margin / 2, margin / 2, width - margin, height - margin);

  // ─── Top brand strip ───────────────────────────────────────
  doc.setFillColor(...BRAND.primary);
  doc.rect(margin / 2, margin / 2, width - margin, 18, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("KIMATES", width / 2, margin / 2 + 12, { align: "center" });

  // ─── Headline ──────────────────────────────────────────────
  let y = margin + 18;
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
  let infoY = qrY + qrSize + 22;
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

  // ─── @KIMates attribution at very bottom ─────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.accent);
  doc.text("@KIMates", width / 2, height - margin / 2 - 2, { align: "center" });

  // ─── Save ──────────────────────────────────────────────────
  const safeName = company.name.replaceAll(/[^a-z0-9]+/gi, "-").toLowerCase();
  savePdf(doc, `kimates-qr-${safeName}.pdf`);
}
