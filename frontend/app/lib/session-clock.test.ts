// The backend sends session timestamps with no timezone ("2026-09-26T17:20:58.34")
// and means UTC by them. Reading one as local time is what used to make a
// session that had just started look hours old — long enough for the timer to
// declare it finished and end it on the server, trimming it to the minutes
// worked. These tests are timezone-independent: every expectation is built
// from a UTC instant.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { elapsedSinceStart, parseServerDate } from "./session-clock";

const STARTED_AT = Date.UTC(2026, 8, 26, 17, 20, 58, 348); // 2026-09-26T17:20:58.348Z

describe("parseServerDate", () => {
  it("reads a timestamp with no timezone as UTC", () => {
    expect(parseServerDate("2026-09-26T17:20:58.348")).toBe(STARTED_AT);
  });

  it("leaves a timestamp that already carries a zone alone", () => {
    expect(parseServerDate("2026-09-26T17:20:58.348Z")).toBe(STARTED_AT);
    expect(parseServerDate("2026-09-26T20:20:58.348+03:00")).toBe(STARTED_AT);
  });

  it("returns null for nothing, or for something unparseable", () => {
    expect(parseServerDate(undefined)).toBeNull();
    expect(parseServerDate(null)).toBeNull();
    expect(parseServerDate("")).toBeNull();
    expect(parseServerDate("not a date")).toBeNull();
  });
});

describe("elapsedSinceStart", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts only the seconds that have really passed", () => {
    vi.setSystemTime(STARTED_AT + 90_000);
    // 90 seconds in — not the offset-sized figure that ended sessions early.
    expect(elapsedSinceStart("2026-09-26T17:20:58.348")).toBe(90);
  });

  it("agrees whether or not the server spells out the zone", () => {
    vi.setSystemTime(STARTED_AT + 42_000);
    expect(elapsedSinceStart("2026-09-26T17:20:58.348")).toBe(
      elapsedSinceStart("2026-09-26T17:20:58.348Z"),
    );
  });

  it("never goes negative for a start time in the future", () => {
    vi.setSystemTime(STARTED_AT - 60_000);
    expect(elapsedSinceStart("2026-09-26T17:20:58.348")).toBe(0);
  });

  it("has nothing to say without a start time", () => {
    expect(elapsedSinceStart(null)).toBeNull();
  });
});
