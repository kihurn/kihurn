"use client";

import { Fragment, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useScrambleText } from "@/hooks/useScrambleText";
import { wrapIndex, wheelStepDirection } from "@/lib/wheelMath";
import { PressWheelCanvas, type WheelSimState } from "./PressWheelCanvas";

export interface WheelItem {
  slug: string;
  name: string;
  tag: string;
  lens: string;
  role?: string;
  year?: string;
  detail: string;
  href: string;
  photo?: string;
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const PROJECT_LINK_LABEL = "View project";

function ScrambledLabel({ label, displayText, roll = false }: {
  label: string;
  displayText: string;
  roll?: boolean;
}) {
  return (
    <span className={roll ? "btn__label roll hv2__scramble-label" : "hv2__scramble-label"}>
      <span className="hv2__scramble-original">{label}</span>
      <span className="hv2__scramble-value" aria-hidden="true">{displayText}</span>
    </span>
  );
}

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

  const stage = useRef<HTMLElement>(null);
  const center = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const hitPlate = useRef<((x: number, y: number) => boolean) | null>(null);
  const activeRef = useRef(0);
  const lastInput = useRef(0);
  const onScreen = useRef(false);
  const orbitInputUntil = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [focused, setFocused] = useState(false);
  const glSimRef = useRef<WheelSimState>({
    pos: 0,
    vel: 0,
    pointerX: 0.5,
    pointerY: 0.5,
    pointerVelX: 0,
    pointerVelY: 0,
    pointerActive: false,
    dragging: false,
    stacked: false,
    settled: true,
    pull: 1,
    selected: 0,
    focused: false,
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
  const changeFocus = useCallback((next: boolean) => {
    if (glSimRef.current.focused === next) return;
    glSimRef.current.focused = next;
    lastInput.current = performance.now();
    setFocused(next);
  }, []);

  const beginOrbit = useCallback(() => {
    const now = performance.now();
    lastInput.current = now;
    orbitInputUntil.current = now + 150;
    changeFocus(false);
  }, [changeFocus]);

  const canRefresh = useCallback(() => {
    const gl = glSimRef.current;
    return onScreen.current && !document.hidden && gl.settled && !gl.focused
      && !sim.current.dragging && performance.now() - lastInput.current > 220;
  }, []);

  useEffect(() => {
    if (showList) return;
    const el = stage.current;
    if (!el) return;
    const s = sim.current;
    const glSim = glSimRef.current;
    const noteInput = () => { lastInput.current = performance.now(); };
    noteInput();
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
      glSim.stacked = stacked;
    };

    let lastFrame = performance.now();
    const frame = (now: number) => {
      const dt = Math.max(0.001, Math.min(0.05, (now - lastFrame) / 1000));
      lastFrame = now;
      const dragging = s.dragging && s.moved > 6;
      const atRest = !dragging && now >= orbitInputUntil.current && Math.abs(s.target - s.pos) < 0.008;
      const tuck = glSim.pull > 0 && !atRest;
      const previous = s.pos;
      if (!tuck) {
        s.pos += (s.target - s.pos) * (1 - Math.pow(0.89, dt * 60));
      }
      const speed = (s.pos - previous) / dt;
      glSim.settled = atRest && Math.abs(speed) < 0.07;
      if (glSim.settled) {
        s.pos = s.target;
        glSim.selected = wrapIndex(Math.round(s.pos), N);
      }
      const pullTarget = Number(glSim.settled);
      glSim.pull += (pullTarget - glSim.pull) * (1 - Math.exp(-dt * (pullTarget ? 12 : 32)));
      if (Math.abs(glSim.pull - pullTarget) < 0.018) glSim.pull = pullTarget;
      s.pvx *= Math.pow(0.88, dt * 60);
      s.pvy *= Math.pow(0.88, dt * 60);

      glSim.pos = s.pos;
      glSim.vel = speed / 60;
      glSim.dragging = dragging;
      glSim.pointerX = s.px;
      glSim.pointerY = s.py;
      glSim.pointerVelX = s.pvx;
      glSim.pointerVelY = s.pvy;

      const nearest = wrapIndex(Math.round(s.pos), N);
      if (nearest !== activeRef.current) {
        activeRef.current = nearest;
        noteInput();
        setActive(nearest);
      }
      raf = requestAnimationFrame(frame);
    };

    measure();
    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const observer = new IntersectionObserver(([entry]) => {
      onScreen.current = entry.intersectionRatio >= 0.55;
      noteInput();
    }, { threshold: 0.55 });
    observer.observe(el);
    let lastRefresh = 0;
    const idleTimer = window.setInterval(() => {
      const now = performance.now();
      if (canRefresh() && now - Math.max(lastRefresh, lastInput.current) >= 4500) {
        lastRefresh = now;
        setRefreshKey((key) => key + 1);
      }
    }, 100);

    const rowPx = () => Math.max(120, H * 0.28);
    let snapTimer = 0;
    const snap = () => {
      s.target = Math.round(s.target);
    };
    const hide = () => setHint(false);

    const onWheel = (e: WheelEvent) => {
      beginOrbit();
      const sideways = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!sideways) return;
      e.preventDefault();
      s.target += (e.deltaX || e.deltaY) / (rowPx() * 2.4);
      hide();
      clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snap, 140);
    };

    const onDown = (e: PointerEvent) => {
      noteInput();
      s.moved = 0;
      if (e.button !== 0 || !e.isPrimary) return;
      if ((e.target as HTMLElement).closest("a, button")) return;
      s.dragging = true;
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
    };

    const onMove = (e: PointerEvent) => {
      noteInput();
      glSim.pointerActive = e.pointerType !== "touch" && !(e.target as HTMLElement).closest("a, button");
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / Math.max(1, r.width);
      const ny = 1 - (e.clientY - r.top) / Math.max(1, r.height);
      s.pvx = THREE_CLAMP(nx - s.px, -0.18, 0.18);
      s.pvy = THREE_CLAMP(ny - s.py, -0.18, 0.18);
      s.px = nx;
      s.py = ny;

      if (!s.dragging) return;
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      const now = performance.now();
      s.lastY = e.clientY;
      s.lastX = e.clientX;
      s.moved += Math.hypot(dx, dy);
      if (s.moved <= 6) return;
      beginOrbit();
      el.classList.add("is-grabbing");
      const d = -(s.touch ? dx : dy) / rowPx();
      s.target += d;
      s.vel = (d / Math.max(1, now - s.lastT)) * 16;
      s.lastT = now;
      hide();
    };

    const onUp = (e: PointerEvent) => {
      if (!s.dragging) return;
      s.dragging = false;
      glSim.dragging = false;
      noteInput();
      el.classList.remove("is-grabbing");
      if (!s.touch) {
        try {
          if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
        } catch {}
      }
      if (s.moved > 6) s.target += s.vel * 8;
      s.vel = 0;
      snap();
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (s.moved > 6 || target?.closest("a, button")) return;
      if (glSim.focused) changeFocus(false);
      else if (glSim.settled && hitPlate.current?.(e.clientX, e.clientY)) changeFocus(true);
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (t && (t.closest("input, textarea, dialog") || document.documentElement.classList.contains("is-overlay"))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape" && glSim.focused) {
        e.preventDefault();
        changeFocus(false);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        beginOrbit();
        s.target = Math.round(s.target) + 1;
        hide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        beginOrbit();
        s.target = Math.round(s.target) - 1;
        hide();
      } else if (e.key === "Enter" && document.activeElement === el) {
        window.location.assign(items[activeRef.current].href);
      }
    };

    const onLeave = () => {
      glSim.pointerActive = false;
      noteInput();
    };
    const onScroll = () => {
      onLeave();
      beginOrbit();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(snapTimer);
      window.clearInterval(idleTimer);
      ro.disconnect();
      observer.disconnect();
      onScreen.current = false;
      glSim.pointerActive = false;
      glSim.dragging = false;
      s.dragging = false;
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onLeave);
    };
  }, [showList, N, items, canRefresh, changeFocus, beginOrbit]);

  const p = items[active];
  const idle = { refreshKey, canRefresh, refreshDurationMs: 520 };
  const indexLabel = `N°${pad2(active + 1)} / ${pad2(N)}`;
  const { displayText: scrambledIndex } = useScrambleText(indexLabel, {
    durationMs: 320,
    intervalMs: 28,
    ...idle,
  });
  const { displayText: scrambledTitle } = useScrambleText(p.name, {
    durationMs: 350,
    intervalMs: 32,
    glyphs: "aeimnorstuwACENORSTU023",
    ...idle,
  });
  const titleWords = scrambledTitle.split(" ");
  const meta = [p.role, p.year].filter(Boolean).join(" — ") || p.detail;
  const { displayText: scrambledMeta } = useScrambleText(meta, {
    durationMs: 350,
    intervalMs: 30,
    ...idle,
  });
  const labelMotion = { durationMs: 350, intervalMs: 30, ...idle };
  const { displayText: scrambledTag } = useScrambleText(p.tag, labelMotion);
  const { displayText: scrambledLens } = useScrambleText(p.lens, labelMotion);
  const { displayText: scrambledLink } = useScrambleText(PROJECT_LINK_LABEL, {
    ...labelMotion,
    glyphs: "aeimnorstuwACENORSTU023",
  });

  const stepTo = (idx: number) => {
    beginOrbit();
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
          data-state={focused ? "inspect" : "rest"}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label="Selected work, two linked Three.js wheels. Drag to turn, left and right arrow keys browse, the center link opens the project."
        >
          <div ref={shade} className="hv2__shade" aria-hidden="true" />
          <PressWheelCanvas items={items} simRef={glSimRef} centerRef={center} shadeRef={shade} hitPlateRef={hitPlate} />

          <div ref={center} className="hv2__center" data-wheels-center>
            <p className="hv2__eyebrow text-label u-mono" aria-label={`Project ${active + 1} of ${N}`}>
              <ScrambledLabel label={indexLabel} displayText={scrambledIndex} />
            </p>
            <p className="hv2__title">
              <span className="u-sr-only">{p.name}</span>
              <span aria-hidden="true">
                {p.name.split(" ").map((word, index) => (
                  <Fragment key={`${word}-${index}`}>
                    {index > 0 ? " " : null}
                    <span className="hv2__title-word">
                      <span>{word}</span>
                      <span>{titleWords[index]}</span>
                    </span>
                  </Fragment>
                ))}
              </span>
            </p>
            <div className="hv2__chips">
              <span className="chip text-meta"><ScrambledLabel label={p.tag} displayText={scrambledTag} /></span>
              <span className="chip text-meta chip--pill"><ScrambledLabel label={p.lens} displayText={scrambledLens} /></span>
            </div>
            <p className="hv2__meta text-mono-sm u-muted">
              <span className="u-sr-only">{meta}</span>
              <span aria-hidden="true">{scrambledMeta}</span>
            </p>
            <div className="hv2__ctarow">
              <a href={p.href} className="btn btn--solid text-tag">
                <ScrambledLabel label={PROJECT_LINK_LABEL} displayText={scrambledLink} roll />
              </a>
            </div>
            {hint && <p className="mobile-wheel-hint text-mono-meta">↔ Swipe to browse projects</p>}
          </div>

          <button
            type="button"
            className="chip text-mono-sm hv2__toolbtn hv2__inspect-key"
            aria-pressed={focused}
            onClick={() => {
              if (focused || glSimRef.current.settled) changeFocus(!focused);
            }}
          >
            Inspect project screen
          </button>

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
                changeFocus(false);
                const target = document.getElementById("home-index");
                if (target) {
                  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
                } else {
                  setViewMode("list");
                }
              }}
            >
              INDEX ↓
            </button>
          </div>

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
