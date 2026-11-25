"use client";

import { useEffect, useRef } from "react";

type ThemeBurstDetail = { x?: number; y?: number; resolved: "light" | "dark" };

export function dispatchThemeBurst(detail: ThemeBurstDetail) {
  window.dispatchEvent(new CustomEvent("kh:theme-burst", { detail }));
}

type Dot = { x: number; y: number; radius: number; pulses: boolean };
type Point = { x: number; y: number };
type Wave = Point & { start: number; reach: number };

const TRAIL_RADIUS = 22;
const TRAIL_DURATION = 300;
const WAVE_SPEED = 1.05;
const WAVE_HALF_WIDTH = 16;
const LEVELS = 24;

function paintDots(context: CanvasRenderingContext2D, dots: Dot[]) {
  context.beginPath();
  for (const { x, y, radius } of dots) {
    context.moveTo(x + radius, y);
    context.arc(x, y, radius, 0, Math.PI * 2);
  }
  context.fill();
}

export function GlobalDotField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const texture = document.createElement("canvas");
    const base = texture.getContext("2d");
    if (!base) return;

    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const waves: Wave[] = [];
    const trail = new Map<Dot, number>();
    let levels: Dot[][] = [];
    let dotRows: Dot[][] = [];
    let trailRows: Dot[][] = [];
    let pitch = 1;
    let rowHeight = 1;
    let width = 0;
    let height = 0;
    let frame = 0;
    let trailTimer = 0;
    let ink = "#e8e8e4";
    let lightTheme = false;
    let pointer: Point | undefined;

    function kick() {
      if (frame || document.hidden) return;
      clearTimeout(trailTimer);
      frame = requestAnimationFrame(draw);
    }

    function draw(now: number) {
      frame = 0;
      if (!ctx || document.hidden) return;
      for (let i = waves.length - 1; i >= 0; i--) {
        if ((now - waves[i].start) * WAVE_SPEED > waves[i].reach + WAVE_HALF_WIDTH) waves.splice(i, 1);
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(texture, 0, 0, width, height);
      ctx.fillStyle = lightTheme ? "#969694" : "#595959";
      for (const wave of waves) paintWave(ctx, wave, now);
      const lit: Dot[] = [];
      let nextExpiry = Infinity;
      for (const [dot, expiry] of trail) {
        if (expiry <= now) trail.delete(dot);
        else {
          lit.push(dot);
          nextExpiry = Math.min(expiry, nextExpiry);
        }
      }
      if (lit.length) paintDots(ctx, lit);
      if (waves.length) kick();
      else if (lit.length) trailTimer = window.setTimeout(kick, nextExpiry - now);
    }

    const idleInk = (index: number) => (lightTheme ? .009 : .006) + (lightTheme ? .062 : .044) * (index / LEVELS) ** 2.4;

    function paintWave(context: CanvasRenderingContext2D, wave: Wave, now: number) {
      const radius = Math.max(0, (now - wave.start) * WAVE_SPEED);
      const outer = radius + WAVE_HALF_WIDTH;
      const inner = Math.max(0, radius - WAVE_HALF_WIDTH);
      const firstRow = Math.max(0, Math.ceil((wave.y - outer) / rowHeight));
      const lastRow = Math.min(dotRows.length - 1, Math.floor((wave.y + outer) / rowHeight));
      const lit: Dot[] = [];

      for (let row = firstRow; row <= lastRow; row++) {
        const dots = dotRows[row];
        const dy = dots[0].y - wave.y;
        const extent = Math.sqrt(Math.max(0, outer ** 2 - dy ** 2));
        const firstCol = Math.max(0, Math.ceil((wave.x - extent - dots[0].x) / pitch));
        const lastCol = Math.min(dots.length - 1, Math.floor((wave.x + extent - dots[0].x) / pitch));
        for (let col = firstCol; col <= lastCol; col++) {
          const dot = dots[col];
          if (dot.pulses && (dot.x - wave.x) ** 2 + dy ** 2 >= inner ** 2) lit.push(dot);
        }
      }

      paintDots(context, lit);
    }

    function paintTheme() {
      if (!base) return;
      lightTheme = document.documentElement.dataset.theme === "light";
      ink = lightTheme ? "#1e1e1e" : "#e8e8e4";
      base.clearRect(0, 0, width, height);
      base.fillStyle = ink;
      levels.forEach((dots, index) => {
        base.globalAlpha = idleInk(index);
        paintDots(base, dots);
      });
      base.globalAlpha = 1;

      kick();
    }

    function resize() {
      if (!canvas || !ctx || !base) return;
      width = document.documentElement.clientWidth;
      height = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      for (const buffer of [canvas, texture]) {
        buffer.width = Math.round(width * dpr);
        buffer.height = Math.round(height * dpr);
      }
      for (const context of [ctx, base]) context.setTransform(dpr, 0, 0, dpr, 0, 0);
      pitch = Math.max(8.5, Math.sqrt(width * height / (100_000 * .5)));
      rowHeight = pitch * .5;
      const cols = Math.ceil(width / pitch) + 1;
      const rows = Math.ceil(height / rowHeight) + 1;
      levels = Array.from({ length: LEVELS + 1 }, () => []);
      dotRows = Array.from({ length: rows }, () => []);
      trailRows = Array.from({ length: rows }, () => []);
      pointer = undefined;
      trail.clear();

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const seed = Math.imul(Math.imul(col + 103, 19349663) ^ Math.imul(row + 271, 83492791), 0x85ebca6b) >>> 0;
          const grain = (seed & 255) / 255;
          const u = col / Math.max(1, cols - 1);
          const v = row / Math.max(1, rows - 1);
          const band = .5 + .5 * Math.sin(10 * u - 7 * v + 1.8 * Math.sin(5 * v));
          const falloff = 1 - Math.min(1, Math.hypot(u - .58, v - .42));
          const cluster = Math.imul(Math.imul((col >> 1) + 17, 374761393) ^ Math.imul((row >> 1) + 31, 668265263), 1274126177);
          const dot = {
            x: (col + row % 2 * .5) * pitch,
            y: row * rowHeight,
            radius: pitch * .27,
            pulses: ((seed >>> 12) & 255) < 51,
          };
          const shade = Math.round((band * .62 + falloff * .26 + grain * .12) * LEVELS);
          levels[shade].push(dot);
          dotRows[row].push(dot);
          if ((cluster >>> 24) < 18) trailRows[row].push(dot);
        }
      }
      paintTheme();
    }

    function move(event: PointerEvent) {
      if (motion.matches || document.hidden || event.pointerType === "touch") return;
      const from = pointer;
      const to = { x: event.clientX, y: event.clientY };
      pointer = to;
      if (!from) return;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const lengthSquared = dx * dx + dy * dy;
      if (!lengthSquared) return;
      const firstRow = Math.max(0, Math.ceil((Math.min(from.y, to.y) - TRAIL_RADIUS) / rowHeight));
      const lastRow = Math.min(trailRows.length - 1, Math.floor((Math.max(from.y, to.y) + TRAIL_RADIUS) / rowHeight));
      const left = Math.min(from.x, to.x) - TRAIL_RADIUS;
      const right = Math.max(from.x, to.x) + TRAIL_RADIUS;
      const expiry = performance.now() + TRAIL_DURATION;
      for (let row = firstRow; row <= lastRow; row++) {
        for (const dot of trailRows[row]) {
          if (dot.x < left) continue;
          if (dot.x > right) break;
          const x = dot.x - from.x;
          const y = dot.y - from.y;
          const t = Math.max(0, Math.min(1, (x * dx + y * dy) / lengthSquared));
          if ((x - t * dx) ** 2 + (y - t * dy) ** 2 <= TRAIL_RADIUS ** 2) trail.set(dot, expiry);
        }
      }
      kick();
    }

    const leave = () => {
      pointer = undefined;
    };

    function launchWave(x: number, y: number) {
      if (motion.matches || document.hidden) return;
      if (waves.length === 3) waves.shift();
      const reach = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
      waves.push({ x, y, start: performance.now(), reach });
      kick();
    }

    const down = (event: PointerEvent) => {
      if (event.button === 0) launchWave(event.clientX, event.clientY);
    };

    const themeBurst = (event: Event) => {
      const { x, y } = (event as CustomEvent<ThemeBurstDetail>).detail;
      if (waves.some((wave) => performance.now() - wave.start < 120 && Math.hypot(wave.x - (x ?? 0), wave.y - (y ?? 0)) < 16)) return;
      launchWave(x ?? width * .85, y ?? 52);
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      clearTimeout(trailTimer);
      frame = 0;
      pointer = undefined;
      waves.length = 0;
      trail.clear();
      kick();
    };

    const theme = new MutationObserver(paintTheme);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true, capture: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down, { passive: true, capture: true });
    window.addEventListener("kh:theme-burst", themeBurst);
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", stop);
    motion.addEventListener("change", stop);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(trailTimer);
      theme.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move, true);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("kh:theme-burst", themeBurst);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", stop);
      motion.removeEventListener("change", stop);
    };
  }, []);

  return (
    <>
      <div className="global-paper" aria-hidden="true" />
      <canvas ref={ref} className="global-dots" aria-hidden="true" />
    </>
  );
}
