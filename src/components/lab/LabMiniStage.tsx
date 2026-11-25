"use client";

import { useEffect, useRef } from "react";
import { drawMiniExperimentFrame } from "@/lib/labSchematics";

export function LabMiniStage({
  slug,
  interactive = true,
  className = "",
}: {
  slug: string;
  interactive?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 320;
    let height = 240;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let hovered = false;
    const pointer = { x: width * 0.5, y: height * 0.5 };
    let t = 0.7;

    const renderOnce = () => {
      const dark = document.documentElement.dataset.theme === "dark";
      const px = hovered ? pointer.x : width * 0.5 + Math.cos(t * 0.75) * width * 0.16;
      const py = hovered ? pointer.y : height * 0.5 + Math.sin(t * 1.05) * height * 0.14;
      drawMiniExperimentFrame(ctx, slug, width, height, t, px, py, dark);
    };

    const measure = () => {
      const r = canvas.getBoundingClientRect();
      width = Math.max(160, Math.round(r.width));
      height = Math.max(120, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!hovered) {
        pointer.x = width * 0.5;
        pointer.y = height * 0.5;
      }
      renderOnce();
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);

    let raf = 0;
    let timer = 0;
    let stopped = false;

    const scheduleNext = () => {
      if (stopped || reduced || (!interactive && !hovered)) return;
      timer = window.setTimeout(() => {
        if (stopped) return;
        raf = requestAnimationFrame(loop);
      }, interactive ? 32 : 48);
    };

    const loop = () => {
      if (stopped) return;
      t += 0.045;
      renderOnce();
      scheduleNext();
    };

    renderOnce();
    if (interactive && !reduced) {
      scheduleNext();
    }

    const mo = new MutationObserver(renderOnce);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const onEnter = () => {
      hovered = true;
      if (!interactive && !reduced) {
        clearTimeout(timer);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      if (reduced || (!interactive && !hovered)) renderOnce();
    };
    const onLeave = () => {
      hovered = false;
      pointer.x = width * 0.5;
      pointer.y = height * 0.5;
      if (!interactive) {
        clearTimeout(timer);
        cancelAnimationFrame(raf);
        renderOnce();
      }
    };

    canvas.addEventListener("pointerenter", onEnter);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    return () => {
      stopped = true;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      canvas.removeEventListener("pointerenter", onEnter);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [slug, interactive]);

  return <canvas ref={canvasRef} className={className ? `lab-mini-canvas ${className}` : "lab-mini-canvas"} aria-hidden="true" />;
}
