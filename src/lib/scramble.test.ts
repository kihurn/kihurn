import test from "node:test";
import assert from "node:assert/strict";
import { computeScrambledFrame, DEFAULT_SCRAMBLE_GLYPHS } from "./scramble";

test("computeScrambledFrame resolves cleanly at boundaries and preserves spaces", () => {
  assert.equal(computeScrambledFrame("", 0.5, 3), "");
  assert.equal(computeScrambledFrame("SecureFin", 1, 10), "SecureFin");

  const mid = computeScrambledFrame("Campus Network", 0.5, 4);
  assert.equal(mid.length, "Campus Network".length);
  assert.equal(mid[6], " ");
  assert.equal(mid.slice(0, 7), "Campus ");
});

test("computeScrambledFrame cycles through glyph pool before settling", () => {
  const f1 = computeScrambledFrame("C0RE", 0, 1);
  const f2 = computeScrambledFrame("C0RE", 0, 2);
  assert.equal(f1.length, 4);
  assert.notEqual(f1, f2);
  for (const ch of f1) {
    assert.ok(DEFAULT_SCRAMBLE_GLYPHS.includes(ch));
  }
});
