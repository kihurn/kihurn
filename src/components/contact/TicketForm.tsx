"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { TICKET_TYPES, type TicketType } from "@/lib/contact/validate";
import { SignaturePad } from "./SignaturePad";
import { TicketStub } from "./TicketStub";

type Errors = Partial<Record<"type" | "name" | "email" | "message" | "referral" | "form", string>>;

const emptySubscribe = () => () => {};
function getKlDate() {
  return new Date()
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kuala_Lumpur",
    })
    .toUpperCase();
}

export function TicketForm({ email }: { email: string }) {
  const [type, setType] = useState<TicketType>("hello");
  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [message, setMessage] = useState("");
  const [referral, setReferral] = useState("");
  const [signature, setSignature] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [ticketNo, setTicketNo] = useState<string | null>(null);

  const date = useSyncExternalStore(emptySubscribe, getKlDate, () => "");

  const stub = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const referralRef = useRef<HTMLInputElement>(null);

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
        body: JSON.stringify({ type, name, email: mail, message, referral, signature: signature || undefined, website }),
      });
      const j = (await res.json().catch(() => ({}))) as { ticketNo?: string; field?: string; error?: string };
      if (res.ok && j.ticketNo) {
        setTicketNo(j.ticketNo);
      } else if (j.field === "name" || j.field === "email" || j.field === "message" || j.field === "referral") {
        setErrors({ [j.field]: j.error } as Errors);
        const focusTarget = { name: nameRef, email: emailRef, message: messageRef, referral: referralRef }[j.field].current;
        focusTarget?.focus();
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
      <form
        className="ticket__form letter-sheet"
        onSubmit={submit}
        noValidate
        aria-describedby={errors.form ? "ticket-form-err" : undefined}
      >
        <div className="letter-sheet__meta text-mono-meta">
          <span>DATE::{date || "MYT"}</span>
          <span>DESK::KIHURN</span>
        </div>

        <fieldset className="ticket__types" disabled={sent}>
          <legend className="text-label">RE :: What is this about?</legend>
          <div className="ticket__pills">
            {TICKET_TYPES.map((t) => (
              <label key={t.id} className="ticket__radio text-body">
                <input type="radio" name="type" value={t.id} checked={type === t.id} onChange={() => setType(t.id)} />
                <span><span className="ticket__check" aria-hidden="true">{type === t.id ? "[x]" : "[ ]"}</span> {t.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="letter-sheet__row">
          <label className="ticket__field">
            <span className="text-label">FROM :: Your name</span>
            <input
              ref={nameRef}
              name="name"
              placeholder="FROM :: Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoComplete="name"
              disabled={sent}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "err-name" : undefined}
            />
            {errors.name ? (
              <span id="err-name" className="ticket__err" role="alert">
                {errors.name}
              </span>
            ) : null}
          </label>

          <label className="ticket__field">
            <span className="text-label">Your email</span>
            <input
              ref={emailRef}
              name="email"
              type="email"
              placeholder="you@domain.com"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              autoComplete="email"
              disabled={sent}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "err-email" : undefined}
            />
            {errors.email ? (
              <span id="err-email" className="ticket__err" role="alert">
                {errors.email}
              </span>
            ) : null}
          </label>
        </div>

        <label className="ticket__field">
          <span className="text-label">VIA :: Referral (optional)</span>
          <input ref={referralRef} name="referral" value={referral} maxLength={160} disabled={sent}
            onChange={(event) => setReferral(event.target.value)} aria-invalid={Boolean(errors.referral)}
            aria-describedby={errors.referral ? "err-referral" : undefined}
          />
          {errors.referral ? <span id="err-referral" className="ticket__err" role="alert">{errors.referral}</span> : null}
        </label>

        <label className="ticket__field">
          <span className="text-label">What are we making?</span>
          <textarea
            ref={messageRef}
            name="message"
            aria-label="Message"
            rows={6}
            placeholder="Write a note, timeline, or link…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            disabled={sent}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "err-message" : undefined}
          />
          {errors.message ? (
            <span id="err-message" className="ticket__err" role="alert">
              {errors.message}
            </span>
          ) : null}
        </label>

        <div className="letter-sheet__signoff">
          <p>Sincerely,</p>
          <SignaturePad value={signature} onChange={setSignature} disabled={sent} />
          <p>{name.trim() || "Your name"}</p>
        </div>

        <input className="ticket__hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" defaultValue="" />

        {errors.form ? (
          <p id="ticket-form-err" className="ticket__err" role="alert">
            {errors.form}
          </p>
        ) : null}

        {sent ? (
          <p className="text-body" role="status">
            Ticket {ticketNo} is in the queue. I&apos;ll reply to {mail}.
          </p>
        ) : (
          <button className="btn text-tag ticket__submit" type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send it"}
          </button>
        )}
      </form>

      <div className="ticket__side">
        <div className="stub-pinned">
          <svg
            className="stub-paperclip"
            viewBox="0 0 36 86"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M11 65V22a9 9 0 0 1 18 0v44a12 12 0 0 1-24 0V28a6 6 0 0 1 12 0v32"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M11 65V22a9 9 0 0 1 18 0v44a12 12 0 0 1-24 0V28a6 6 0 0 1 12 0v32"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="0.9"
              strokeLinecap="round"
              transform="translate(-0.7 -0.5)"
            />
          </svg>
          <TicketStub
            ref={stub}
            ticketNo={ticketNo}
            date={date}
            type={type}
            name={name}
            email={mail}
            message={message}
            signature={signature}
            status={sent ? "queued" : "writing"}
          />
        </div>
        {sent ? (
          <button type="button" className="btn text-tag" data-download onClick={download}>
            Download your stub
          </button>
        ) : null}
      </div>
    </div>
  );
}
