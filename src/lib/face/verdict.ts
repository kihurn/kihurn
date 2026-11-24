export type Verdict = "no-face" | "multiple-faces" | "match" | "no-match" | "enrol";

/** SecureFin's README: a match is a Euclidean distance below 0.6. */
export const FACE_THRESHOLD = 0.6;

export function verdict(input: { faces: number; distance: number | null; threshold: number }): Verdict {
  if (input.faces === 0) return "no-face";
  if (input.faces > 1) return "multiple-faces";
  if (input.distance === null) return "enrol";
  return input.distance <= input.threshold ? "match" : "no-match";
}

export function euclidean(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}
