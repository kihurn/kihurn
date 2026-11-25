"use client";

import { useEffect, useRef, useState } from "react";
import { computeScrambledFrame, DEFAULT_SCRAMBLE_GLYPHS } from "@/lib/scramble";

export interface UseScrambleTextOptions {
  durationMs?: number;
  intervalMs?: number;
  glyphs?: string;
  animateOnMount?: boolean;
}

export function useScrambleText(
  targetText: string,
  options: UseScrambleTextOptions = {},
): { displayText: string; isScrambling: boolean } {
  const {
    durationMs = 420,
    intervalMs = 34,
    glyphs = DEFAULT_SCRAMBLE_GLYPHS,
    animateOnMount = false,
  } = options;

  const [displayText, setDisplayText] = useState(targetText);
  const [isScrambling, setIsScrambling] = useState(false);
  const firstRunRef = useRef(true);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const skip = reduced || (firstRunRef.current && !animateOnMount);
    firstRunRef.current = false;

    let raf = 0;
    if (skip) {
      raf = requestAnimationFrame(() => {
        setDisplayText(targetText);
        setIsScrambling(false);
      });
      return () => cancelAnimationFrame(raf);
    }

    const start = performance.now();
    let lastTick = -1;

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / Math.max(1, durationMs));
      const tick = Math.floor(elapsed / Math.max(16, intervalMs));

      if (tick === 0 && lastTick === -1) {
        setIsScrambling(true);
      }

      if (tick !== lastTick || progress >= 1) {
        lastTick = tick;
        setDisplayText(computeScrambledFrame(targetText, progress, tick, glyphs));
      }

      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setDisplayText(targetText);
        setIsScrambling(false);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [targetText, durationMs, intervalMs, glyphs, animateOnMount]);

  return { displayText, isScrambling };
}
