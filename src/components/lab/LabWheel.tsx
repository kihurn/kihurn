"use client";

import { useEffect, useRef, useState } from "react";

type Mode = "flat" | "wheel" | "grid";

export interface LabItem {
  slug: string;
  name: string;
  /** first chip, e.g. FULL STACK */
  tag: string;
  /** second chip, e.g. SHIPPED */
  pill: string;
  href: string;
  poster: string;
}

const COLS = 6;
const GRID_GAP = 24;
const WHEEL_STEP = 0.2; // radians per row


const wrap = (v: number, n: number) => ((v % n) + n) % n;
const wrapHalf = (v: number, n: number) => wrap(v + n / 2, n) - n / 2;

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

function Chips({ e }: { e: LabItem }) {
  return (
    <>
      <span className="chip text-meta">{e.tag}</span>
      <span className="chip text-meta chip--pill">{e.pill}</span>
    </>
  );
}

export function LabWheel({ items }: { items: LabItem[] }) {
  const N = items.length;
  const [mode, setMode] = useState<Mode>("wheel");
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const modeRef = useRef<Mode>("wheel");
  const activeRef = useRef(0);
  const sim = useRef({
    pos: 0,
    target: 0,
    wheelP: 1,
    gridP: 0,
    panX: 0,
    panY: 0,
    panTX: 0,
    panTY: 0,
    dragging: false,
    moved: 0,
  });

  // restore the saved view mode
  useEffect(() => {
    try {
      const m = localStorage.getItem("lab-mode");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only persisted preference
      if (m === "flat" || m === "wheel" || m === "grid") setMode(m);
    } catch {}
  }, []);

  useEffect(() => {
    modeRef.current = mode;
    try {
      localStorage.setItem("lab-mode", mode);
    } catch {}
  }, [mode]);

  useEffect(() => {
    const section = sectionRef.current!;
    const viewport = viewportRef.current!;
    const s = sim.current;
    section.setAttribute("data-lab-enhanced", "");
    let raf = 0;
    let rowH = 72;
    let W = 0;
    let H = 0;
    let inset = 0;
    let cardW = 256;
    let cardH = 220;

    const measure = () => {
      const vr = viewport.getBoundingClientRect();
      W = vr.width;
      H = vr.height;
      const first = itemRefs.current[0];
      const face = first?.querySelector<HTMLElement>(".lab__row-face");
      rowH = (face ? face.offsetHeight : 64) + 14;
      inset = parseFloat(getComputedStyle(first ?? section).insetInlineStart) || 24;
      cardW = Math.max(140, (W - inset * 2 - GRID_GAP * (COLS - 1)) / COLS);
      cardH = cardW * 0.75 + 28;
      section.style.setProperty("--lab-card-w", `${cardW}px`);
      section.style.setProperty("--lab-card-h", `${cardH}px`);
    };

    const frame = () => {
      const m = modeRef.current;
      s.pos += (s.target - s.pos) * 0.12;
      s.wheelP += ((m === "flat" ? 0 : 1) - s.wheelP) * 0.14;
      s.gridP += ((m === "grid" ? 1 : 0) - s.gridP) * 0.14;
      s.panX += (s.panTX - s.panX) * 0.14;
      s.panY += (s.panTY - s.panY) * 0.14;

      const gridW = COLS * (cardW + GRID_GAP);
      const rowsInGrid = Math.ceil(N / COLS);
      const gridH = rowsInGrid * (cardH + GRID_GAP);

      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const off = wrapHalf(i - s.pos, N);
        // list / wheel layout
        const a = off * WHEEL_STEP * s.wheelP;
        const lx = (56 - 8 * off * off) * s.wheelP;
        const ly = H * (0.5 + 0.1 * s.wheelP) - rowH / 2 + off * rowH * (1 - 0.04 * s.wheelP);
        const lr = (a * 180) / Math.PI;
        const lo = Math.max(0, 1 - Math.abs(off) * (0.09 + 0.05 * s.wheelP));
        // grid layout (one tile per item, wrapped onto a torus)
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const bx = inset + col * (cardW + GRID_GAP) + s.panX;
        const by = 96 + row * (cardH + GRID_GAP) + s.panY;
        const gx = wrap(bx - inset + cardW, gridW) - cardW + inset;
        const gy = wrap(by + cardH, Math.max(gridH, H + cardH)) - cardH;
        const p = s.gridP;
        const x = lx * (1 - p) + (gx - inset) * p;
        const y = ly * (1 - p) + gy * p;
        const r = lr * (1 - p);
        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${r}deg)`;
        el.style.opacity = String(lo * (1 - p) + p);
        el.style.setProperty("--lab-grid-p", p.toFixed(3));
      });

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
    ro.observe(viewport);

    // input: wheel, drag, keys
    const snap = () => {
      if (modeRef.current !== "grid") s.target = Math.round(s.target);
    };
    let snapTimer = 0;
    const onWheel = (e: WheelEvent) => {
      const sideways = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!sideways) return; // leave the page's own scrolling alone
      e.preventDefault();
      if (modeRef.current === "grid") {
        s.panTX -= e.deltaX;
        s.panTY -= e.deltaY;
        return;
      }
      s.target += (e.deltaX || e.deltaY) / (rowH * 1.6);
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snap, 120);
    };
    let startX = 0;
    let startY = 0;
    let lastY = 0;
    let lastX = 0;
    const onDown = (e: PointerEvent) => {
      s.dragging = true;
      s.moved = 0;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      if (e.pointerType !== "touch") viewport.setPointerCapture(e.pointerId);
      section.setAttribute("data-lab-dragging", "");
    };
    const onMove = (e: PointerEvent) => {
      if (!s.dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const touch = e.pointerType === "touch";
      s.moved += Math.abs(dx) + Math.abs(dy);
      if (modeRef.current === "grid") {
        s.panTX += dx;
        s.panTY += dy;
      } else {
        s.target -= (touch ? dx : dy) / rowH;
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!s.dragging) return;
      s.dragging = false;
      section.removeAttribute("data-lab-dragging");
      if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
      snap();
      void startX;
      void startY;
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (t && t.closest("input, textarea, dialog")) return;
      if (document.documentElement.classList.contains("is-overlay")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        s.target = Math.round(s.target) + 1;
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        s.target = Math.round(s.target) - 1;
      }
    };
    // swallow the click that ends a drag; in wheel/list mode a click on a
    // non-active row brings it to the center first
    const onClickCapture = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>(".lab__item");
      if (!a) return;
      if (s.moved > 6) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (modeRef.current !== "grid") {
        const i = itemRefs.current.indexOf(a);
        if (i >= 0 && i !== activeRef.current) {
          e.preventDefault();
          e.stopPropagation();
          s.target = Math.round(s.pos) + wrapHalf(i - s.pos, N);
        }
      }
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("pointerdown", onDown);
    viewport.addEventListener("pointermove", onMove);
    viewport.addEventListener("pointerup", onUp);
    viewport.addEventListener("pointercancel", onUp);
    viewport.addEventListener("click", onClickCapture, true);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(snapTimer);
      ro.disconnect();
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("pointerdown", onDown);
      viewport.removeEventListener("pointermove", onMove);
      viewport.removeEventListener("pointerup", onUp);
      viewport.removeEventListener("pointercancel", onUp);
      viewport.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [N]);

  const current = items[active];

  const modes: Array<[Mode, string]> = [
    ["flat", "List"],
    ["wheel", "Wheel"],
    ["grid", "Grid"],
  ];

  return (
    <>
      <h1 className="u-sr-only">Lab</h1>
      <section
        ref={sectionRef}
        className="lab bleed-full"
        data-lab
        data-lab-cols={COLS}
        data-lab-mode={mode}
        aria-label="Projects, as a wheel, a list or a grid"
      >
        <div ref={viewportRef} className="lab__viewport" data-lab-viewport>
          <div className="lab__list" data-lab-list>
            {items.map((e, i) => (
              <a
                key={e.slug}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className={`lab__item${i === active ? " is-active" : ""}`}
                href={e.href}
                data-lab-item
                data-hover
                draggable={false}
              >
                <span className="lab__row-face">
                  <span className="lab__name">{e.name}</span>
                  <span className="lab__meta" aria-hidden="true">
                    <Chips e={e} />
                    <span className="linkcircle" aria-hidden="true">
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
                </span>
                <span className="lab__card" aria-hidden="true">
                  <span className="lab__card-media u-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="u-cover" src={e.poster} alt="" decoding="async" draggable={false} />
                  </span>
                  <span className="lab__card-cap">
                    <span className="lab__card-name text-meta">{e.name}</span>
                    <span className="lab__card-tags">
                      <Chips e={e} />
                    </span>
                  </span>
                </span>
              </a>
            ))}
          </div>
          <div className="pblur pblur--top" style={{ "--pblur-h": "9em" } as React.CSSProperties} aria-hidden="true">
            <div className="pblur__layer is--1" />
            <div className="pblur__layer is--2" />
            <div className="pblur__layer is--3" />
          </div>
          <div className="pblur pblur--bottom" style={{ "--pblur-h": "6em" } as React.CSSProperties} aria-hidden="true">
            <div className="pblur__layer is--1" />
            <div className="pblur__layer is--2" />
            <div className="pblur__layer is--3" />
          </div>
          <div className="lab__mode" role="group" aria-label="View mode" data-lab-mode-toggle>
            {modes.map(([m, label]) => (
              <button
                key={m}
                className="lab__mode-seg text-meta"
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
              >
                {mode === m ? <span className="lab__mode-bg" aria-hidden="true" /> : null}
                {label}
              </button>
            ))}
          </div>
          <div className="lab__preview u-media" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="lab__preview-img u-cover" src={current.poster} alt="" decoding="async" />
          </div>
        </div>
      </section>
    </>
  );
}
