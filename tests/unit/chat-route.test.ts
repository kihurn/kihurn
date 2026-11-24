import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/c0re", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/c0re")>("@/lib/server/c0re");
  return { ...actual, askC0re: vi.fn() };
});

import { askC0re, C0reError } from "@/lib/server/c0re";
import { resetLimits } from "@/lib/server/ratelimit";
import { faq } from "@/content/faq";
import { POST } from "@/app/api/chat/route";

const ask = vi.mocked(askC0re);
const req = (body: unknown, ip = "1.2.3.4") =>
  new Request("http://x/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `${ip}, 10.0.0.1` },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  resetLimits();
  ask.mockReset();
});

describe("POST /api/chat", () => {
  it("400 on invalid JSON", async () => {
    expect((await POST(req("{nope"))).status).toBe(400);
  });
  it("400 on an over-long message", async () => {
    expect((await POST(req({ message: "a".repeat(501) }))).status).toBe(400);
  });
  it("answers an exact chip question from the FAQ without calling C0RE", async () => {
    const chip = faq[0];
    const res = await POST(req({ message: chip.question }));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.source).toBe("faq");
    expect(j.reply).toBe(chip.answer);
    expect(ask).not.toHaveBeenCalled();
  });
  it("returns the model reply for free-form questions", async () => {
    ask.mockResolvedValue("hello there");
    const j = await (await POST(req({ message: "zzz qqq unmatched" }))).json();
    expect(j).toMatchObject({ reply: "hello there", source: "c0re" });
    expect(typeof j.ms).toBe("number");
  });
  it("503 with offline:true when C0RE times out", async () => {
    ask.mockRejectedValue(new C0reError("timeout"));
    const res = await POST(req({ message: "zzz qqq unmatched" }));
    const j = await res.json();
    expect(res.status).toBe(503);
    expect(j.offline).toBe(true);
    expect(j.reply).toContain("asleep");
  });
  it("429 on the 11th rapid request", async () => {
    ask.mockResolvedValue("ok");
    let last = 200;
    for (let i = 0; i < 11; i++) last = (await POST(req({ message: `zzz qqq ${i}` }))).status;
    expect(last).toBe(429);
  });
  it("never logs the message text", async () => {
    ask.mockResolvedValue("ok");
    const spies = [vi.spyOn(console, "log"), vi.spyOn(console, "info"), vi.spyOn(console, "warn"), vi.spyOn(console, "error")];
    await POST(req({ message: "SECRET-TEXT-123 zzz" }));
    for (const s of spies) expect(JSON.stringify(s.mock.calls)).not.toContain("SECRET-TEXT-123");
    spies.forEach((s) => s.mockRestore());
  });
});
