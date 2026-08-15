import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { QR_LOGO_RATIO, qrLogoSettings } from "./qr";

describe("qrLogoSettings", () => {
  it("keeps the logo at the verified proportion of the code", () => {
    // A real company QR is 45 modules, so 0.2 clears about 9 of them. Sizes up to 14
    // modules cleared were decoded successfully; this sits well inside that.
    assert.equal(QR_LOGO_RATIO, 0.2);
    assert.deepEqual(qrLogoSettings(660), {
      src: "/brand/kimates-icon.png",
      height: 132,
      width: 132,
      excavate: true,
    });
  });

  it("scales with the code rather than using fixed pixels", () => {
    // The module count varies with the length of a company's QR URL. A fixed pixel
    // size would cover a different share of the code for different companies — and
    // the share is the thing that decides whether it still scans.
    assert.equal(qrLogoSettings(160)?.width, 32);
    assert.equal(qrLogoSettings(300)?.width, 60);
  });

  it("always excavates rather than drawing over live modules", () => {
    // Painting on top leaves unreadable modules the decoder still tries to read.
    // Excavating clears them so error correction reconstructs them instead.
    assert.equal(qrLogoSettings(660)?.excavate, true);
  });

  it("drops the logo entirely when it would be too small to read", () => {
    // Below ~24px the mark is a smudge in the middle of the code, which reads as
    // damage rather than branding.
    assert.equal(qrLogoSettings(100), undefined);
    assert.equal(qrLogoSettings(64), undefined);
  });
});
