import test from "node:test";
import assert from "node:assert/strict";
import {
  formatLcpMetric,
  getMonogramPrefix,
  getThemeMetaColor,
  normalizeThemeMode,
  resolveThemeMode,
} from "./chrome";

test("getMonogramPrefix resolves route-aware monograms without KH prefix on sub-pages", () => {
  assert.equal(getMonogramPrefix("/"), "KH");
  assert.equal(getMonogramPrefix("/about"), "About");
  assert.equal(getMonogramPrefix("/lab"), "Lab");
  assert.equal(getMonogramPrefix("/lab/vocal-orb"), "Lab");
  assert.equal(getMonogramPrefix("/writing"), "Writing");
  assert.equal(getMonogramPrefix("/writing/reverse-engineering-c0re"), "Writing");
  assert.equal(getMonogramPrefix("/studio"), "Studio");
  assert.equal(getMonogramPrefix("/contact"), "Contact");
  assert.equal(getMonogramPrefix("/changelog"), "Changelog");
  assert.equal(getMonogramPrefix("/gigs"), "Gigs");
  assert.equal(getMonogramPrefix("/unknown"), "KH");
});

test("resolveThemeMode and getThemeMetaColor stay synced", () => {
  assert.equal(normalizeThemeMode("light"), "light");
  assert.equal(normalizeThemeMode("invalid"), "dark");
  assert.equal(resolveThemeMode("light", false), "light");
  assert.equal(resolveThemeMode("dark", true), "dark");
  assert.equal(resolveThemeMode("system", true), "light");
  assert.equal(resolveThemeMode("system", false), "dark");
  assert.equal(getThemeMetaColor("light"), "#d6d6d5");
  assert.equal(getThemeMetaColor("dark"), "#1e1e1e");
});

test("formatLcpMetric formats milliseconds and seconds consistently", () => {
  assert.equal(formatLcpMetric(42), "42ms");
  assert.equal(formatLcpMetric(910), "0.9s");
  assert.equal(formatLcpMetric(1542), "1.5s");
  assert.equal(formatLcpMetric(-1), "—");
  assert.equal(formatLcpMetric(Number.NaN), "—");
});
