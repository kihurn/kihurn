"use client";

import { useEffect } from "react";
import { isMouseWheel } from "@/lib/scrollInput";

function scrollContainer(target: EventTarget | null) {
  const root = document.documentElement;
  if (!(target instanceof Element)) return null;
  if (target.closest("select, textarea, input, [contenteditable='true']")) return null;

  for (let node: Element | null = target; node && node !== root; node = node.parentElement) {
    if (node.scrollHeight - node.clientHeight > 1 && /^(auto|scroll)$/.test(getComputedStyle(node).overflowY)) return node;
    if (node.matches("dialog, [role='dialog']")) return null;
  }

  if (root.matches(".is-overlay, [data-preloader=active], :has(dialog[open], .shelf[data-mode=wheel])")) return null;
  return document.scrollingElement;
}

export function WheelScroll() {
  useEffect(() => {
    const motion = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    const listeners = new AbortController();
    const { signal } = listeners;
    let frame = 0;
    let active: { node: Element; goal: number; direction: number } | null = null;

    const cancel = () => {
      cancelAnimationFrame(frame);
      active = null;
    };

    const onWheel = (event: WheelEvent) => {
      const mode = event.deltaMode;
      const { deltaX, deltaY } = event;
      if (!motion.matches || event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey ||
          event.shiftKey || event.altKey || !deltaY || Math.abs(deltaX) >= Math.abs(deltaY) || !isMouseWheel(event, deltaY)) {
        cancel();
        return;
      }

      const node = scrollContainer(event.target);
      if (!node) { cancel(); return; }
      const from = node.scrollTop;
      const direction = Math.sign(deltaY);
      const max = Math.max(0, node.scrollHeight - node.clientHeight);
      const amount = deltaY * (mode === WheelEvent.DOM_DELTA_LINE ? 16 : mode === WheelEvent.DOM_DELTA_PAGE ? node.clientHeight : 1);
      const base = active?.node === node && active.direction === direction ? active.goal : from;
      const goal = Math.max(0, Math.min(max, base + amount));
      cancel();
      if (Math.abs(goal - from) < 1) return;

      event.preventDefault();
      active = { node, goal, direction };
      const start = performance.now();
      const href = location.href;
      let last = from;
      const advance = (now: number) => {
        if (!node.isConnected || location.href !== href || Math.abs(node.scrollTop - last) > 1 || !motion.matches) {
          cancel();
          return;
        }
        const progress = Math.min(1, (now - start) / 220);
        node.scrollTo({ top: from + (goal - from) * (1 - Math.pow(1 - progress, 3)), behavior: "instant" });
        last = node.scrollTop;
        if (progress < 1) frame = requestAnimationFrame(advance);
        else active = null;
      };
      frame = requestAnimationFrame(advance);
    };

    window.addEventListener("wheel", onWheel, { passive: false, signal });
    window.addEventListener("pointerdown", cancel, { passive: true, signal });
    window.addEventListener("keydown", cancel, { signal });
    return () => { listeners.abort(); cancel(); };
  }, []);

  return null;
}
