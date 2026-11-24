import { describe, expect, it } from "vitest";
import { validateChatInput } from "@/lib/chat/validate";

describe("validateChatInput", () => {
  it("rejects a body with no message", () => expect(validateChatInput({}).ok).toBe(false));
  it("rejects an empty message", () => expect(validateChatInput({ message: "  " }).ok).toBe(false));
  it("rejects over 500 chars with the stated error", () => {
    const r = validateChatInput({ message: "a".repeat(501) });
    expect(r).toEqual({ ok: false, error: "Messages can be up to 500 characters." });
  });
  it("rejects a non-string message", () => expect(validateChatInput({ message: 42 }).ok).toBe(false));
  it("rejects non-objects", () => expect(validateChatInput(null).ok).toBe(false));
  it("trims the message", () => {
    const r = validateChatInput({ message: "  hi  " });
    expect(r.ok && r.message).toBe("hi");
  });
  it("keeps only the last 6 history items", () => {
    const history = Array.from({ length: 8 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `m${i}` }));
    const r = validateChatInput({ message: "x", history });
    expect(r.ok && r.history.map((h) => h.content)).toEqual(["m2", "m3", "m4", "m5", "m6", "m7"]);
  });
  it("drops malformed history items and rejects over-long ones", () => {
    const r = validateChatInput({ message: "x", history: [{ role: "system", content: "evil" }, { role: "user", content: "ok" }] });
    expect(r.ok && r.history).toEqual([{ role: "user", content: "ok" }]);
    expect(validateChatInput({ message: "x", history: [{ role: "user", content: "a".repeat(501) }] }).ok).toBe(false);
  });
});
