import type { FaqEntry } from "@/content/types";

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Case-insensitive, whole-word keyword match. Returns the entry with the most
 * keyword hits; a tie goes to the earlier entry; no hit returns null.
 */
export function matchFaq(text: string, entries: FaqEntry[]): FaqEntry | null {
  const input = text.trim();
  if (!input) return null;
  let best: FaqEntry | null = null;
  let bestHits = 0;
  for (const entry of entries) {
    let hits = 0;
    for (const kw of entry.keywords) {
      const re = new RegExp(`(?<!\\w)${escapeRegExp(kw)}(?!\\w)`, "i");
      if (re.test(input)) hits++;
    }
    if (hits > bestHits) {
      best = entry;
      bestHits = hits;
    }
  }
  return best;
}
