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
  edgeStrength: number;
} {
  const p = Math.max(0, Math.min(1, progress));
  const covering = p <= .5;
  const phase = covering ? p * 2 : (p - .5) * 2;
  const eased = phase < .5 ? 4 * phase ** 3 : 1 - (-2 * phase + 2) ** 3 / 2;
  const movingEdge = height + pad - (height + pad * 2) * eased;
  const visibleTravel = Math.max(0, Math.min(1, 1 - movingEdge / Math.max(1, height)));
  return {
    topEdgeY: covering ? movingEdge : -pad,
    bottomEdgeY: covering ? height + pad : movingEdge,
    edgeStrength: (4 * visibleTravel * (1 - visibleTravel)) ** 2,
  };
}
