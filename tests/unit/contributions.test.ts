import { describe, expect, it } from "vitest";
import { calendarWeeks, parseGitHubCalendar } from "@/lib/contributions";

describe("contribution calendar", () => {
  it("pairs public GitHub tooltip counts with their dates", () => {
    const html = `
      <td id="day-1" data-date="2026-11-24" data-level="4"></td>
      <tool-tip for="day-1">1,024 contributions on November 24th.</tool-tip>
      <td data-date="2026-11-23" data-level="0" id="day-0"></td>
      <tool-tip for="day-0">No contributions on November 23rd.</tool-tip>
      <td data-date="2026-11-22" data-level="2" id="unknown"></td>
    `;
    expect(parseGitHubCalendar(html)).toEqual([
      { date: "2026-11-23", count: 0, level: 0 },
      { date: "2026-11-24", count: 1024, level: 4 },
    ]);
  });

  it("keeps the 52-week grid stable and leaves future days blank", () => {
    const cells = calendarWeeks([], "2026-11-25");
    expect(cells).toEqual(calendarWeeks([], "2026-11-25"));
    expect(cells).toHaveLength(364);
    expect(cells[360]?.date).toBe("2026-11-25");
    expect(cells.slice(-3)).toEqual([null, null, null]);
  });
});
