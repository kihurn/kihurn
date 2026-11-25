"use client";

import { forwardRef, useState } from "react";
import { TICKET_TYPES, type TicketType } from "@/lib/contact/validate";

export type StubStatus = "writing" | "queued";

interface Props {
  ticketNo: string | null;
  date: string;
  type: TicketType;
  name: string;
  email: string;
  message: string;
  signature?: string;
  status: StubStatus;
}

/** The perforated INTAKE · COUNTER 01 ticket stub synced live as the visitor drafts. */
export const TicketStub = forwardRef<HTMLDivElement, Props>(function TicketStub(
  { ticketNo, date, type, name, email, message, signature, status },
  ref,
) {
  const [copied, setCopied] = useState(false);
  const label = TICKET_TYPES.find((t) => t.id === type)?.label ?? "";
  const excerpt = message.trim().slice(0, 72) + (message.trim().length > 72 ? "…" : "");

  const copyId = async () => {
    if (!ticketNo) return;
    try {
      await navigator.clipboard.writeText(ticketNo);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div ref={ref} className="stub" data-stub data-status={status} aria-label="Your ticket stub" role="group">
      <div className="stub__head">
        <span className="stub__counter text-mono-sm">INTAKE · COUNTER 01</span>
        <span className="stub__badge text-mono-sm">{status === "queued" ? "FILED" : "DRAFT"}</span>
      </div>

      <div className="stub__no-row">
        <p className="stub__no text-mono-meta" data-stub-no>
          {ticketNo ?? "KH-YYMMDD-····"}
        </p>
        {ticketNo ? (
          <button type="button" className="stub__copy text-mono-sm" onClick={copyId} aria-label="Copy receipt ID">
            {copied ? "COPIED" : "COPY"}
          </button>
        ) : null}
      </div>

      <dl className="stub__rows text-mono-meta">
        <div>
          <dt>DATE</dt>
          <dd>{date || "···"}</dd>
        </div>
        <div>
          <dt>RE ::</dt>
          <dd data-stub-type>{label.toUpperCase()}</dd>
        </div>
        <div>
          <dt>FROM</dt>
          <dd data-stub-name>{name.trim() || "···"}</dd>
        </div>
        <div>
          <dt>REPLY</dt>
          <dd>{email.trim() || "···"}</dd>
        </div>
        <div>
          <dt>NOTE</dt>
          <dd>{excerpt || "···"}</dd>
        </div>
        <div>
          <dt>STATUS</dt>
          <dd data-stub-status>{status === "queued" ? "IN QUEUE" : "BEING WRITTEN"}</dd>
        </div>
      </dl>

      <div className="stub__sig">
        <span className="stub__sig-k text-mono-sm">SIGNATURE::</span>
        {signature ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signature} alt="Visitor signature" className="stub__sig-img" />
        ) : (
          <span className="stub__sig-empty text-mono-sm">UNSIGNED</span>
        )}
      </div>

      <p className="stub__foot text-mono-meta">ONE REPLY · MYT +08:00 · NO SPAM</p>
    </div>
  );
});
