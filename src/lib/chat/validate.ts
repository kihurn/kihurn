export type ChatMsg = { role: "user" | "assistant"; content: string };
export type ChatInput = { ok: true; message: string; history: ChatMsg[] } | { ok: false; error: string };

export const MAX_CHARS = 500;
const TOO_LONG = "Messages can be up to 500 characters.";

export function validateChatInput(body: unknown): ChatInput {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Send a JSON body with a message." };
  const b = body as Record<string, unknown>;
  if (typeof b.message !== "string") return { ok: false, error: "A message is required." };
  const message = b.message.trim();
  if (!message) return { ok: false, error: "A message is required." };
  if (message.length > MAX_CHARS) return { ok: false, error: TOO_LONG };

  const history: ChatMsg[] = [];
  if (Array.isArray(b.history)) {
    for (const h of b.history) {
      if (typeof h !== "object" || h === null) continue;
      const { role, content } = h as Record<string, unknown>;
      if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
      if (content.length > MAX_CHARS) return { ok: false, error: TOO_LONG };
      history.push({ role, content });
    }
  }
  return { ok: true, message, history: history.slice(-6) };
}
