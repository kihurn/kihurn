import { beforeEach, describe, expect, it, vi } from "vitest";
import { isC0reOnline, resetHealthCache } from "@/lib/server/health";

const asFetch = (f: unknown) => f as typeof fetch;

beforeEach(() => {
  process.env.C0RE_URL = "http://c0re.test";
  resetHealthCache();
});

describe("isC0reOnline", () => {
  it("is false on a timeout", async () => {
    const f = vi.fn(
      (_u: string, init: RequestInit) =>
        new Promise<Response>((_, rej) => init.signal!.addEventListener("abort", () => rej(new Error("x")))),
    );
    expect(await isC0reOnline({ fetchImpl: asFetch(f), timeoutMs: 30 })).toBe(false);
  });
  it("caches for 30 seconds", async () => {
    const f = vi.fn(async () => new Response("{}", { status: 200 }));
    let t = 1000;
    const o = { fetchImpl: asFetch(f), now: () => t };
    expect(await isC0reOnline(o)).toBe(true);
    t += 29_000;
    await isC0reOnline(o);
    expect(f).toHaveBeenCalledTimes(1);
    t += 2_000;
    await isC0reOnline(o);
    expect(f).toHaveBeenCalledTimes(2);
  });
});
