import { beforeEach, describe, expect, it } from "vitest";
import { checkLimit, resetLimits, setClock } from "@/lib/server/ratelimit";

let t = 0;
beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  t = 1_000_000;
  setClock(() => t);
  resetLimits();
});

describe("in-memory limiter", () => {
  it("blocks the 11th chat call within a minute, with a retry hint", async () => {
    for (let i = 0; i < 10; i++) expect((await checkLimit("ip1", "chat")).allowed).toBe(true);
    const r = await checkLimit("ip1", "chat");
    expect(r.allowed).toBe(false);
    expect(r.retryAfterS).toBeGreaterThan(0);
  });
  it("is per key", async () => {
    for (let i = 0; i < 10; i++) await checkLimit("a", "chat");
    expect((await checkLimit("b", "chat")).allowed).toBe(true);
  });
  it("frees up after the minute passes", async () => {
    for (let i = 0; i < 10; i++) await checkLimit("ip1", "chat");
    t += 61_000;
    expect((await checkLimit("ip1", "chat")).allowed).toBe(true);
  });
  it("blocks the 51st chat call in a day", async () => {
    let allowed = 0;
    for (let i = 0; i < 51; i++) {
      t += 61_000; // stay under the per-minute limit
      if ((await checkLimit("ip1", "chat")).allowed) allowed++;
    }
    expect(allowed).toBe(50);
  });
  it("contact allows 3 per 10 minutes", async () => {
    for (let i = 0; i < 3; i++) expect((await checkLimit("ip1", "contact")).allowed).toBe(true);
    expect((await checkLimit("ip1", "contact")).allowed).toBe(false);
  });
});
