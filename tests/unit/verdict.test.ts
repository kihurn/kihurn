import { describe, expect, it } from "vitest";
import { euclidean, FACE_THRESHOLD, verdict } from "@/lib/face/verdict";

const t = 0.6;
describe("verdict", () => {
  it("no face", () => expect(verdict({ faces: 0, distance: null, threshold: t })).toBe("no-face"));
  it("multiple faces beat everything else", () => expect(verdict({ faces: 2, distance: 0.1, threshold: t })).toBe("multiple-faces"));
  it("no reference yet means enrol", () => expect(verdict({ faces: 1, distance: null, threshold: t })).toBe("enrol"));
  it("below the threshold matches", () => expect(verdict({ faces: 1, distance: 0.4, threshold: t })).toBe("match"));
  it("exactly the threshold matches", () => expect(verdict({ faces: 1, distance: t, threshold: t })).toBe("match"));
  it("above the threshold does not", () => expect(verdict({ faces: 1, distance: 0.61, threshold: t })).toBe("no-match"));
});

describe("euclidean", () => {
  it("3-4-5", () => expect(euclidean(new Float32Array([0, 0]), new Float32Array([3, 4]))).toBe(5));
  it("is zero for the same vector", () => expect(euclidean(new Float32Array([1, 2]), new Float32Array([1, 2]))).toBe(0));
});

it("uses the SecureFin README threshold", () => expect(FACE_THRESHOLD).toBe(0.6));
