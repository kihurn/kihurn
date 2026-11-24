import "server-only";

export type C0reCode = "unreachable" | "timeout" | "http" | "bad_reply";
export class C0reError extends Error {
  constructor(
    public code: C0reCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "C0reError";
  }
}

export type C0reMessage = { role: "system" | "user" | "assistant"; content: string };

export async function askC0re(
  messages: C0reMessage[],
  opts: { timeoutMs?: number; fetchImpl?: typeof fetch } = {},
): Promise<string> {
  const { timeoutMs = 10_000, fetchImpl = fetch } = opts;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    let res: Response;
    try {
      res = await fetchImpl(`${process.env.C0RE_URL ?? ""}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.C0RE_API_KEY ?? ""}` },
        body: JSON.stringify({
          model: process.env.C0RE_MODEL,
          messages,
          stream: false,
          options: { num_predict: 300, temperature: 0.6 },
        }),
        signal: ctl.signal,
        cache: "no-store",
      });
    } catch {
      throw new C0reError(ctl.signal.aborted ? "timeout" : "unreachable");
    }
    if (!res.ok) throw new C0reError("http", `status ${res.status}`);
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      throw new C0reError("bad_reply");
    }
    const content = (data as { message?: { content?: unknown } })?.message?.content;
    const text = typeof content === "string" ? content.trim() : "";
    if (!text) throw new C0reError("bad_reply");
    return text;
  } finally {
    clearTimeout(timer);
  }
}
