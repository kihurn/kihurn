import { NextResponse } from "next/server";
import { validateTicket } from "@/lib/contact/validate";
import { makeTicketNumber } from "@/lib/contact/ticket";
import { sendTicketEmail } from "@/lib/server/mail";
import { checkLimit } from "@/lib/server/ratelimit";
import { site } from "@/content/site";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ field: "message", error: "Send a JSON body." }, { status: 400 });
  }
  const r = validateTicket(body);
  if (!r.ok) {
    // a filled honeypot looks like success, so bots learn nothing
    if (r.field === "website") return NextResponse.json({ ticketNo: makeTicketNumber(new Date()) });
    return NextResponse.json({ field: r.field, error: r.error }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await checkLimit(ip, "contact");
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "That's a few tickets already. Try again in a little while." },
      { status: 429, headers: limit.retryAfterS ? { "Retry-After": String(limit.retryAfterS) } : undefined },
    );
  }

  const ticketNo = makeTicketNumber(new Date());
  try {
    await sendTicketEmail(r.ticket, ticketNo);
  } catch {
    return NextResponse.json(
      { error: `Couldn't send right now. Email me directly at ${site.email}.` },
      { status: 502 },
    );
  }
  return NextResponse.json({ ticketNo });
}
