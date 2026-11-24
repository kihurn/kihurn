import { describe, expect, it } from "vitest";
import { formatKLTime } from "@/lib/time";

describe("formatKLTime", () => {
  it("formats 12:18 UTC as KL 20:18", () => {
    expect(formatKLTime(new Date("2026-11-24T12:18:00Z"))).toBe("KL 20:18");
  });

  it("wraps past midnight: 16:05 UTC is KL 00:05", () => {
    expect(formatKLTime(new Date("2026-11-24T16:05:00Z"))).toBe("KL 00:05");
  });

  it("does not depend on the process time zone", () => {
    const before = process.env.TZ;
    process.env.TZ = "America/New_York";
    try {
      expect(formatKLTime(new Date("2026-11-24T16:05:00Z"))).toBe("KL 00:05");
    } finally {
      if (before === undefined) delete process.env.TZ;
      else process.env.TZ = before;
    }
  });
});
