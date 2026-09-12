import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { endOfLocalDayIso, startOfLocalDayIso, toLocalDateInput } from "@/lib/dates";
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

describe("date range filters", () => {
  for (const tz of ZONES) {
    it(`starts at local midnight of the chosen day (${tz})`, () => {
      process.env.TZ = tz;
      const start = new Date(startOfLocalDayIso("2027-03-15"));
      assert.equal(toLocalDateInput(start), "2027-03-15");
      assert.equal(start.getHours(), 0);
      assert.equal(start.getMinutes(), 0);
      // One millisecond earlier is the previous local day — nothing of the 15th is cut.
      assert.equal(toLocalDateInput(new Date(start.getTime() - 1)), "2027-03-14");
    });

    it(`a single-day range covers the whole local day (${tz})`, () => {
      process.env.TZ = tz;
      // The bug: from=to=the same bare date matched only one instant, so it returned
      // nothing. A purchase at 23:30 local must fall inside the range.
      const from = new Date(startOfLocalDayIso("2027-03-15")).getTime();
      const to = new Date(endOfLocalDayIso("2027-03-15")).getTime();
      const lateEvening = new Date(2027, 2, 15, 23, 30).getTime();
      assert.ok(from <= lateEvening && lateEvening <= to);
      assert.equal(to - from, 24 * 60 * 60 * 1000 - 1);
    });
  }

  it("handles month and year boundaries", () => {
    process.env.TZ = "Africa/Johannesburg";
    assert.equal(toLocalDateInput(startOfLocalDayIso("2027-01-01")), "2027-01-01");
    assert.equal(toLocalDateInput(startOfLocalDayIso("2028-02-29")), "2028-02-29");
  });
});
