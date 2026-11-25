import type { Article } from "@/content/writing";

export function buildBookCoverSpec(article: Article, index: number) {
  const firstSection = article.sections[0];
  const issueNo = String(index + 1).padStart(2, "0");
  const excerpt = firstSection?.paragraphs[0] ?? article.summary;
  const motifSeed = article.tags[0] ?? "web";

  return {
    issueNo,
    editionLabel: `EDITION::N°${issueNo}`,
    chapterHeading: firstSection?.heading ?? "Notes",
    excerpt: excerpt.length > 135 ? `${excerpt.slice(0, 132).trimEnd()}…` : excerpt,
    motifSeed,
  };
}
