import "server-only";
import { Resend } from "resend";
import { site } from "@/content/site";
import type { Ticket } from "@/lib/contact/validate";

export async function sendTicketEmail(t: Ticket, ticketNo: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: "Portfolio <onboarding@resend.dev>",
    to: site.email,
    replyTo: t.email,
    subject: `[${t.type.toUpperCase()}] ${ticketNo} from ${t.name}`,
    text: `${t.message}\n\n--\n${t.name} <${t.email}>\nTicket ${ticketNo} (${t.type})${t.referral ? `\nVia: ${t.referral}` : ""}`,
  });
  if (error) throw new Error(error.message);
}
