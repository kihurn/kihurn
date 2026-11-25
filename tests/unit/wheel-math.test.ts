import { describe, expect, it } from "vitest";
import { snapWheelTarget, wheelStepDirection, wrapHalfOffset, wrapIndex } from "@/lib/wheelMath";

describe("wheelMath", () => {
  it("wraps negative and overflow indices modulo count", () => {
    expect(wrapIndex(0, 8)).toBe(0);
    expect(wrapIndex(-1, 8)).toBe(7);
    expect(wrapIndex(9, 8)).toBe(1);
    expect(wrapIndex(-9, 8)).toBe(7);
  });

  it("computes shortest signed circular offset in [-N/2, N/2)", () => {
    expect(wrapHalfOffset(7, 8)).toBe(-1);
    expect(wrapHalfOffset(-7, 8)).toBe(1);
    expect(wrapHalfOffset(1, 8)).toBe(1);
    expect(wrapHalfOffset(0, 8)).toBe(0);
  });

  it("snaps targets to nearest integer detent and computes shortest click step", () => {
    expect(snapWheelTarget(2.4, 0.3)).toBe(3);
    expect(snapWheelTarget(2.1, -0.2)).toBe(2);
    expect(wheelStepDirection(0.1, 7, 8)).toBe(-1);
    expect(wheelStepDirection(6.9, 0, 8)).toBe(8);
  });
});
