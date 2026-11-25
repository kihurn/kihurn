import assert from "node:assert/strict";
import test from "node:test";
import { computeMiniHalftoneDots, normalizeLabMode } from "./labSchematics";

test("normalizeLabMode maps legacy flat and unknown values cleanly", () => {
  assert.equal(normalizeLabMode("flat"), "list");
  assert.equal(normalizeLabMode("list"), "list");
  assert.equal(normalizeLabMode("grid"), "grid");
  assert.equal(normalizeLabMode("wheel"), "wheel");
  assert.equal(normalizeLabMode("unexpected"), "wheel");
  assert.equal(normalizeLabMode(null), "wheel");
});

test("computeMiniHalftoneDots repels dots near pointer and marks hot zone", () => {
  const dots = computeMiniHalftoneDots(200, 160, 100, 80, 20, 60);
  assert.ok(dots.length > 0);
  assert.ok(dots.some((d) => d.hot), "Expected at least one hot dot near pointer");
  assert.ok(dots.every((d) => Number.isFinite(d.x) && Number.isFinite(d.y) && d.r > 0));
});
