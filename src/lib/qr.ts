/**
 * Shared QR rendering settings.
 *
 * The same code is drawn in three places — the dashboard preview, the QR page, and
 * the printed poster (which reuses the QR page's canvas). They must agree, because a
 * customer scans whichever one is in front of them.
 */

/**
 * Fraction of the code's width taken by the centre logo.
 *
 * Expressed as a ratio rather than pixels so it holds at every size: the number of
 * modules varies with the length of a company's QR URL, but the proportion of the
 * code that the logo covers does not.
 *
 * 0.2 clears roughly 9 of 45 modules — about 4% of the code. Every value tested up to
 * 14 modules (9.7%) still decoded, so this sits with real headroom, which matters
 * because the decode test is a clean synthetic image and a real scan is a phone
 * camera pointed at a printed poster in a fuel station forecourt.
 *
 * `level="H"` is what makes this safe at all: 30% of the code is recoverable, so the
 * modules under the logo are reconstructed rather than read. Never lower the error
 * correction level while a logo is present.
 */
export const QR_LOGO_RATIO = 0.2;

export const QR_COLORS = {
  bg: "#ffffff",
  fg: "#0891B2",
} as const;

/**
 * `imageSettings` for qrcode.react, or undefined below the size where a logo would be
 * unreadable mush rather than a mark.
 */
export function qrLogoSettings(size: number):
  | { src: string; height: number; width: number; excavate: true }
  | undefined {
  const logo = Math.round(size * QR_LOGO_RATIO);
  // Under ~24px the icon reads as a smudge in the middle of the code, which looks
  // like damage rather than branding.
  if (logo < 24) return undefined;
  return {
    src: "/brand/kimates-icon.png",
    height: logo,
    width: logo,
    // Clears the modules underneath instead of drawing over live ones. Error
    // correction reconstructs them, and the mark stays crisp.
    excavate: true,
  };
}
