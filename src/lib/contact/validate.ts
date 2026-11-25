export type TicketType = "internship" | "freelance" | "collaboration" | "hello";
export const TICKET_TYPES: { id: TicketType; label: string }[] = [
  { id: "internship", label: "Internship" },
  { id: "freelance", label: "Freelance" },
  { id: "collaboration", label: "Collaboration" },
  { id: "hello", label: "Just a hello" },
];

export interface Ticket {
  type: TicketType;
  name: string;
  email: string;
  message: string;
  referral?: string;
  signature?: string;
}
export type TicketResult = { ok: true; ticket: Ticket } | { ok: false; field: string; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateTicket(body: unknown): TicketResult {
  const b = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  if (typeof b.website === "string" && b.website.length > 0) {
    return { ok: false, field: "website", error: "Rejected." };
  }
  const type = TICKET_TYPES.find((t) => t.id === b.type)?.id;
  if (!type) return { ok: false, field: "type", error: "Pick what this is about." };
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (name.length < 1 || name.length > 80) return { ok: false, field: "name", error: "Add your name (up to 80 characters)." };
  const email = typeof b.email === "string" ? b.email.trim() : "";
  if (!EMAIL.test(email)) return { ok: false, field: "email", error: "That email doesn't look right." };
  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (message.length < 10 || message.length > 2000)
    return { ok: false, field: "message", error: "Write between 10 and 2000 characters." };
  const referral = typeof b.referral === "string" ? b.referral.trim() : "";
  if (referral.length > 160) return { ok: false, field: "referral", error: "Use up to 160 characters for the referral." };
  let signature: string | undefined;
  if (typeof b.signature === "string" && b.signature.length > 0) {
    if (!b.signature.startsWith("data:image/png;base64,") || b.signature.length > 250_000) {
      return { ok: false, field: "signature", error: "Signature image is invalid or too large." };
    }
    signature = b.signature;
  }
  return { ok: true, ticket: { type, name, email, message, ...(referral ? { referral } : {}), ...(signature ? { signature } : {}) } };
}
