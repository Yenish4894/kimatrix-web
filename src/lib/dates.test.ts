import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { endOfLocalDayIso, toLocalDateInput } from "@/lib/dates";
import { formatDate } from "@/lib/utils";

/**
 * Run in the timezones that actually matter. Node applies a change to process.env.TZ
 * immediately, so each case below really is evaluated in that zone. New York is here
 * as the control: behind UTC, where the old `.slice(0, 10)` prefill went wrong the
 * other way.
 */
const ZONES = ["Africa/Johannesburg", "Asia/Kolkata", "UTC", "America/New_York"];
const ORIGINAL_TZ = process.env.TZ;
afterEach(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
});

describe("comp end dates", () => {
  for (const tz of ZONES) {
    it(`shows the date that was picked (${tz})`, () => {
      process.env.TZ = tz;
      // The bug: picking 15 March displayed "16 Mar 2027" east of UTC.
      assert.equal(formatDate(endOfLocalDayIso("2027-03-15")), "15 Mar 2027");
    });

    it(`prefills the edit form with the same date (${tz})`, () => {
      process.env.TZ = tz;
      assert.equal(toLocalDateInput(endOfLocalDayIso("2027-03-15")), "2027-03-15");
    });

    it(`covers the whole chosen day (${tz})`, () => {
      process.env.TZ = tz;
      const end = new Date(endOfLocalDayIso("2027-03-15"));
      assert.equal(end.getHours(), 23);
      assert.equal(end.getMinutes(), 59);
      assert.equal(toLocalDateInput(new Date(end.getTime() + 1)), "2027-03-16");
    });
  }

  it("handles month and year boundaries", () => {
    process.env.TZ = "Asia/Kolkata";
    assert.equal(toLocalDateInput(endOfLocalDayIso("2026-12-31")), "2026-12-31");
    assert.equal(toLocalDateInput(endOfLocalDayIso("2028-02-29")), "2028-02-29");
  });
});
