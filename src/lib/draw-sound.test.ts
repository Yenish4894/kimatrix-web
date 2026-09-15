import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tickTimes } from "./draw-sound";

describe("tickTimes", () => {
  const times = tickTimes(360 * 6 + 180, 4500, 10);

  it("stays within the spin and is strictly increasing", () => {
    assert.ok(times.length > 10);
    assert.ok(times[0] >= 0);
    assert.ok(times[times.length - 1] <= 4500);
    for (let i = 1; i < times.length; i++) assert.ok(times[i] > times[i - 1]);
  });

  it("respects the minimum gap", () => {
    for (let i = 1; i < times.length; i++) assert.ok(times[i] - times[i - 1] >= 44);
  });

  it("slows down as the wheel decelerates", () => {
    const firstGap = times[1] - times[0];
    const lastGap = times[times.length - 1] - times[times.length - 2];
    assert.ok(lastGap > firstGap * 3, `${firstGap} vs ${lastGap}`);
  });

  it("returns nothing for a non-spin", () => {
    assert.deepEqual(tickTimes(0, 4500, 10), []);
    assert.deepEqual(tickTimes(720, 0, 10), []);
    assert.deepEqual(tickTimes(720, 4500, 0), []);
  });
});
