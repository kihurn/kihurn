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

test("both wipe passes accelerate, slow down and flatten at the viewport edges", () => {
  const height = 900;
  for (const phase of [0, .5]) {
    const first = computeTornWipeOffsets(phase + .125, height, 12);
    const middle = computeTornWipeOffsets(phase + .25, height, 12);
    const last = computeTornWipeOffsets(phase + .375, height, 12);
    const boundary = phase === 0 ? "topEdgeY" : "bottomEdgeY";
    assert.ok(first[boundary] > height * .8);
    assert.equal(middle[boundary], height / 2);
    assert.ok(last[boundary] < height * .2);
    assert.equal(computeTornWipeOffsets(phase, height, 12).edgeStrength, 0);
    assert.equal(middle.edgeStrength, 1);
    assert.ok(first.edgeStrength < .12 && last.edgeStrength < .12);
    assert.equal(computeTornWipeOffsets(phase + .5, height, 12).edgeStrength, 0);
  }
});
