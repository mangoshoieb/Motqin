// The three kinds of date the API sends (Tracking Tables Front Guide, "Dates
// in every API"): UTC moments, calendar days and picked local times.
import { describe, expect, it } from "vitest";
import {
  calendarDay,
  calendarDayToDate,
  momentMs,
  parseLocalDateTime,
  timeAgo,
  toLocalDateTime,
  wallClock,
} from "./date";

const AT = Date.UTC(2026, 10, 24, 14, 30, 0);

describe("moments", () => {
  it("reads …Z, an offset and a bare (older server) value as the same UTC instant", () => {
    expect(momentMs("2026-11-24T14:30:00Z")).toBe(AT);
    expect(momentMs("2026-11-24T16:30:00+02:00")).toBe(AT);
    expect(momentMs("2026-11-24T14:30:00")).toBe(AT);
    expect(momentMs(null)).toBeNull();
    expect(momentMs("nonsense")).toBeNull();
  });

  it("says منذ دقيقة for a table edited a minute ago, never two hours", () => {
    expect(timeAgo("2026-11-24T14:29:00Z", AT)).toBe("منذ دقيقة");
    expect(timeAgo("2026-11-24T14:28:00Z", AT)).toBe("منذ دقيقتين");
    expect(timeAgo("2026-11-24T14:25:00Z", AT)).toBe("منذ 5 دقائق");
    expect(timeAgo("2026-11-24T12:30:00Z", AT)).toBe("منذ ساعتين");
    expect(timeAgo("2026-11-24T14:30:00Z", AT)).toBe("الآن");
  });
});

describe("calendar days", () => {
  it("keeps the day as text and builds a local midnight, not UTC", () => {
    expect(calendarDay("2026-11-24T00:00:00")).toBe("2026-11-24");
    const date = calendarDayToDate("2026-11-24")!;
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 10, 24, 0]);
  });
});

describe("picked local times", () => {
  it("shows 10:00 as 10:00 and sends it back without a Z", () => {
    expect(wallClock("2026-11-28T10:00:00")).toBe("10:00");
    expect(wallClock("10:00:00")).toBe("10:00");
    const date = parseLocalDateTime("2026-11-28T10:00:00")!;
    expect(date.getHours()).toBe(10);
    expect(toLocalDateTime(date)).toBe("2026-11-28T10:00:00");
  });
});
