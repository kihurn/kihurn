"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LabMiniStage } from "@/components/lab/LabMiniStage";
import { OptionalPhoto } from "@/components/media/OptionalPhoto";
import { useScrambleText } from "@/hooks/useScrambleText";
import { normalizeLabMode, type LabViewMode } from "@/lib/labSchematics";

export interface LabItem {
  slug: string;
  name: string;
  tag: string;
  pill: string;
  href: string;
  year?: string;
  summary: string;
  kind: "experiment" | "project";
  photo?: string;
}

const WHEEL_STEP = 0.175;
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
  const [mode, setMode] = useState<LabViewMode>("wheel");
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const modeRef = useRef<LabViewMode>("wheel");
  const activeRef = useRef(0);
  const sim = useRef({
    pos: 0,
    target: 0,
    dragging: false,
    moved: 0,
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        const stored = localStorage.getItem("lab-mode");
        if (stored) setMode(normalizeLabMode(stored));
      } catch {}
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    modeRef.current = mode;
    try {
      localStorage.setItem("lab-mode", mode);
    } catch {}
  }, [mode]);

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    if (!section || !viewport) return;
    const s = sim.current;
    section.setAttribute("data-lab-enhanced", "");

    let raf = 0;
    let rowH = 68;
    let H = 640;

    const measure = () => {
      const vr = viewport.getBoundingClientRect();
      H = Math.max(420, vr.height);
      const first = itemRefs.current[0];
      const face = first?.querySelector<HTMLElement>(".lab__row-face");
      rowH = (face ? face.offsetHeight : 58) + 16;
    };

    const frame = () => {
      if (modeRef.current === "wheel") {
        s.pos += (s.target - s.pos) * 0.13;
        const centerY = H * 0.52 - rowH / 2;

        itemRefs.current.forEach((el, i) => {
          if (!el) return;
          const off = wrapHalf(i - s.pos, N);
          const angle = off * WHEEL_STEP;
          const lx = 42 - 9.5 * off * off;
          const ly = centerY + off * rowH * 0.96;
          const deg = (angle * 180) / Math.PI;
          const topFade = ly < 116 ? Math.max(0, (ly - 68) / 48) : 1;
          const bottomFade = ly > H - 155 ? Math.max(0, (H - 85 - ly) / 70) : 1;
          const distFade = Math.max(0, 1 - Math.abs(off) * 0.19);
          const op = Math.min(distFade, topFade, bottomFade);

          el.style.transform = `translate3d(${lx}px, ${ly}px, 0) rotate(${deg}deg)`;
          el.style.opacity = op.toFixed(3);
          el.style.pointerEvents = op > 0.12 ? "auto" : "none";
        });

        const nearest = wrap(Math.round(s.pos), N);
        if (nearest !== activeRef.current) {
          activeRef.current = nearest;
          setActive(nearest);
        }
      }
      raf = requestAnimationFrame(frame);
    };

    measure();
    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);

    const snap = () => {
      if (modeRef.current === "wheel") s.target = Math.round(s.target);
    };
    let snapTimer = 0;

    const onWheel = (e: WheelEvent) => {
      if (modeRef.current !== "wheel") return;
      const sideways = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!sideways) return;
      e.preventDefault();
      s.target += (e.deltaX || e.deltaY) / (rowH * 1.45);
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snap, 120);
    };

    let lastX = 0;
    let lastY = 0;
    const onDown = (e: PointerEvent) => {
      if (modeRef.current !== "wheel") return;
      if ((e.target as HTMLElement).closest(".lab__preview, .lab__mode")) return;
      s.dragging = true;
      s.moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      if (e.pointerType !== "touch") {
        try {
          viewport.setPointerCapture(e.pointerId);
        } catch {}
      }
      section.setAttribute("data-lab-dragging", "");
    };
    const onMove = (e: PointerEvent) => {
      if (!s.dragging || modeRef.current !== "wheel") return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const touch = e.pointerType === "touch";
      s.moved += Math.abs(dx) + Math.abs(dy);
      s.target -= (touch ? dx : dy) / rowH;
    };
    const onUp = (e: PointerEvent) => {
      if (!s.dragging) return;
      s.dragging = false;
      section.removeAttribute("data-lab-dragging");
      try {
        if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
      } catch {}
      snap();
    };
    const onKey = (e: KeyboardEvent) => {
      if (modeRef.current !== "wheel") return;
      const t = e.target instanceof Element ? e.target : null;
      if (t && t.closest("input, textarea, dialog")) return;
      if (document.documentElement.classList.contains("is-overlay")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        s.target = Math.round(s.target) + 1;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        s.target = Math.round(s.target) - 1;
      }
    };

    const onClickCapture = (e: MouseEvent) => {
      if (modeRef.current !== "wheel") return;
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>(".lab__item");
      if (!a) return;
      if (s.moved > 6) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const i = itemRefs.current.indexOf(a);
      if (i >= 0 && i !== activeRef.current) {
        e.preventDefault();
        e.stopPropagation();
        s.target = Math.round(s.pos) + wrapHalf(i - s.pos, N);
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

  const stepWheel = (dir: number) => {
    sim.current.target = Math.round(sim.current.target) + dir;
  };

  const current = items[active] ?? items[0];
  const scrambledTitle = useScrambleText(current.name, { durationMs: 360 });
  const scrambledIndex = useScrambleText(
    `${String(active + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}`,
    { durationMs: 260 },
  );

  const modes: Array<[LabViewMode, string]> = [
    ["list", "List"],
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
        data-lab-mode={mode}
        aria-label="Lab index: experiments and builds"
      >
        <div
          ref={viewportRef}
          className="lab__viewport"
          data-lab-viewport
          hidden={mode !== "wheel"}
        >
          <div className="lab__list" data-lab-list>
            {items.map((e, i) => (
              <Link
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
                  <span className="lab__num text-mono-sm">{String(i + 1).padStart(2, "0")}</span>
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
              </Link>
            ))}
          </div>

          <aside className="lab__preview" aria-label="Selected lab entry preview">
            <div className="lab__preview-bar text-mono-sm">
              <span>N°{scrambledIndex.displayText}</span>
              <span>{current.tag}</span>
            </div>
            <Link href={current.href} className="lab__preview-stage" aria-label={`Open ${current.name}`}>
              <OptionalPhoto src={current.photo} alt={`${current.name} screenshot`} width={640} height={400} className="project-photo">
                <LabMiniStage slug={current.slug} />
              </OptionalPhoto>
            </Link>
            <div className="lab__preview-foot">
              <div className="lab__preview-title-row">
                <strong className="text-h5">{scrambledTitle.displayText}</strong>
                <span className="chip text-meta chip--pill">{current.pill}</span>
              </div>
              <p className="lab__preview-summary text-body-sm u-muted">{current.summary}</p>
              <Link href={current.href} className="lab__preview-cta text-mono-sm">
                {current.kind === "experiment" ? "OPEN LIVE STAGE →" : "OPEN BUILD →"}
              </Link>
            </div>
          </aside>
        </div>

        {mode === "grid" ? (
          <div className="lab__grid-wrap" data-lab-grid>
            <div className="lab__grid-head">
              <p className="text-mono-sm u-muted">LAB::ARCHIVE · {N} ENTRIES · PROCEDURAL SCHEMATICS</p>
              <p className="text-body-sm u-muted">Experiments (01–04) animate on hover; builds display system blueprints.</p>
            </div>
            <div className="lab__grid">
              {items.map((e, i) => (
                <Link key={e.slug} href={e.href} className="lab__gcard">
                  <div className="lab__gcard-top text-mono-sm u-muted">
                    <span>N°{String(i + 1).padStart(2, "0")}</span>
                    <span>{e.pill}</span>
                  </div>
                  <div className="lab__gcard-media">
                    <OptionalPhoto src={e.photo} alt={`${e.name} screenshot`} width={640} height={400} className="project-photo">
                      <LabMiniStage slug={e.slug} interactive={false} />
                    </OptionalPhoto>
                  </div>
                  <div className="lab__gcard-body">
                    <h2 className="lab__gcard-title text-h5">{e.name}</h2>
                    <p className="lab__gcard-desc text-body-sm u-muted">{e.summary}</p>
                  </div>
                  <div className="lab__gcard-foot text-mono-sm">
                    <span>{e.tag}</span>
                    <span>{e.kind === "experiment" ? "STAGE →" : "OPEN →"}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {mode === "list" ? (
          <div className="lab__table-wrap" data-lab-table>
            <div className="lab__table-head text-mono-sm u-muted">
              <span>N°</span>
              <span>TITLE</span>
              <span>CATEGORY</span>
              <span>YEAR / TAG</span>
              <span className="u-right">ACTION</span>
            </div>
            <ul className="lab__table" role="list">
              {items.map((e, i) => (
                <li key={e.slug}>
                  <Link href={e.href} className="lab__trow">
                    <span className="lab__trow-num text-mono-sm u-muted">{String(i + 1).padStart(2, "0")}</span>
                    <span className="lab__trow-name text-h5">{e.name}</span>
                    <span className="lab__trow-tag text-mono-sm u-muted">{e.tag}</span>
                    <span className="lab__trow-pill text-mono-sm">
                      <span className="chip text-meta chip--pill">{e.pill}</span>
                      {e.year ? <span className="u-muted">{e.year}</span> : null}
                    </span>
                    <span className="lab__trow-go text-mono-sm">
                      {e.kind === "experiment" ? "STAGE →" : "OPEN →"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {mode === "wheel" && <p className="lab__wheel-hint mobile-wheel-hint text-mono-meta">↔ Swipe to browse projects</p>}
        <div className="lab__dock">
          {mode === "wheel" ? (
            <button
              type="button"
              className="lab__step text-mono-sm"
              onClick={() => stepWheel(-1)}
              aria-label="Previous project"
            >
              ‹
            </button>
          ) : null}
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
          {mode === "wheel" ? (
            <button
              type="button"
              className="lab__step text-mono-sm"
              onClick={() => stepWheel(1)}
              aria-label="Next project"
            >
              ›
            </button>
          ) : null}
        </div>
      </section>
    </>
  );
}
