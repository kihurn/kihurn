import test from "node:test";
import assert from "node:assert/strict";
import { computeTornWipeOffsets, generateTornEdgePoints } from "./tornPaper";

test("generateTornEdgePoints creates continuous organic edge across viewport width", () => {
  const pts = generateTornEdgePoints(1440, 300, 2, 24, 32);
  assert.equal(pts.length, 33);
  assert.equal(pts[0].x, 0);
  assert.equal(pts[pts.length - 1].x, 1440);
  for (const pt of pts) {
    assert.ok(Math.abs(pt.y - 300) <= 24.001);
  }
});

test("computeTornWipeOffsets sweeps from bottom to top in two phases", () => {
  const start = computeTornWipeOffsets(0, 900, 40);
  assert.equal(start.topEdgeY, 940);
  assert.equal(start.bottomEdgeY, 940);

  const mid = computeTornWipeOffsets(0.5, 900, 40);
  assert.equal(mid.topEdgeY, -40);
  assert.equal(mid.bottomEdgeY, 940);

  const end = computeTornWipeOffsets(1, 900, 40);
  assert.equal(end.topEdgeY, -40);
  assert.equal(end.bottomEdgeY, -40);
});
