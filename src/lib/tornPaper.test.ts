import test from "node:test";
import assert from "node:assert/strict";
import { curtainPath, waveAmplitude } from "./tornPaper";

test("both layers flatten together and keep the parked edge outside the viewport", () => {
  for (const layer of ["paper", "base"] as const) {
    assert.equal(curtainPath("cover", layer, 0), "M0 100H100V120H0Z");
    assert.equal(curtainPath("cover", layer, 1), "M0 0H100V120H0Z");
    assert.equal(curtainPath("reveal", layer, 0), "M0 100H100V-20H0Z");
    assert.equal(curtainPath("reveal", layer, 1), "M0 0H100V-20H0Z");
    assert.match(curtainPath("cover", layer, .5), /V120H0Z$/);
    assert.match(curtainPath("reveal", layer, .5), /V-20H0Z$/);
  }
});

test("the paper leads on cover and the base leads on reveal", () => {
  const firstY = (path: string) => Number(path.split(/[ L]/)[1]);
  assert.ok(firstY(curtainPath("cover", "paper", .4)) < firstY(curtainPath("cover", "base", .4)));
  assert.ok(firstY(curtainPath("reveal", "base", .4)) < firstY(curtainPath("reveal", "paper", .4)));
});

test("the profile swells to a broad wave and flattens exactly at both ends", () => {
  assert.equal(waveAmplitude(0), 0);
  assert.equal(waveAmplitude(.5), 13);
  assert.equal(waveAmplitude(1), 0);
  const edge = [...curtainPath("cover", "base", .5).matchAll(/[ML]\d+ (-?\d+(?:\.\d+)?)/g)]
    .map((point) => Number(point[1]));
  assert.ok(Math.max(...edge) - Math.min(...edge) > 15);
});
