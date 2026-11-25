"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/+*#%&";

const randGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Slot = { el: HTMLSpanElement; a: HTMLSpanElement; b: HTMLSpanElement; cur: string };

function makeSlot(ch: string): Slot {
  const el = document.createElement("span");
  el.className = "hv2__ch";
  el.setAttribute("aria-hidden", "true");
  const a = document.createElement("span");
  const b = document.createElement("span");
  a.textContent = ch;
  b.textContent = ch;
  el.append(a, b);
  return { el, a, b, cur: ch };
}

export function ReelText({
  text,
  className,
  delay = 0,
  as: Tag = "p",
}: {
  text: string;
  className: string;
  delay?: number;
  as?: "p" | "div" | "span";
}) {
  const host = useRef<HTMLElement>(null);
  const slots = useRef<Slot[]>([]);
  const first = useRef(true);
  const raf = useRef(0);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chars = [...text];
    cancelAnimationFrame(raf.current);

    const list = slots.current;
    while (list.length < chars.length) {
      const s = makeSlot(" ");
      list.push(s);
      el.appendChild(s.el);
    }
    const extra = list.splice(chars.length);

    if (first.current || reduce) {
      first.current = false;
      list.forEach((s, i) => {
        s.cur = chars[i];
        s.a.textContent = s.b.textContent = chars[i] === " " ? " " : chars[i];
        s.el.style.removeProperty("--r");
        s.el.style.width = "";
      });
      extra.forEach((s) => s.el.remove());
      return;
    }

    type Plan = { slot: Slot; seq: string[]; start: number; turn: number };
    const t0 = performance.now() + delay;
    const plans: Plan[] = list.map((slot, i) => {
      const target = chars[i];
      const turns = target === " " ? 1 : 2 + Math.floor(Math.random() * 2);
      const seq = [slot.cur];
      for (let k = 0; k < turns - 1; k++) seq.push(randGlyph());
      seq.push(target);
      return { slot, seq, start: t0 + i * 32, turn: 150 };
    });
    const leaving: Plan[] = extra.map((slot, i) => ({
      slot,
      seq: [slot.cur, " "],
      start: t0 + i * 32,
      turn: 150,
    }));
    const all = [...plans, ...leaving];
    const nb = (c: string) => (c === " " ? " " : c);
    const measure = (s: Slot, ch: string) => {
      s.b.textContent = nb(ch);
      return s.b.getBoundingClientRect().width;
    };

    const widthFrom = new Map<Slot, number>();
    all.forEach((p) => widthFrom.set(p.slot, p.slot.a.getBoundingClientRect().width));

    const step = (now: number) => {
      let busy = false;
      for (const p of all) {
        const total = (p.seq.length - 1) * p.turn;
        const t = now - p.start;
        if (t < 0) {
          busy = true;
          continue;
        }
        const k = Math.min(p.seq.length - 2, Math.floor(t / p.turn));
        const local = Math.min(1, (t - k * p.turn) / p.turn);
        const from = p.seq[k];
        const to = p.seq[k + 1];
        p.slot.a.textContent = nb(from);
        p.slot.b.textContent = nb(to);
        p.slot.el.style.setProperty("--r", ease(local).toFixed(4));
        if (k === p.seq.length - 2) {
          const w0 = widthFrom.get(p.slot) ?? 0;
          const w1 = measure(p.slot, to);
          p.slot.el.style.width = `${w0 + (w1 - w0) * ease(local)}px`;
        }
        if (t < total) busy = true;
      }
      if (busy) {
        raf.current = requestAnimationFrame(step);
      } else {
        plans.forEach((p) => {
          const c = p.seq[p.seq.length - 1];
          p.slot.cur = c;
          p.slot.a.textContent = p.slot.b.textContent = nb(c);
          p.slot.el.style.removeProperty("--r");
          p.slot.el.style.width = "";
        });
        leaving.forEach((p) => p.slot.el.remove());
      }
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [text, delay]);

  const Comp = Tag as "p";
  return (
    <Comp ref={host as React.RefObject<HTMLParagraphElement>} className={className}>
      <span className="u-sr-only">{text}</span>
    </Comp>
  );
}
