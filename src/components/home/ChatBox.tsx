"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import type { FaqEntry } from "@/content/types";
import { faq } from "@/content/faq";
import { matchFaq } from "@/lib/faq";

interface Msg {
  from: "you" | "me";
  text: string;
  tag?: string;
  ticket?: boolean;
}

const NO_MATCH = "The full chat is coming soon. Try a suggested question, or send me a ticket.";

/** Phase 2: answers come only from the scripted FAQ. Phase 4 adds the live model behind the same box. */
export function ChatBox({ chips }: { chips: FaqEntry[] }) {
  const [log, setLog] = useState<Msg[]>([]);
  const [value, setValue] = useState("");
  const id = useId();
  const input = useRef<HTMLInputElement>(null);

  function ask(text: string, exact?: FaqEntry) {
    const q = text.trim();
    if (!q) return;
    const hit = exact ?? matchFaq(q, faq);
    setLog((l) => [
      ...l,
      { from: "you", text: q },
      hit ? { from: "me", text: hit.answer, tag: "faq" } : { from: "me", text: NO_MATCH, ticket: true },
    ]);
    setValue("");
  }

  return (
    <div className="chat">
      <form
        className="chat__form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(value);
        }}
      >
        <label className="u-sr-only" htmlFor={id}>
          Ask me anything about Ki Hurn
        </label>
        <input
          ref={input}
          id={id}
          className="chat__input"
          type="text"
          value={value}
          maxLength={500}
          placeholder="Ask me anything about Ki Hurn…"
          autoComplete="off"
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="chat__send" type="submit" aria-label="Send">
          ↵
        </button>
      </form>

      <ul className="chat__chips" aria-label="Suggested questions">
        {chips.map((c) => (
          <li key={c.id}>
            <button className="chip text-meta chat__chip" type="button" data-chip onClick={() => ask(c.question, c)}>
              {c.question}
            </button>
          </li>
        ))}
      </ul>

      <div className="chat__log" data-chat-log aria-live="polite">
        {log.map((m, i) => (
          <p key={i} className={`chat__msg chat__msg--${m.from}`}>
            <span className="chat__who text-meta">{m.from === "you" ? "You" : "Ki Hurn's site"}</span>
            {m.text}
            {m.tag ? <span className="chat__tag text-meta">{m.tag}</span> : null}
            {m.ticket ? (
              <>
                {" "}
                <Link href="/contact">Send me a ticket</Link>
              </>
            ) : null}
          </p>
        ))}
      </div>
    </div>
  );
}
