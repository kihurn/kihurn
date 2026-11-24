"use client";

import { useEffect, useRef, useState } from "react";
import { TICKET_TYPES, type TicketType } from "@/lib/contact/validate";
import { TicketStub } from "./TicketStub";

type Errors = Partial<Record<"type" | "name" | "email" | "message" | "form", string>>;

export function TicketForm({ email }: { email: string }) {
  const [type, setType] = useState<TicketType>("hello");
  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [ticketNo, setTicketNo] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const stub = useRef<HTMLDivElement>(null);
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    message: useRef<HTMLTextAreaElement>(null),
  };

  useEffect(() => {
    // set after mount so the server and first client render agree
    setDate(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }).toUpperCase());
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    const website = (new FormData(e.currentTarget).get("website") as string) ?? "";
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name, email: mail, message, website }),
      });
      const j = (await res.json().catch(() => ({}))) as { ticketNo?: string; field?: string; error?: string };
      if (res.ok && j.ticketNo) {
        setTicketNo(j.ticketNo);
      } else if (j.field && j.field in refs) {
        setErrors({ [j.field]: j.error } as Errors);
        refs[j.field as keyof typeof refs].current?.focus();
      } else {
        setErrors({ form: j.error ?? `Couldn't send right now. Email me directly at ${email}.` });
      }
    } catch {
      setErrors({ form: `Couldn't send right now. Email me directly at ${email}.` });
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!stub.current || !ticketNo) return;
    const { toPng } = await import("html-to-image");
    const url = await toPng(stub.current, { pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ticketNo}.png`;
    a.click();
  }

  const sent = ticketNo !== null;

  return (
    <div className="ticket">
      <form className="ticket__form" onSubmit={submit} noValidate aria-describedby={errors.form ? "ticket-form-err" : undefined}>
        <fieldset className="ticket__types" disabled={sent}>
          <legend className="text-label">What is this about?</legend>
          {TICKET_TYPES.map((t) => (
            <label key={t.id} className="ticket__radio text-body">
              <input type="radio" name="type" value={t.id} checked={type === t.id} onChange={() => setType(t.id)} />
              <span>{t.label}</span>
            </label>
          ))}
        </fieldset>

        <label className="ticket__field">
          <span className="text-label">Your name</span>
          <input ref={refs.name} name="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" disabled={sent} aria-invalid={!!errors.name} aria-describedby={errors.name ? "err-name" : undefined} />
          {errors.name ? <span id="err-name" className="ticket__err" role="alert">{errors.name}</span> : null}
        </label>

        <label className="ticket__field">
          <span className="text-label">Your email</span>
          <input ref={refs.email} name="email" type="email" value={mail} onChange={(e) => setMail(e.target.value)} autoComplete="email" disabled={sent} aria-invalid={!!errors.email} aria-describedby={errors.email ? "err-email" : undefined} />
          {errors.email ? <span id="err-email" className="ticket__err" role="alert">{errors.email}</span> : null}
        </label>

        <label className="ticket__field">
          <span className="text-label">Message</span>
          <textarea ref={refs.message} name="message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} disabled={sent} aria-invalid={!!errors.message} aria-describedby={errors.message ? "err-message" : undefined} />
          {errors.message ? <span id="err-message" className="ticket__err" role="alert">{errors.message}</span> : null}
        </label>

        {/* honeypot: hidden from people and screen readers, bots fill it */}
        <input className="ticket__hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" defaultValue="" />

        {errors.form ? <p id="ticket-form-err" className="ticket__err" role="alert">{errors.form}</p> : null}

        {sent ? (
          <p className="text-body" role="status">
            Ticket {ticketNo} is in the queue. I&apos;ll reply to {mail}.
          </p>
        ) : (
          <button className="btn btn--solid text-tag ticket__submit" type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send ticket"}
          </button>
        )}
      </form>

      <div className="ticket__side">
        <TicketStub ref={stub} ticketNo={ticketNo} date={date} type={type} name={name} status={sent ? "queued" : "writing"} />
        {sent ? (
          <button type="button" className="btn text-tag" data-download onClick={download}>
            Download your stub
          </button>
        ) : null}
      </div>
    </div>
  );
}
