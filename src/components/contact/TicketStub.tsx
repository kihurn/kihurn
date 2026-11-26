"use client";

import { forwardRef, useState } from "react";
import Image from "next/image";
import { TICKET_TYPES, type TicketType } from "@/lib/contact/validate";

export type StubStatus = "writing" | "dispatched";

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

export const TicketStub = forwardRef<HTMLDivElement, Props>(function TicketStub(
  { ticketNo, date, type, name, email, message, signature, status },
  ref,
) {
  const [copied, setCopied] = useState(false);
  const label = TICKET_TYPES.find((t) => t.id === type)?.label ?? "";
  const excerpt = message.trim().slice(0, 72) + (message.trim().length > 72 ? "…" : "");
  const dispatched = status === "dispatched";

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
        <span className="stub__badge text-mono-sm">{dispatched ? "DISPATCHED" : "DRAFT"}</span>
      </div>

      <div className="stub__no-row">
        <p className="stub__no text-mono-meta">
          <span aria-hidden="true">JOB :: </span><span data-stub-no>{ticketNo ?? "KH-YYMMDD-····"}</span>
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
          <dd data-stub-status>{dispatched ? "DISPATCHED" : "BEING WRITTEN"}</dd>
        </div>
      </dl>

      <div className="stub__sig">
        <span className="stub__sig-k text-mono-sm">SIGNATURE::</span>
        {signature ? (
          <Image unoptimized src={signature} width={320} height={128} alt="Visitor signature" className="stub__sig-img" />
        ) : (
          <span className="stub__sig-empty text-mono-sm">UNSIGNED</span>
        )}
      </div>

      <div className="stub__barcode" aria-hidden="true">
        {Array.from({ length: 40 }, (_, index) => <i key={index} style={{ width: 1 + (index * 7 % 5) * 0.6 }} />)}
      </div>
      <p className="stub__foot text-mono-meta">ONE REPLY · MYT +08:00 · NO SPAM</p>
      {dispatched && <span className="stub__seal text-mono-sm">SENT <span>· {date.slice(0, 6)}</span></span>}
    </div>
  );
});
