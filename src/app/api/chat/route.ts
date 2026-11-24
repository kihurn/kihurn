import { NextResponse } from "next/server";
import { faq } from "@/content/faq";
import { buildSystemPrompt } from "@/lib/chat/prompt";
import { validateChatInput } from "@/lib/chat/validate";
import { askC0re, C0reError } from "@/lib/server/c0re";
import { checkLimit } from "@/lib/server/ratelimit";

export const dynamic = "force-dynamic";

const OFFLINE =
  "Ki Hurn's PC is asleep, so the chat is offline. The suggested questions still work!";

/** metadata only: never the message */
function log(status: number, ms: number, source: string) {
  console.info(JSON.stringify({ route: "chat", status, ms, source }));
}

export async function POST(request: Request) {
  const t0 = Date.now();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    log(400, Date.now() - t0, "none");
    return NextResponse.json({ error: "Send a JSON body with a message." }, { status: 400 });
  }
  const input = validateChatInput(body);
  if (!input.ok) {
    log(400, Date.now() - t0, "none");
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await checkLimit(ip, "chat");
  if (!limit.allowed) {
    log(429, Date.now() - t0, "none");
    return NextResponse.json(
      { error: "Slow down a little. Try again in a minute." },
      { status: 429, headers: limit.retryAfterS ? { "Retry-After": String(limit.retryAfterS) } : undefined },
    );
  }

  // only an exact chip question is answered from the script; everything else goes to the model
  const exact = faq.find((e) => e.question.toLowerCase() === input.message.toLowerCase());
  if (exact) {
    log(200, Date.now() - t0, "faq");
    return NextResponse.json({ reply: exact.answer, source: "faq", ms: Date.now() - t0 });
  }

  try {
    const reply = await askC0re([
      { role: "system", content: buildSystemPrompt() },
      ...input.history,
      { role: "user", content: input.message },
    ]);
    const ms = Date.now() - t0;
    log(200, ms, "c0re");
    return NextResponse.json({ reply, source: "c0re", ms });
  } catch (e) {
    const ms = Date.now() - t0;
    if (e instanceof C0reError) {
      log(503, ms, "c0re");
      return NextResponse.json({ offline: true, reply: OFFLINE }, { status: 503 });
    }
    log(500, ms, "c0re");
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
