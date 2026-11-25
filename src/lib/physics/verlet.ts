export interface VerletNode {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  pinned?: boolean;
}

export interface VerletChain {
  nodes: VerletNode[];
  segmentLength: number;
}

export interface VerletStepOptions {
  gravity?: number;
  damping?: number;
  wind?: number;
  iterations?: number;
  bounds?: { minX: number; maxX: number; minY: number; maxY: number };
}

export function createVerletChain(
  anchorX: number,
  anchorY: number,
  count: number,
  segmentLength: number,
  initialSwingX = 28,
): VerletChain {
  const nodes: VerletNode[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    const x = anchorX + Math.sin(t * Math.PI * 0.5) * initialSwingX;
    const y = anchorY + i * segmentLength;
    nodes.push({ x, y, oldX: x - (i === count - 1 ? 1.8 : 0), oldY: y, pinned: i === 0 });
  }
  return { nodes, segmentLength };
}

export function setChainAnchor(chain: VerletChain, anchorX: number, anchorY: number): void {
  const head = chain.nodes[0];
  if (!head) return;
  head.x = anchorX;
  head.y = anchorY;
  head.oldX = anchorX;
  head.oldY = anchorY;
  head.pinned = true;
}

export function stepVerletChain(chain: VerletChain, opts: VerletStepOptions = {}): void {
  const gravity = opts.gravity ?? 0.65;
  const damping = opts.damping ?? 0.985;
  const wind = opts.wind ?? 0;
  const iterations = opts.iterations ?? 8;
  const { nodes, segmentLength } = chain;

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.pinned) continue;
    const vx = (n.x - n.oldX) * damping;
    const vy = (n.y - n.oldY) * damping;
    n.oldX = n.x;
    n.oldY = n.y;
    n.x += vx + wind * (i / nodes.length);
    n.y += vy + gravity;
  }

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const diff = (segmentLength - dist) / dist;

      if (a.pinned && b.pinned) continue;
      if (a.pinned) {
        b.x += dx * diff;
        b.y += dy * diff;
      } else if (b.pinned) {
        a.x -= dx * diff;
        a.y -= dy * diff;
      } else {
        const offsetX = dx * diff * 0.5;
        const offsetY = dy * diff * 0.5;
        a.x -= offsetX;
        a.y -= offsetY;
        b.x += offsetX;
        b.y += offsetY;
      }
    }

    if (opts.bounds) {
      const { minX, maxX, minY, maxY } = opts.bounds;
      for (const n of nodes) {
        if (n.pinned) continue;
        if (n.x < minX) n.x = minX;
        else if (n.x > maxX) n.x = maxX;
        if (n.y < minY) n.y = minY;
        else if (n.y > maxY) n.y = maxY;
      }
    }
  }
}

export function pinTailToPoint(chain: VerletChain, targetX: number, targetY: number): void {
  const tail = chain.nodes[chain.nodes.length - 1];
  if (!tail) return;
  tail.oldX = tail.x;
  tail.oldY = tail.y;
  tail.x = targetX;
  tail.y = targetY;
  tail.pinned = true;
}

export function releaseTailWithImpulse(chain: VerletChain, vx: number, vy: number): void {
  const tail = chain.nodes[chain.nodes.length - 1];
  if (!tail) return;
  tail.pinned = false;
  tail.oldX = tail.x - Math.max(-28, Math.min(28, vx));
  tail.oldY = tail.y - Math.max(-28, Math.min(28, vy));
}

export function computeBadgePose(chain: VerletChain): { x: number; y: number; angleDeg: number } {
  const len = chain.nodes.length;
  if (len === 0) return { x: 0, y: 0, angleDeg: 0 };
  const tail = chain.nodes[len - 1];
  const prev = chain.nodes[Math.max(0, len - 2)];
  const dx = tail.x - prev.x;
  const dy = tail.y - prev.y;
  // Angle relative to straight down (0, 1)
  const rad = Math.atan2(dx, Math.max(1, dy));
  const angleDeg = Math.max(-42, Math.min(42, -(rad * 180) / Math.PI));
  return { x: tail.x, y: tail.y, angleDeg };
}
