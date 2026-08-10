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

/** The one-line description of what the platform is. Used under the wordmark. */
export const PLATFORM_TAGLINE = "Customer Purchase Tracking Platform";
export const PLATFORM_DOMAIN = "kimates.com";

/**
 * Intrinsic aspect ratios of the brand assets, measured from the PNGs.
 *
 * Hard-coded rather than read off `naturalWidth / naturalHeight` so that layout
 * geometry is known before the images resolve — the running header has to place a
 * logo synchronously from inside an autoTable page callback, and a wrong ratio there
 * silently stretches the wordmark.
 */
export const WORDMARK_RATIO = 450 / 98;
const ICON_RATIO = 1;

export interface BrandAssets {
  /** Full colour "mark + KIMates" lockup, as a data URL. Null if it failed to load. */
  wordmark: string | null;
  /** Square mark on its own, for sizes where the wordmark would be unreadable. */
  icon: string | null;
}

/**
 * Fetch an image as a base64 data URL.
 *
 * jsPDF's `addImage` accepts either an `HTMLImageElement` or a data URL, and the data
 * URL path touches no DOM at all — which is what lets the layout be rendered and
 * checked outside a browser.
 */
async function loadImage(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

let assetsPromise: Promise<BrandAssets> | null = null;

/**
 * Load the brand images once per session.
 *
 * Every draw helper below takes the result as a plain argument instead of awaiting
 * it internally. That is deliberate: autoTable's page callbacks are synchronous, so
 * the running header on page 2+ can only draw a logo that is already in hand.
 *
 * Never rejects — a failed load yields nulls and every helper falls back to a text
 * lockup. A missing PNG must degrade the branding, not the report.
 */
export function loadBrandAssets(): Promise<BrandAssets> {
  assetsPromise ??= Promise.all([
    loadImage("/brand/kimates-logo.png"),
    loadImage("/brand/kimates-icon.png"),
  ]).then(([wordmark, icon]) => ({ wordmark, icon }));
  return assetsPromise;
}

/**
 * Draw the KIMates wordmark at a given cap height, or a text substitute of roughly
 * the same visual weight if the image is unavailable. Returns the width consumed.
 */
export function drawWordmark(
  doc: jsPDF,
  assets: BrandAssets,
  x: number,
  y: number,
  height: number,
): number {
  if (assets.wordmark) {
    const width = height * WORDMARK_RATIO;
    doc.addImage(assets.wordmark, "PNG", x, y, width, height);
    return width;
  }

  // Fallback: "KIMates" set at a size that fills the same band. 2.6 is the ratio of
  // helvetica-bold cap height to point size, converted through mm.
  const fontSize = height * 2.6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  doc.setTextColor(...BRAND.primary);
  const label = "KIMates";
  doc.text(label, x, y + height * 0.85);
  return doc.getTextWidth(label);
}

/** Letterspaced small caps — the platform name treatment. Resets char spacing after. */
function drawSpacedCaps(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  opts: { size: number; spacing: number; color: [number, number, number]; align?: "left" | "center" },
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(opts.size);
  doc.setTextColor(...opts.color);
  doc.setCharSpace(opts.spacing);
  doc.text(text.toUpperCase(), x, y, { align: opts.align ?? "left" });
  // Char spacing is document state, not a per-call option — leaking it turns every
  // subsequent string on the page into wide-set text.
  doc.setCharSpace(0);
}

/**
 * Draw the branded masthead at the top of page 1.
 * Returns the Y position where content can start below it.
 */
export function drawHeader(
  doc: jsPDF,
  assets: BrandAssets,
  opts: { title: string; subtitle?: string; companyName?: string },
): number {
  const { margin, width } = PAGE;

  // Full-bleed brand bar. The orange segment carries the secondary brand colour into
  // documents that are otherwise entirely teal.
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, width, 4, "F");
  doc.setFillColor(...BRAND.accent);
  doc.rect(0, 0, 52, 4, "F");

  // Wordmark, at a size meant to be seen — this is the platform's signature on a
  // document the merchant prints and hands to other people.
  const logoTop = 13;
  const logoHeight = 14;
  drawWordmark(doc, assets, margin, logoTop, logoHeight);

  // Generated date, right-aligned against the wordmark's optical centre.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.textFaint);
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  doc.text(`Generated ${dateStr}`, width - margin, logoTop + logoHeight * 0.65, { align: "right" });

  // Platform name, set wide under the wordmark so the document says what it is.
  let y = logoTop + logoHeight + 6;
  drawSpacedCaps(doc, PLATFORM_TAGLINE, margin, y, {
    size: 7.5,
    spacing: 1.15,
    color: BRAND.primary,
  });

  y += 4;
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, width - margin, y);

  // Document title
  y += 11;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BRAND.text);
  doc.text(opts.title, margin, y);

  if (opts.subtitle) {
    y += 6.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.textSoft);
    doc.text(opts.subtitle, margin, y);
  }

  if (opts.companyName) {
    y += 5.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.primaryDark);
    doc.text(opts.companyName, margin, y);
  }

  // Closing rule — teal and heavier than the hairline above, so the masthead reads as
  // one block rather than three loose lines.
  y += 5;
  doc.setDrawColor(...BRAND.primary);
  doc.setLineWidth(0.8);
  doc.line(margin, y, width - margin, y);

  return y + 7;
}

/**
 * Compact header for continuation pages.
 *
 * Without this, page 2 onward of a long report carries no mark at all — which is most
 * of the document once a merchant exports their full customer list.
 */
export function drawRunningHeader(doc: jsPDF, assets: BrandAssets, title: string) {
  const { margin, width } = PAGE;

  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, width, 2.5, "F");
  doc.setFillColor(...BRAND.accent);
  doc.rect(0, 0, 52, 2.5, "F");

  drawWordmark(doc, assets, margin, 9, 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.textFaint);
  doc.text(title, width - margin, 14.5, { align: "right" });

  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.3);
  doc.line(margin, 19, width - margin, 19);
}

/** Vertical space `drawRunningHeader` needs — use as autoTable's top margin. */
export const RUNNING_HEADER_HEIGHT = 24;

/**
 * Draw the footer on every page: mark + platform name on the left, domain and page
 * count on the right. Call after content is written, before saving.
 */
export function drawFooterOnAllPages(doc: jsPDF, assets: BrandAssets) {
  const { margin, width, height } = PAGE;
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    const y = height - margin + 5;

    doc.setDrawColor(...BRAND.border);
    doc.setLineWidth(0.3);
    doc.line(margin, y - 5, width - margin, y - 5);

    // Left: mark + name + what the platform does.
    let x = margin;
    const iconSize = 4.6;
    if (assets.icon) {
      doc.addImage(assets.icon, "PNG", x, y - iconSize + 1, iconSize * ICON_RATIO, iconSize);
      x += iconSize + 2;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...BRAND.primary);
    doc.text("KIMates", x, y);
    x += doc.getTextWidth("KIMates") + 2.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.textFaint);
    doc.text(PLATFORM_TAGLINE, x, y);

    // Right: domain, then the page count. Positioned by measuring the whole tail and
    // laying it out left-to-right — right-aligning the page label and then guessing
    // where the domain ends is how these two ran into each other.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const pageLabel = `Page ${i} of ${pageCount}`;
    const sep = "  ·  ";
    const tail = `${PLATFORM_DOMAIN}${sep}${pageLabel}`;
    let tx = width - margin - doc.getTextWidth(tail);

    doc.setTextColor(...BRAND.textFaint);
    doc.text(`${PLATFORM_DOMAIN}${sep}`, tx, y);
    tx += doc.getTextWidth(`${PLATFORM_DOMAIN}${sep}`);

    doc.setTextColor(...BRAND.textSoft);
    doc.text(pageLabel, tx, y);
  }
}

/**
 * Trigger the browser download for a generated jsPDF document.
 */
export function savePdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}
