export interface TornPoint {
  x: number;
  y: number;
}

export function generateTornEdgePoints(
  width: number,
  baseY: number,
  seed: number,
  amplitude = 26,
  segments = 42,
): TornPoint[] {
  const safeW = Math.max(1, width);
  const count = Math.max(4, segments);
  const pts: TornPoint[] = [];

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const x = t * safeW;
    const wave1 = Math.sin(t * Math.PI * 5.5 + seed * 1.3) * 0.45;
    const wave2 = Math.cos(t * Math.PI * 13.7 + seed * 2.9) * 0.3;
    const jag = Math.sin(t * Math.PI * 31.3 + seed * 5.7) * 0.25;
    const offset = (wave1 + wave2 + jag) * amplitude;
    pts.push({ x, y: baseY + offset });
  }

  return pts;
}

export function computeTornWipeOffsets(progress: number, height: number, pad = 48): {
  topEdgeY: number;
  bottomEdgeY: number;
} {
  const p = Math.max(0, Math.min(1, progress));
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  if (p <= 0.5) {
    const k = easeOut(p / 0.5);
    return {
      topEdgeY: (height + pad) * (1 - k) - pad * k,
      bottomEdgeY: height + pad,
    };
  }

  const k = easeInOut((p - 0.5) / 0.5);
  return {
    topEdgeY: -pad,
    bottomEdgeY: (height + pad) * (1 - k) - pad * k,
  };
}
