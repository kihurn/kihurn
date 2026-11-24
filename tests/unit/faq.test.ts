import { describe, expect, it } from "vitest";
import { faq } from "@/content/faq";
import { matchFaq } from "@/lib/faq";
import type { FaqEntry } from "@/content/types";

const id = (text: string) => matchFaq(text, faq)?.id ?? null;

describe("matchFaq on the real FAQ", () => {
  it("matches availability case-insensitively", () => {
    expect(id("Is he AVAILABLE for an internship?")).toBe("availability");
  });

  it("matches networking on a single word", () => {
    expect(id("networking")).toBe("networking-experience");
  });

  it("returns null for nonsense and empty input", () => {
    expect(id("asdf")).toBeNull();
    expect(id("")).toBeNull();
    expect(id("   ")).toBeNull();
  });

  it("each home chip question maps back to its own entry", () => {
    for (const entryId of ["what-has-he-built", "networking-experience", "availability"]) {
      const e = faq.find((x) => x.id === entryId)!;
      expect(matchFaq(e.question, faq)?.id, e.question).toBe(entryId);
    }
  });

  it("does not swallow a free-form question about C0RE (that goes to the model)", () => {
    expect(id("What is C0RE written in?")).toBeNull();
  });

  it("has the entries the plan names", () => {
    for (const must of ["about", "skills", "availability", "contact", "networking-experience", "what-has-he-built", "elysium", "securefin", "campus-network", "how-does-this-chat-work"]) {
      expect(faq.some((e) => e.id === must), must).toBe(true);
    }
  });

  it("never prints a phone number or an invented fact marker", () => {
    expect(JSON.stringify(faq)).not.toMatch(/\+?6?01\d[- ]?\d{3,4}[- ]?\d{4}/);
  });
});

describe("matchFaq rules", () => {
  const e = (idv: string, keywords: string[]): FaqEntry => ({ id: idv, question: idv, keywords, answer: idv });

  it("matches whole words only", () => {
    expect(matchFaq("internships galore", [e("a", ["intern"])])).toBeNull();
    expect(matchFaq("an intern", [e("a", ["intern"])])?.id).toBe("a");
  });

  it("picks the entry with the most keyword hits", () => {
    const list = [e("one", ["alpha"]), e("two", ["alpha", "beta"])];
    expect(matchFaq("alpha beta", list)?.id).toBe("two");
  });

  it("breaks ties in favour of the earlier entry", () => {
    const list = [e("first", ["alpha"]), e("second", ["alpha"])];
    expect(matchFaq("alpha", list)?.id).toBe("first");
  });

  it("is not thrown by regex characters in the input or keywords", () => {
    expect(() => matchFaq("(((", [e("a", ["a.b", "c++"])])).not.toThrow();
    expect(matchFaq("c++ rocks", [e("a", ["c++"])])?.id).toBe("a");
  });
});
