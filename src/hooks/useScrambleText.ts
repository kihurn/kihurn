"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { computeScrambledFrame, DEFAULT_SCRAMBLE_GLYPHS } from "@/lib/scramble";

export interface UseScrambleTextOptions {
  durationMs?: number;
  intervalMs?: number;
  glyphs?: string;
  animateOnMount?: boolean;
  refreshKey?: number;
  refreshDurationMs?: number;
  canRefresh?: () => boolean;
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
    refreshKey = 0,
    refreshDurationMs = durationMs,
    canRefresh,
  } = options;

  const [frame, setFrame] = useState({ target: targetText, text: targetText, running: false });
  const firstRunRef = useRef(true);
  const previous = useRef({ targetText, refreshKey });

  useLayoutEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const skip = reduced || (firstRunRef.current && !animateOnMount);
    const refreshing = previous.current.targetText === targetText && previous.current.refreshKey !== refreshKey;
    previous.current = { targetText, refreshKey };
    firstRunRef.current = false;

    if (skip) return;

    const duration = Math.max(1, refreshing ? refreshDurationMs : durationMs);
    const frameInterval = Math.max(16, intervalMs * (duration / Math.max(1, durationMs)));
    const start = performance.now();
    let raf = 0;
    let cancelled = false;
    let lastTick = -1;

    const step = (now: number) => {
      if (cancelled) return;
      if (refreshing && canRefresh && !canRefresh()) {
        setFrame({ target: targetText, text: targetText, running: false });
        return;
      }
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const tick = Math.floor(elapsed / frameInterval);

      if (tick !== lastTick || progress >= 1) {
        lastTick = tick;
        const text = progress < 1 ? computeScrambledFrame(targetText, progress, tick, glyphs) : targetText;
        setFrame({ target: targetText, text, running: progress < 1 });
      }

      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [targetText, durationMs, intervalMs, glyphs, animateOnMount, refreshKey, refreshDurationMs, canRefresh]);

  return frame.target === targetText
    ? { displayText: frame.text, isScrambling: frame.running }
    : { displayText: targetText, isScrambling: false };
}
