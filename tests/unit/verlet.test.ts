import { describe, expect, it } from "vitest";
import {
  computeBadgePose,
  createVerletChain,
  pinTailToPoint,
  releaseTailWithImpulse,
  setChainAnchor,
  stepVerletChain,
} from "@/lib/physics/verlet";

describe("verlet chain physics", () => {
  it("keeps the root node pinned to the anchor during steps", () => {
    const chain = createVerletChain(200, 16, 8, 22, 30);
    for (let i = 0; i < 20; i++) {
      stepVerletChain(chain, { gravity: 0.7, damping: 0.98, iterations: 10 });
    }
    expect(chain.nodes[0].x).toBe(200);
    expect(chain.nodes[0].y).toBe(16);
  });

  it("maintains finite coordinates and bounded segment lengths under gravity", () => {
    const chain = createVerletChain(300, 16, 10, 24, 40);
    for (let i = 0; i < 60; i++) {
      stepVerletChain(chain, {
        gravity: 0.65,
        damping: 0.985,
        wind: 0.05,
        bounds: { minX: 40, maxX: 560, minY: 16, maxY: 450 },
      });
    }
    const tail = chain.nodes[chain.nodes.length - 1];
    expect(Number.isFinite(tail.x)).toBe(true);
    expect(Number.isFinite(tail.y)).toBe(true);
    expect(tail.y).toBeGreaterThan(16);
    expect(tail.y).toBeLessThanOrEqual(450);

    const pose = computeBadgePose(chain);
    expect(pose.angleDeg).toBeGreaterThanOrEqual(-42);
    expect(pose.angleDeg).toBeLessThanOrEqual(42);
  });

  it("supports pinning and releasing the tail with clamped impulse", () => {
    const chain = createVerletChain(200, 16, 6, 20, 0);
    setChainAnchor(chain, 220, 20);
    pinTailToPoint(chain, 310, 180);
    const tail = chain.nodes[chain.nodes.length - 1];
    expect(tail.x).toBe(310);
    expect(tail.y).toBe(180);
    expect(tail.pinned).toBe(true);

    releaseTailWithImpulse(chain, 100, -100);
    expect(tail.pinned).toBe(false);
    // Impulse is clamped to [-28, 28]
    expect(tail.x - tail.oldX).toBe(28);
    expect(tail.y - tail.oldY).toBe(-28);
  });
});
