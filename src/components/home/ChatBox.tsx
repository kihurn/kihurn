"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import type { FaqEntry } from "@/content/types";
import { faq } from "@/content/faq";

interface Msg {
  from: "you" | "me";
  text: string;
  tag?: string;
  ticket?: boolean;
}

const ERR = "Something went wrong. Try a suggested question, or send me a ticket.";

export function ChatBox({ chips }: { chips: FaqEntry[] }) {
  const [log, setLog] = useState<Msg[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const id = useId();
  const input = useRef<HTMLInputElement>(null);

  function chip(entry: FaqEntry) {
    setLog((l) => [...l, { from: "you", text: entry.question }, { from: "me", text: entry.answer, tag: "faq" }]);
  }

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const exact = faq.find((e) => e.question.toLowerCase() === q.toLowerCase());
    if (exact) {
      chip(exact);
      setValue("");
      return;
    }
    const history = log
      .filter((m) => !m.ticket)
      .slice(-6)
      .map((m) => ({ role: m.from === "you" ? "user" : "assistant", content: m.text.slice(0, 500) }));
    setLog((l) => [...l, { from: "you", text: q }]);
    setValue("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, history }),
      });
      const j = (await res.json().catch(() => ({}))) as { reply?: string; error?: string; offline?: boolean; source?: string; ms?: number };
      if (res.ok && j.reply) {
        const tag = j.source === "c0re" && typeof j.ms === "number" ? `c0re · ${(j.ms / 1000).toFixed(1)}s` : (j.source ?? "faq");
        setLog((l) => [...l, { from: "me", text: j.reply!, tag }]);
      } else if (j.offline && j.reply) {
        setLog((l) => [...l, { from: "me", text: j.reply!, tag: "offline", ticket: true }]);
      } else {
        setLog((l) => [...l, { from: "me", text: j.error ?? ERR, ticket: res.status !== 429 }]);
      }
    } catch {
      setLog((l) => [...l, { from: "me", text: ERR, ticket: true }]);
    } finally {
      setBusy(false);
    }
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
        <span className="chat__count text-meta" aria-hidden="true">
          {value.length}/500
        </span>
        <button className="chat__send" type="submit" aria-label="Send" disabled={busy}>
          ↵
        </button>
      </form>

      <ul className="chat__chips" aria-label="Suggested questions">
        {chips.map((c) => (
          <li key={c.id}>
            <button className="chip text-meta chat__chip" type="button" data-chip onClick={() => chip(c)}>
              {c.question}
            </button>
          </li>
        ))}
      </ul>

      <div className="chat__log" data-chat-log aria-live="polite" aria-busy={busy}>
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
        {busy ? (
          <p className="chat__msg chat__msg--me" data-chat-typing>
            <span className="chat__who text-meta">Ki Hurn&apos;s site</span>
            <span className="chat__typing">…</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
