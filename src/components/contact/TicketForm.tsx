"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { TICKET_TYPES, validateTicket, type TicketType } from "@/lib/contact/validate";
import { SignaturePad } from "./SignaturePad";
import { TicketStub } from "./TicketStub";
import { launchLetter } from "./letterFlight";

type Field = "name" | "email" | "message" | "referral";
type Errors = Partial<Record<Field | "form", string>>;

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur",
});
const getKlDate = () => dateFormatter.format(new Date()).toUpperCase();
const subscribeDate = (update: () => void) => {
  const timer = window.setInterval(update, 60_000);
  return () => window.clearInterval(timer);
};

export function TicketForm({ email }: { email: string }) {
  const [type, setType] = useState<TicketType>("hello");
  const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [message, setMessage] = useState("");
  const [referral, setReferral] = useState("");
  const [signature, setSignature] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"writing" | "sending" | "folding">("writing");
  const [receipt, setReceipt] = useState<{ ticketNo: string; date: string } | null>(null);

  const grain = useId();
  const date = useSyncExternalStore(subscribeDate, getKlDate, () => "");
  const request = useRef<AbortController | null>(null);
  const stub = useRef<HTMLDivElement>(null);
  const flight = useRef<HTMLDivElement>(null);
  const confirmation = useRef<HTMLParagraphElement>(null);
  const draftFocus = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const referralRef = useRef<HTMLInputElement>(null);
  const busy = state !== "writing";

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (receipt) confirmation.current?.focus();
    else if (draftFocus.current) {
      draftFocus.current = false;
      nameRef.current?.focus();
    }
  }, [receipt]);

  function showError(field: string | undefined, error: string) {
    const fields = { name: nameRef, email: emailRef, message: messageRef, referral: referralRef };
    if (field !== "name" && field !== "email" && field !== "message" && field !== "referral") {
      setErrors({ form: error });
      return;
    }
    setErrors({ [field]: error });
    const input = fields[field].current;
    input?.focus();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      input?.closest("label")?.animate([
        { transform: "translateX(0)" }, { transform: "translateX(-3px)" },
        { transform: "translateX(2px)" }, { transform: "translateX(0)" },
      ], { duration: 210, easing: "ease-out" });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current || receipt) return;
    const sheet = event.currentTarget;
    const website = new FormData(sheet).get("website");
    const payload = { type, name, email: mail, message, referral, signature: signature || undefined };
    const valid = validateTicket(payload);
    if (!valid.ok) return showError(valid.field, valid.error);

    setErrors({});
    setState("sending");
    const controller = new AbortController();
    request.current = controller;
    const fallback = `Couldn't send right now. Email me directly at ${email}.`;
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...valid.ticket, website }),
        signal: controller.signal,
      });
      const result = (await res.json().catch(() => ({}))) as { ticketNo?: string; field?: string; error?: string };
      if (controller.signal.aborted) return;
      if (!res.ok || !result.ticketNo) return showError(result.field, result.error ?? fallback);

      const receiptDate = getKlDate();
      setState("folding");
      if (flight.current) await launchLetter(sheet, flight.current, controller.signal).catch(() => {});
      if (!controller.signal.aborted) setReceipt({ ticketNo: result.ticketNo, date: receiptDate });
    } catch {
      if (!controller.signal.aborted) setErrors({ form: fallback });
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setState("writing");
    }
  }

  function writeAnother() {
    setType("hello");
    setName("");
    setMail("");
    setMessage("");
    setReferral("");
    setSignature("");
    setErrors({});
    draftFocus.current = true;
    setReceipt(null);
  }

  async function download() {
    if (!stub.current || !receipt) return;
    const { toPng } = await import("html-to-image");
    const url = await toPng(stub.current, { pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${receipt.ticketNo}.png`;
    a.click();
  }

  const fields = [
    { id: "name", label: "FROM ::", accessible: "Your name", value: name, set: setName, ref: nameRef, placeholder: "Your name", maxLength: 80, autoComplete: "name" },
    { id: "email", label: "EMAIL ::", accessible: "Your email", value: mail, set: setMail, ref: emailRef, placeholder: "you@domain.com", autoComplete: "email" },
    { id: "referral", label: "VIA ::", accessible: "Referral (optional)", value: referral, set: setReferral, ref: referralRef, placeholder: "Referral, GitHub, LinkedIn (optional)", maxLength: 160, autoComplete: "off" },
  ] as const;

  return (
    <div className="ticket" data-state={receipt ? "dispatched" : state}>
      {!receipt && (
        <form className="letter-sheet" onSubmit={submit} noValidate aria-busy={busy} aria-describedby={errors.form ? "ticket-form-err" : undefined}>
          <svg className="letter-sheet__grain" aria-hidden="true" width="100%" height="100%">
            <filter id={grain}>
              <feTurbulence type="fractalNoise" baseFrequency=".74" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter={`url(#${grain})`} />
          </svg>
          <svg className="letter-sheet__fold" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 19 100 0 26 91M100 0 11 55M26 91 72 95 100 0" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="letter-sheet__meta text-mono-meta">
            <div className="letter-sheet__desk"><strong>KH :: DESK</strong><span>DATE :: {date || "MYT"}</span></div>
            <span className="postcard__stamp" aria-hidden="true">
              <span className="postcard__stamp-paper">
                <span className="postcard__stamp-art" />
                <span className="postcard__stamp-caption"><strong>KH</strong><span>· KL — MY</span></span>
              </span>
              <svg className="letter-sheet__postmark" viewBox="0 0 96 34" fill="none">
                <path d="M1 8c17-14 30 10 47 2S75-3 95 8M1 17c17-14 30 10 47 2s27-13 47-2M1 26c17-14 30 10 47 2s27-13 47-2" />
              </svg>
            </span>
          </div>

          <p className="letter-sheet__salutation">Dear Ki Hurn,</p>
          <fieldset className="ticket__types" disabled={busy}>
            <legend className="text-mono-meta">RE ::</legend>
            <div className="ticket__pills">
              {TICKET_TYPES.map((option) => (
                <label key={option.id} className="ticket__radio">
                  <input type="radio" name="type" value={option.id} checked={type === option.id} onChange={() => setType(option.id)} />
                  <span className="ticket__check" aria-hidden="true">{type === option.id ? "[x]" : "[ ]"}</span>
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="letter-sheet__fields">
            {fields.map((field) => (
              <label className="ticket__field ticket__field--inline" key={field.id}>
                <span className="text-mono-meta">{field.label}</span>
                <input
                  ref={field.ref} name={field.id} type={field.id === "email" ? "email" : "text"} aria-label={field.accessible}
                  placeholder={field.placeholder} value={field.value} onChange={(event) => field.set(event.target.value)}
                  autoComplete={field.autoComplete} maxLength={"maxLength" in field ? field.maxLength : undefined}
                  required={field.id !== "referral"} readOnly={busy}
                  aria-invalid={Boolean(errors[field.id])} aria-describedby={errors[field.id] ? `err-${field.id}` : undefined}
                />
                {errors[field.id] && <span id={`err-${field.id}`} className="ticket__err" role="alert">{errors[field.id]}</span>}
              </label>
            ))}
          </div>

          <label className="ticket__field">
            <span className="text-mono-meta">WHAT ARE WE MAKING?</span>
            <textarea
              ref={messageRef} name="message" aria-label="Message" rows={5} placeholder="Write a note, timeline, or link…"
              value={message} onChange={(event) => setMessage(event.target.value)} minLength={10} maxLength={2000}
              required readOnly={busy} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "err-message" : undefined}
            />
            {errors.message && <span id="err-message" className="ticket__err" role="alert">{errors.message}</span>}
          </label>

          <div className="letter-sheet__signoff">
            <p>Sincerely,</p>
            <SignaturePad value={signature} onChange={setSignature} disabled={busy} />
            <p className="letter-sheet__sender">{name.trim() || "Your name"}</p>
          </div>

          <input className="ticket__hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" defaultValue="" />
          {errors.form && <p id="ticket-form-err" className="ticket__err" role="alert">{errors.form}</p>}

          <button className="ticket__submit text-tag" type="submit" disabled={busy}>
            {state === "sending" ? "Sending…" : "Fold & send"}
            <svg viewBox="0 0 28 24" fill="none" aria-hidden="true">
              <path d="m2 10 24-8-6 20-7-6-5 3V13L26 2M2 10l6 3m5 3L26 2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      )}

      <div className="ticket__side">
        <div className="stub-pinned">
          <svg className="stub-paperclip" viewBox="0 0 36 86" fill="none" aria-hidden="true">
            <path d="M11 65V22a9 9 0 0 1 18 0v44a12 12 0 0 1-24 0V28a6 6 0 0 1 12 0v32" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M11 65V22a9 9 0 0 1 18 0v44a12 12 0 0 1-24 0V28a6 6 0 0 1 12 0v32" stroke="#fff9" strokeWidth=".9" strokeLinecap="round" transform="translate(-0.7 -0.5)" />
          </svg>
          <TicketStub ref={stub} ticketNo={receipt?.ticketNo ?? null} date={receipt?.date ?? date} type={type} name={name}
            email={mail} message={message} signature={signature} status={receipt ? "dispatched" : "writing"} />
        </div>
        {receipt && (
          <div className="ticket__receipt">
            <p ref={confirmation} tabIndex={-1} role="status">Letter sent. I&apos;ll reply to {mail.trim()}.</p>
            <div className="ticket__actions">
              <button type="button" className="btn text-tag" onClick={writeAnother}>Write another letter</button>
              <button type="button" className="btn text-tag" data-download onClick={download}>Download your stub</button>
            </div>
          </div>
        )}
      </div>

      {!receipt && (
        <div className="letter-flight" ref={flight} aria-hidden="true">
          <svg viewBox="0 0 100 68" fill="#f1f0ec">
            <path d="M0 27 100 0 76 68 49 47 32 60 28 41Z" stroke="#1e1e1e" />
            <path d="M28 41 100 0 32 60Z" fill="#d0cfc9" stroke="#1e1e1e" strokeLinejoin="round" />
            <path d="M32 60 100 0 49 47Z" fill="#e0ded7" stroke="#1e1e1e" strokeLinejoin="round" />
          </svg>
          {Array.from({ length: 11 }, (_, index) => <i key={index} />)}
        </div>
      )}
    </div>
  );
}
