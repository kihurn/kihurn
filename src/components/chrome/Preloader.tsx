"use client";

import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "kh:preloaded";

function shouldShowPreloader(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (new URLSearchParams(window.location.search).get("autostart") === "1") return false;

  const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  const isReload = navEntries[0]?.type === "reload";
  if (isReload) return true;

  try {
    return sessionStorage.getItem(SESSION_KEY) !== "1";
  } catch {
    return true;
  }
}

/**
 * Initial dark textured-paper preloader (0 -> 100) with bottom-left KH stamp pill,
 * bottom-center slim progress bar, and bottom-right bold tabular counter.
 */
export function Preloader() {
  const [phase, setPhase] = useState<"boot" | "fading" | "done">("boot");
  const counterRef = useRef<HTMLSpanElement>(null);
  const barFillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = document.documentElement;

    if (!shouldShowPreloader()) {
      delete root.dataset.preloader;
      root.dataset.preloaded = "true";
      const raf = requestAnimationFrame(() => setPhase("done"));
      return () => cancelAnimationFrame(raf);
    }

    root.dataset.preloader = "active";
    let raf = 0;
    let fadeTimer = 0;
    const duration = 980;
    const start = performance.now();

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const pct = Math.round(easeOutQuart(t) * 100);

      if (counterRef.current) {
        counterRef.current.textContent = String(pct);
      }
      if (barFillRef.current) {
        barFillRef.current.style.transform = `scaleX(${(pct / 100).toFixed(4)})`;
      }

      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {}
        setPhase("fading");
        fadeTimer = window.setTimeout(() => {
          delete root.dataset.preloader;
          root.dataset.preloaded = "true";
          setPhase("done");
        }, 420);
      }
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fadeTimer);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={`preloader ${phase === "fading" ? "is-leaving" : ""}`}
      data-preloader-overlay
      aria-hidden={phase === "fading"}
      role="status"
      aria-label="Loading portfolio"
    >
      <div className="preloader__grain" aria-hidden="true" />
      <div className="preloader__bottom">
        <div className="preloader__stamp-wrap">
          <span className="preloader__stamp text-mono-tag">KH</span>
          <span className="preloader__loc text-hud u-muted">KL · SUBANG JAYA</span>
        </div>

        <div className="preloader__track-wrap" aria-hidden="true">
          <div className="preloader__track">
            <span className="preloader__fill" ref={barFillRef} />
          </div>
          <div className="preloader__ticks">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="preloader__count-wrap">
          <span className="preloader__count u-tabular" ref={counterRef}>
            0
          </span>
        </div>
      </div>
    </div>
  );
}
