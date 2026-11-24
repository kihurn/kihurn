import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/mail", () => ({ sendTicketEmail: vi.fn() }));

import { validateTicket } from "@/lib/contact/validate";
import { makeTicketNumber } from "@/lib/contact/ticket";
import { sendTicketEmail } from "@/lib/server/mail";
import { resetLimits } from "@/lib/server/ratelimit";
import { POST } from "@/app/api/contact/route";

const good = { type: "hello", name: "Ada", email: "ada@example.com", message: "Hello Ki Hurn, nice site." };
const send = vi.mocked(sendTicketEmail);
const req = (body: unknown, ip = "9.9.9.9") =>
  new Request("http://x/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  resetLimits();
  send.mockReset();
});

describe("validateTicket", () => {
  it("accepts a good ticket", () => {
    const r = validateTicket(good);
    expect(r.ok && r.ticket.email).toBe("ada@example.com");
  });
  it("names each invalid field", () => {
    expect(validateTicket({ ...good, type: "spam" })).toMatchObject({ ok: false, field: "type" });
    expect(validateTicket({ ...good, name: "" })).toMatchObject({ ok: false, field: "name" });
    expect(validateTicket({ ...good, name: "x".repeat(81) })).toMatchObject({ ok: false, field: "name" });
    expect(validateTicket({ ...good, email: "nope" })).toMatchObject({ ok: false, field: "email" });
    expect(validateTicket({ ...good, message: "short" })).toMatchObject({ ok: false, field: "message" });
    expect(validateTicket({ ...good, message: "x".repeat(2001) })).toMatchObject({ ok: false, field: "message" });
  });
  it("flags a filled honeypot", () => {
    expect(validateTicket({ ...good, website: "http://bot" })).toMatchObject({ ok: false, field: "website" });
  });
});

describe("makeTicketNumber", () => {
  it("formats KH-YYMMDD-XXXX in Kuala Lumpur time", () => {
    expect(makeTicketNumber(new Date("2026-11-24T00:00:00+08:00"), () => 0)).toBe("KH-261124-AAAA");
  });
  it("uses A-Z and 0-9", () => {
    expect(makeTicketNumber(new Date("2026-11-24T00:00:00+08:00"), () => 0.999)).toBe("KH-261124-9999");
  });
});

describe("POST /api/contact", () => {
  it("sends a valid ticket once and returns its number", async () => {
    const res = await POST(req(good));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.ticketNo).toMatch(/^KH-\d{6}-[A-Z0-9]{4}$/);
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("answers 200 without sending when the honeypot is filled", async () => {
    const res = await POST(req({ ...good, website: "x" }));
    expect(res.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });
  it("400 names the field", async () => {
    const res = await POST(req({ ...good, email: "bad" }));
    expect(res.status).toBe(400);
    expect((await res.json()).field).toBe("email");
  });
  it("502 with the direct email when sending throws", async () => {
    send.mockRejectedValue(new Error("resend down"));
    const res = await POST(req(good));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("wongkihurn2005@gmail.com");
  });
  it("429 after 3 tickets", async () => {
    let last = 0;
    for (let i = 0; i < 4; i++) last = (await POST(req(good))).status;
    expect(last).toBe(429);
  });
});
