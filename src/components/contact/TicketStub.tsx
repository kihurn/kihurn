import { forwardRef } from "react";
import { TICKET_TYPES, type TicketType } from "@/lib/contact/validate";

export type StubStatus = "writing" | "queued";

interface Props {
  ticketNo: string | null;
  date: string;
  type: TicketType;
  name: string;
  status: StubStatus;
}

/** The paper stub that updates as the visitor types. Rendered to PNG for "Download your stub". */
export const TicketStub = forwardRef<HTMLDivElement, Props>(function TicketStub(
  { ticketNo, date, type, name, status },
  ref,
) {
  const label = TICKET_TYPES.find((t) => t.id === type)?.label ?? "";
  return (
    <div ref={ref} className="stub" data-stub data-status={status} aria-label="Your ticket stub" role="group">
      <p className="stub__no text-mono-meta" data-stub-no>
        {ticketNo ?? "KH-YYMMDD-····"}
      </p>
      <dl className="stub__rows text-mono-meta">
        <div>
          <dt>DATE</dt>
          <dd>{date || "···"}</dd>
        </div>
        <div>
          <dt>TYPE</dt>
          <dd data-stub-type>{label.toUpperCase()}</dd>
        </div>
        <div>
          <dt>NAME</dt>
          <dd data-stub-name>{name.trim() || "···"}</dd>
        </div>
        <div>
          <dt>STATUS</dt>
          <dd data-stub-status>{status === "queued" ? "IN QUEUE" : "BEING WRITTEN"}</dd>
        </div>
      </dl>
      <p className="stub__foot text-mono-meta">ONE REPLY, NO SPAM</p>
    </div>
  );
});
