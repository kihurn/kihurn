"use client";

import { useEffect, useRef } from "react";
import { subscribeScroll } from "@/lib/telemetry";

const R = 16;
const CIRC = 2 * Math.PI * R;

/**
 * Slim right-edge scroll indicator that smoothly expands into an analog/radial
 * scroll-progress dial while actively scrolling. Zero React state updates.
 */
export function ScrollDial() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackFillRef = useRef<HTMLSpanElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  const needleRef = useRef<SVGLineElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    return subscribeScroll((progress, scrolling) => {
      const root = rootRef.current;
      if (!root) return;
      const hasScroll = document.documentElement.scrollHeight > window.innerHeight + 24;
      root.toggleAttribute("data-hidden", !hasScroll);
      root.toggleAttribute("data-active", scrolling);

      if (trackFillRef.current) {
        trackFillRef.current.style.transform = `scaleY(${progress})`;
      }
      if (arcRef.current) {
        arcRef.current.style.strokeDashoffset = `${CIRC * (1 - progress)}`;
      }
      if (needleRef.current) {
        needleRef.current.style.transform = `rotate(${progress * 360}deg)`;
      }
      if (pctRef.current) {
        pctRef.current.textContent = String(Math.round(progress * 100)).padStart(2, "0");
      }
    });
  }, []);

  return (
    <div className="scrolldial" ref={rootRef} data-progress aria-hidden="true">
      <div className="scrolldial__rail">
        <span className="scrolldial__fill" ref={trackFillRef} />
      </div>
      <div className="scrolldial__dial">
        <svg className="scrolldial__svg" viewBox="0 0 40 40" width="40" height="40">
          <circle className="scrolldial__ring" cx="20" cy="20" r={R} fill="none" strokeWidth="1.25" />
          <circle
            ref={arcRef}
            className="scrolldial__arc"
            cx="20"
            cy="20"
            r={R}
            fill="none"
            strokeWidth="1.5"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC}
            transform="rotate(-90 20 20)"
          />
          <line
            ref={needleRef}
            className="scrolldial__needle"
            x1="20"
            y1="20"
            x2="20"
            y2="7"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>
        <span className="scrolldial__pct text-hud" ref={pctRef}>00</span>
      </div>
    </div>
  );
}
