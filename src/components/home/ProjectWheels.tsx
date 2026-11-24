"use client";

import { useEffect, useRef, useState } from "react";
import { ReelText } from "./ReelText";

export interface WheelItem {
  slug: string;
  name: string;
  /** first chip, e.g. SHIPPED */
  tag: string;
  /** second chip, e.g. FULL STACK */
  lens: string;
  href: string;
  photo: string;
  plate: string;
}

const wrap = (v: number, n: number) => ((v % n) + n) % n;
const wrapHalf = (v: number, n: number) => wrap(v + n / 2, n) - n / 2;
const pad2 = (n: number) => String(n).padStart(2, "0");

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M18.25 15.25V5.75M18.25 5.75H8.75M18.25 5.75L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProjectWheels({ items }: { items: WheelItem[] }) {
  const N = items.length;
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);
  const stage = useRef<HTMLElement>(null);
  const leftRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rightRefs = useRef<Array<HTMLDivElement | null>>([]);
  const activeRef = useRef(0);
  const sim = useRef({ pos: 0, target: 0, vel: 0, dragging: false, moved: 0, lastY: 0, lastX: 0, touch: false, lastT: 0 });
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // client-only media queries: read after mount so SSR markup stays stable
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mq.matches);
    setHint(window.matchMedia("(pointer: coarse)").matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const el = stage.current!;
    const s = sim.current;
    let raf = 0;
    let W = 0;
    let H = 0;
    let stacked = false;

    const measure = () => {
      const r = el.getBoundingClientRect();
      W = r.width;
      H = r.height;
      stacked = W < 800;
      el.classList.toggle("is-stacked", stacked);
    };

    const frame = () => {
      s.pos += (s.target - s.pos) * 0.11;
      const cy = stacked ? H * 0.2 : H * 0.54;
      // left wheel: big photo cards; right wheel: logo plates; they turn in opposite directions
      const Lw = stacked ? Math.min(W * 0.5, H * 0.24) : H * 0.46;
      const Lh = Lw * 0.5625;
      const LR = stacked ? H * 0.16 : H * 0.34;
      const Lstep = 1.08;
      const Lcx = stacked ? -LR * 0.15 + Lw * 0.1 : -H * 0.075;
      const Rw = stacked ? Math.min(W * 0.2, H * 0.12) : H * 0.155;
      const RR = stacked ? H * 0.16 : H * 0.29;
      const Rstep = 1.7;
      const Rcx = stacked ? W + RR * 0.2 - Rw * 0.2 : W - H * 0.42 + RR * 0.95;

      for (let i = 0; i < N; i++) {
        const off = wrapHalf(i - s.pos, N);
        const L = leftRefs.current[i];
        if (L) {
          const a = off * Lstep;
          const vis = Math.abs(off) < (stacked ? 1 : 2.2);
          const x = Lcx + LR * Math.cos(a) + (stacked ? W * 0.18 : 0);
          const y = cy + LR * Math.sin(a) * (stacked ? 1.15 : 1);
          const scale = 1 - Math.min(0.35, Math.abs(off) * 0.18);
          L.style.width = `${Lw}px`;
          L.style.height = `${Lh}px`;
          L.style.opacity = vis ? String(stacked ? 1 - Math.abs(off) : Math.max(0, 1 - Math.max(0, Math.abs(off) - 1.2))) : "0";
          L.style.transform = `translate3d(${x - Lw / 2}px, ${y - Lh / 2}px, 0) rotate(${off * 28}deg) scale(${scale})`;
          L.style.zIndex = String(10 - Math.round(Math.abs(off)));
        }
        const R = rightRefs.current[i];
        if (R) {
          const a = -off * Rstep;
          const vis = Math.abs(off) < (stacked ? 1 : 1.8);
          const x = Rcx - RR * Math.cos(a) - (stacked ? W * 0.02 : 0);
          const y = cy + RR * Math.sin(a);
          R.style.width = `${Rw}px`;
          R.style.height = `${Rw}px`;
          R.style.opacity = vis ? String(stacked ? 1 - Math.abs(off) : Math.max(0, 1 - Math.max(0, Math.abs(off) - 1))) : "0";
          R.style.transform = `translate3d(${x - Rw / 2}px, ${y - Rw / 2}px, 0) rotate(${-8 + off * -32}deg) scale(${1 - Math.min(0.2, Math.abs(off) * 0.1)})`;
        }
      }

      if (!s.dragging && Math.abs(s.vel) > 0.0004) {
        s.target += s.vel;
        s.vel *= 0.92;
        if (Math.abs(s.vel) < 0.0004) s.target = Math.round(s.target);
      }
      const nearest = wrap(Math.round(s.pos), N);
      if (nearest !== activeRef.current) {
        activeRef.current = nearest;
        setActive(nearest);
      }
      raf = requestAnimationFrame(frame);
    };

    measure();
    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const rowPx = () => Math.max(120, H * 0.28);
    let snapTimer = 0;
    const snap = () => {
      s.target = Math.round(s.target);
    };
    const hide = () => setHint(false);
    const onWheel = (e: WheelEvent) => {
      const sideways = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!sideways) return; // leave the page's own scrolling alone
      e.preventDefault();
      s.target += (e.deltaX || e.deltaY) / (rowPx() * 2.4);
      hide();
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snap, 140);
    };
    const onDown = (e: PointerEvent) => {
      s.dragging = true;
      s.moved = 0;
      s.lastY = e.clientY;
      s.lastX = e.clientX;
      s.touch = e.pointerType === "touch";
      s.lastT = performance.now();
      s.vel = 0;
      if (!s.touch) el.setPointerCapture(e.pointerId);
      el.classList.add("is-grabbing");
    };
    const onMove = (e: PointerEvent) => {
      if (!s.dragging) return;
      const dy = s.touch ? e.clientX - s.lastX : e.clientY - s.lastY;
      const now = performance.now();
      s.lastY = e.clientY;
      s.lastX = e.clientX;
      s.moved += Math.abs(dy);
      const d = -dy / rowPx();
      s.target += d;
      s.vel = (d / Math.max(1, now - s.lastT)) * 16;
      s.lastT = now;
      hide();
    };
    const onUp = (e: PointerEvent) => {
      if (!s.dragging) return;
      s.dragging = false;
      el.classList.remove("is-grabbing");
      if (!s.touch && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      s.target += s.vel * 8;
      s.vel = 0;
      snap();
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (t && (t.closest("input, textarea, dialog") || document.documentElement.classList.contains("is-overlay"))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        s.target = Math.round(s.target) + 1;
        hide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        s.target = Math.round(s.target) - 1;
        hide();
      } else if (e.key === "Enter" && document.activeElement === el) {
        window.location.assign(items[activeRef.current].href);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(snapTimer);
      ro.disconnect();
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, [reduced, N, items]);

  const p = items[active];
  const turn = (i: number) => {
    // click a side plate: bring it to the center
    const s = sim.current;
    if (s.moved > 6) return;
    const off = wrapHalf(i - s.pos, N);
    if (Math.abs(Math.round(off)) > 0) s.target = Math.round(s.pos) + Math.round(off);
  };

  return (
    <div className="hv2">
      <h1 className="u-sr-only">Wong Ki Hurn</h1>
      {!reduced ? (
        <section
          ref={stage}
          className="hv2__stage"
          data-wheels
          data-lenis-prevent
          data-state="rest"
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label="Selected work, two linked wheels. Drag to turn, left and right arrow keys browse, the center link opens the project."
        >
          <div className="hv2__wheel hv2__wheel--left" aria-hidden="true">
            {items.map((pr, i) => (
              <div
                key={pr.slug}
                className="hv2__plate hv2__plate--photo"
                ref={(el) => {
                  leftRefs.current[i] = el;
                }}
                onClick={() => turn(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pr.photo} alt="" draggable={false} />
              </div>
            ))}
          </div>
          <div className="hv2__wheel hv2__wheel--right" aria-hidden="true">
            {items.map((pr, i) => (
              <div
                key={pr.slug}
                className="hv2__plate hv2__plate--logo"
                ref={(el) => {
                  rightRefs.current[i] = el;
                }}
                onClick={() => turn(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pr.plate} alt="" draggable={false} />
              </div>
            ))}
          </div>

          <div className="hv2__center" data-wheels-center>
            <div className="hv2__line hv2__line--eyebrow" style={{ blockSize: 17 }}>
              <ReelText className="hv2__eyebrow text-label" text={`N°${pad2(active + 1)} / ${pad2(N)}`} />
            </div>
            <div className="hv2__line hv2__line--title" style={{ blockSize: 37 }}>
              <ReelText className="hv2__title" text={p.name} delay={70} />
            </div>
            <div className="hv2__line hv2__line--chips" style={{ blockSize: 24 }}>
              <div className="hv2__chips">
                <span className="chip text-meta">
                  <ReelText as="span" className="hv2__chiptext" text={p.tag} delay={140} />
                </span>
                <span className="chip text-meta chip--pill">
                  <ReelText as="span" className="hv2__chiptext" text={p.lens} delay={160} />
                </span>
              </div>
            </div>
            <div className="hv2__line hv2__line--cta" style={{ blockSize: 26 }}>
              <div className="hv2__ctarow">
                <a href={p.href} className="btn btn--solid text-tag">
                  <span className="btn__label roll" data-roll>
                    View project
                  </span>
                </a>
              </div>
            </div>
          </div>
          {hint ? (
            <p className="hv2__hint text-mono-meta" aria-hidden="true">
              SWIPE:: TO BROWSE
            </p>
          ) : null}
          <p className="u-sr-only" aria-live="polite">
            {`${p.name}, ${active + 1} of ${N}`}
          </p>
        </section>
      ) : (
        <div className="hv2__classic container">
          <h2 className="hv2__classic-head">Selected work</h2>
          <ul className="hv2__list">
            {items.map((pr) => (
              <li key={pr.slug}>
                <a href={pr.href} data-hover className="row row--link">
                  <span className="row__label text-tag">{pr.name}</span>
                  <span className="row__line" aria-hidden="true" />
                  <span className="row__tags">
                    <span className="chip text-meta row__tag">{pr.tag}</span>
                    <span className="chip text-meta chip--pill row__tag">{pr.lens}</span>
                    <span className="linkcircle row__link" aria-hidden="true">
                      <span className="arrow-roll" aria-hidden="true">
                        <span className="arrow-roll__icon arrow-roll__current">
                          <ArrowIcon />
                        </span>
                        <span className="arrow-roll__icon arrow-roll__next">
                          <ArrowIcon />
                        </span>
                      </span>
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
