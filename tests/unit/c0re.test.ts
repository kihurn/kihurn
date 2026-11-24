import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { askC0re, C0reError } from "@/lib/server/c0re";

const ok = (content: string) => new Response(JSON.stringify({ message: { content } }), { status: 200 });
const asFetch = (f: unknown) => f as typeof fetch;
const hang = (_u: string, init: RequestInit) =>
  new Promise<Response>((_, rej) => init.signal!.addEventListener("abort", () => rej(new Error("aborted"))));

beforeEach(() => {
  process.env.C0RE_URL = "http://c0re.test";
  process.env.C0RE_API_KEY = "key-123";
  process.env.C0RE_MODEL = "m1";
});
afterEach(() => vi.restoreAllMocks());

describe("askC0re", () => {
  it("posts a non-streaming request capped at 300 tokens with a bearer key", async () => {
    const f = vi.fn(async () => ok("  hi  "));
    const out = await askC0re([{ role: "user", content: "yo" }], { fetchImpl: asFetch(f) });
    expect(out).toBe("hi");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://c0re.test/api/chat");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer key-123");
    expect(JSON.parse(init.body as string)).toMatchObject({ model: "m1", stream: false, options: { num_predict: 300 } });
  });
  it("times out when fetch never resolves", async () => {
    await expect(askC0re([], { timeoutMs: 50, fetchImpl: asFetch(hang) })).rejects.toMatchObject({ code: "timeout" });
  });
  it("maps a 503 to http and a rejected fetch to unreachable", async () => {
    const f503 = vi.fn(async () => new Response("no", { status: 503 }));
    await expect(askC0re([], { fetchImpl: asFetch(f503) })).rejects.toMatchObject({ code: "http" });
    const fbad = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(askC0re([], { fetchImpl: asFetch(fbad) })).rejects.toMatchObject({ code: "unreachable" });
  });
  it("rejects blank content as bad_reply", async () => {
    const f = vi.fn(async () => ok("  "));
    const err = await askC0re([], { fetchImpl: asFetch(f) }).catch((e) => e);
    expect(err).toBeInstanceOf(C0reError);
    expect(err.code).toBe("bad_reply");
  });
});
