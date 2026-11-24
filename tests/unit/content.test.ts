import { describe, expect, it } from "vitest";
import { site } from "@/content/site";

describe("site constants", () => {
  it("uses the KIHURN. wordmark", () => {
    expect(site.wordmark).toBe("KIHURN.");
  });

  it("never contains a phone number", () => {
    expect(JSON.stringify(site)).not.toMatch(/\+?6?01\d[- ]?\d{3,4}[- ]?\d{4}/);
  });
});
