import assert from "node:assert/strict";
import test from "node:test";
import { articles } from "../content/writing";
import { buildBookCoverSpec } from "./writingCovers";

test("buildBookCoverSpec derives padded issue label and bounded interior excerpt", () => {
  const spec = buildBookCoverSpec(articles[0], 0);
  assert.equal(spec.issueNo, "01");
  assert.equal(spec.editionLabel, "EDITION::N°01");
  assert.ok(spec.chapterHeading.length > 0);
  assert.ok(spec.excerpt.length <= 136);
});
