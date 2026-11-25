import assert from "node:assert/strict";
import test from "node:test";
import { createThemeBurstParticles, stepThemeBurstParticles } from "./themeParticles";

test("createThemeBurstParticles spawns requested count anchored at origin", () => {
  const list = createThemeBurstParticles(320, 48, 24);
  assert.equal(list.length, 24);
  assert.equal(list[0].x, 320);
  assert.equal(list[0].y, 48);
  assert.ok(list.some((p) => p.accent));
});

test("stepThemeBurstParticles advances coordinates and retires expired particles", () => {
  let list = createThemeBurstParticles(100, 100, 12);
  list = stepThemeBurstParticles(list);
  assert.ok(list.every((p) => p.life === 1 && (p.x !== 100 || p.y !== 100)));
  for (let i = 0; i < 60; i++) {
    list = stepThemeBurstParticles(list);
  }
  assert.equal(list.length, 0);
});
