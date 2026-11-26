import { afterEach, expect, it, vi } from "vitest";
import { sendTicketEmail } from "@/lib/server/mail";
import { site } from "@/content/site";

const send = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
vi.mock("resend", () => ({ Resend: class { emails = { send }; } }));

afterEach(() => vi.unstubAllEnvs());

it.each([
  [undefined, "contact@mail.kihurn.me"],
  ["sender@example.com", "sender@example.com"],
])("uses the expected sender with RESEND_FROM_EMAIL set to %s", async (override, sender) => {
  vi.stubEnv("RESEND_API_KEY", "test-key");
  vi.stubEnv("RESEND_FROM_EMAIL", override);
  await sendTicketEmail({ type: "hello", name: "Ada", email: "ada@example.com", message: "Hello Ki Hurn" }, "KH-261126-TEST");
  expect(send).toHaveBeenLastCalledWith(expect.objectContaining({
    from: `Portfolio <${sender}>`,
    to: site.email,
    replyTo: "ada@example.com",
  }));
});
