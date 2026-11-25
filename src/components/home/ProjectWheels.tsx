"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useScrambleText } from "@/hooks/useScrambleText";
import { wrapIndex, wheelStepDirection } from "@/lib/wheelMath";
import { PressWheelCanvas, type WheelSimState } from "./PressWheelCanvas";

export interface WheelItem {
  slug: string;
  name: string;
  /** first chip, e.g. SHIPPED */
  tag: string;
  /** second chip, e.g. FULL STACK */
  lens: string;
  /** role/collab and year metadata for active card readout */
  role: string;
  year: string;
  href: string;
  photo: string;
  plate: string;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

const emptySub = () => () => {};
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function getReducedSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M18.25 15.25V5.75M18.25 5.75H8.75M18.25 5.75L6 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProjectWheels({ items }: { items: WheelItem[] }) {
  const N = items.length;
  const [active, setActive] = useState(0);
  const [viewMode, setViewMode] = useState<"wheel" | "list">("wheel");
  const reduced = useSyncExternalStore(subscribeReduced, getReducedSnapshot, () => false);
  // Keep unused subscribe import satisfied or avoid redundant helpers
  void emptySub;

  const stage = useRef<HTMLElement>(null);
  const activeRef = useRef(0);
  const glSimRef = useRef<WheelSimState>({
    pos: 0,
    vel: 0,
    pointerX: 0.5,
    pointerY: 0.5,
    pointerVelX: 0,
    pointerVelY: 0,
    stacked: false,
  });

  const sim = useRef({
    pos: 0,
    target: 0,
    vel: 0,
    dragging: false,
    moved: 0,
    lastY: 0,
    lastX: 0,
    touch: false,
    lastT: 0,
    px: 0.5,
    py: 0.5,
    pvx: 0,
    pvy: 0,
  });
  const [hint, setHint] = useState(true);

  const showList = reduced || viewMode === "list";

  useEffect(() => {
    if (showList) return;
    const el = stage.current;
    if (!el) return;
    const s = sim.current;
    let raf = 0;
    let W = 0;
    let H = 0;
    let stacked = false;

    const measure = () => {
      const r = el.getBoundingClientRect();
      W = r.width;
      H = r.height;
      stacked = W < 768;
      el.classList.toggle("is-stacked", stacked);
      glSimRef.current.stacked = stacked;
    };

    const frame = () => {
      s.pos += (s.target - s.pos) * 0.11;
      s.pvx *= 0.88;
      s.pvy *= 0.88;

      if (!s.dragging && Math.abs(s.vel) > 0.0004) {
        s.target += s.vel;
        s.vel *= 0.92;
        if (Math.abs(s.vel) < 0.0004) s.target = Math.round(s.target);
      }

      glSimRef.current.pos = s.pos;
      glSimRef.current.vel = s.vel;
      glSimRef.current.pointerX = s.px;
      glSimRef.current.pointerY = s.py;
      glSimRef.current.pointerVelX = s.pvx;
      glSimRef.current.pointerVelY = s.pvy;

      const nearest = wrapIndex(Math.round(s.pos), N);
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

    // Only intercept horizontal/shift wheel gestures; vertical wheel must scroll the page normally
    const onWheel = (e: WheelEvent) => {
      const sideways = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!sideways) return;
      e.preventDefault();
      s.target += (e.deltaX || e.deltaY) / (rowPx() * 2.4);
      hide();
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snap, 140);
    };

    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      s.dragging = true;
      s.moved = 0;
      s.lastY = e.clientY;
      s.lastX = e.clientX;
      s.touch = e.pointerType === "touch";
      s.lastT = performance.now();
      s.vel = 0;
      if (!s.touch) {
        try {
          el.setPointerCapture(e.pointerId);
        } catch {}
      }
      el.classList.add("is-grabbing");
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / Math.max(1, r.width);
      const ny = 1 - (e.clientY - r.top) / Math.max(1, r.height);
      s.pvx = THREE_CLAMP(nx - s.px, -0.18, 0.18);
      s.pvy = THREE_CLAMP(ny - s.py, -0.18, 0.18);
      s.px = nx;
      s.py = ny;

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
      if (!s.touch) {
        try {
          if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
        } catch {}
      }
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
  }, [showList, N, items]);

  const p = items[active];
  const { displayText: scrambledIndex } = useScrambleText(`N°${pad2(active + 1)} / ${pad2(N)}`, {
    durationMs: 320,
    intervalMs: 28,
  });
  const { displayText: scrambledTitle } = useScrambleText(p.name, {
    durationMs: 440,
    intervalMs: 32,
  });
  const { displayText: scrambledMeta } = useScrambleText(`${p.role} — ${p.year}`, {
    durationMs: 360,
    intervalMs: 30,
  });

  const stepTo = (idx: number) => {
    const s = sim.current;
    s.target = wheelStepDirection(s.pos, idx, N);
    setHint(false);
  };

  return (
    <div className="hv2">
      <h1 className="u-sr-only">Wong Ki Hurn</h1>
      {!showList ? (
        <section
          ref={stage}
          className="hv2__stage"
          data-wheels
          data-lenis-prevent
          data-state="rest"
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label="Selected work, two linked Three.js wheels. Drag to turn, left and right arrow keys browse, the center link opens the project."
        >
          <PressWheelCanvas items={items} simRef={glSimRef} />

          <div className="hv2__center" data-wheels-center>
            <p className="hv2__eyebrow text-label u-mono" aria-label={`Project ${active + 1} of ${N}`}>
              {scrambledIndex}
            </p>
            <p className="hv2__title">{scrambledTitle}</p>
            <div className="hv2__chips">
              <span className="chip text-meta">{p.tag}</span>
              <span className="chip text-meta chip--pill">{p.lens}</span>
            </div>
            <p className="hv2__meta text-mono-sm u-muted">{scrambledMeta}</p>
            <div className="hv2__ctarow">
              <a href={p.href} className="btn btn--solid text-tag">
                <span className="btn__label roll" data-roll>
                  View project
                </span>
              </a>
            </div>
          </div>

          <div className="hv2__toolbar">
            <div className="hv2__stepper">
              <button
                type="button"
                className="chip text-mono-sm hv2__toolbtn"
                aria-label="Previous project"
                onClick={() => stepTo(wrapIndex(active - 1, N))}
              >
                ← PREV
              </button>
              <button
                type="button"
                className="chip text-mono-sm hv2__toolbtn"
                aria-label="Next project"
                onClick={() => stepTo(wrapIndex(active + 1, N))}
              >
                NEXT →
              </button>
            </div>
            <button
              type="button"
              className="chip text-mono-sm hv2__toolbtn"
              data-wheel-toggle
              onClick={() => {
                const target = document.getElementById("home-index");
                if (target) {
                  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
                } else {
                  setViewMode("list");
                }
              }}
            >
              INDEX LIST ↓
            </button>
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
          <div className="hv2__classic-bar">
            <h2 className="hv2__classic-head">Selected work</h2>
            {!reduced ? (
              <button
                type="button"
                className="chip text-mono-sm hv2__toolbtn"
                data-wheel-toggle
                onClick={() => setViewMode("wheel")}
              >
                3D PRESS WHEEL
              </button>
            ) : null}
          </div>
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

function THREE_CLAMP(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
