"use client";

import { useEffect, useRef } from "react";

type ThemeBurstDetail = { x?: number; y?: number; resolved: "light" | "dark" };

export function dispatchThemeBurst(detail: ThemeBurstDetail) {
  window.dispatchEvent(new CustomEvent("kh:theme-burst", { detail }));
}

type Dot = { x: number; y: number; radius: number; shade: number; glows: boolean };
type Point = { x: number; y: number };
type Sample = { x: number; y: number; start: number };
type Wave = Sample & { reach: number };

const HOVER_RADIUS = 112;
const HOVER_EASE_MS = 38;
const WAVE_SPEED = 1.05;
const WAVE_WIDTH = 124;
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
    const allMask = document.createElement("canvas");
    const lighting = document.createElement("canvas");
    const base = texture.getContext("2d");
    const all = allMask.getContext("2d");
    const light = lighting.getContext("2d");
    if (!base || !all || !light) return;

    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const waves: Wave[] = [];
    const hoverLevels: Dot[][] = Array.from({ length: LEVELS + 1 }, () => []);
    const glowLevels: Dot[][] = Array.from({ length: LEVELS + 1 }, () => []);
    let levels: Dot[][] = [];
    let dotRows: Dot[][] = [];
    let pitch = 1;
    let rowHeight = 1;
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastFrame = 0;
    let ink = "#e8e8e4";
    let lightTheme = false;
    let pointer: Point | undefined;
    let hover: Point = { x: 0, y: 0 };
    let hoverStrength = 0;

    function kick() {
      if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
    }

    function draw(now: number) {
      frame = 0;
      if (!ctx || !light || document.hidden) return;
      const dt = lastFrame ? Math.min(32, Math.max(0, now - lastFrame)) : 16;
      lastFrame = now;
      for (let i = waves.length - 1; i >= 0; i--) {
        if ((now - waves[i].start) * WAVE_SPEED > waves[i].reach + WAVE_WIDTH) waves.splice(i, 1);
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(texture, 0, 0, width, height);
      const blend = 1 - Math.exp(-dt / HOVER_EASE_MS);
      const targetStrength = pointer ? 1 : 0;
      hoverStrength += (targetStrength - hoverStrength) * blend;
      const fading = Math.abs(targetStrength - hoverStrength) > .005;
      if (!fading) hoverStrength = targetStrength;
      if (pointer) {
        hover.x += (pointer.x - hover.x) * blend;
        hover.y += (pointer.y - hover.y) * blend;
      }
      const tracking = !!pointer && Math.hypot(pointer.x - hover.x, pointer.y - hover.y) > .2;
      if (hoverStrength) paintHover(ctx);
      if (waves.length) {
        light.clearRect(0, 0, width, height);
        for (const wave of waves) {
          const radius = Math.max(0, (now - wave.start) * WAVE_SPEED);
          const outer = radius + WAVE_WIDTH;
          const inner = Math.max(0, radius - WAVE_WIDTH);
          const crest = (radius - inner) / (outer - inner);
          const strength = Math.min(1, radius / 75) * (1 - .3 * Math.min(1, radius / wave.reach));
          const ring = light.createRadialGradient(wave.x, wave.y, inner, wave.x, wave.y, outer);
          ring.addColorStop(0, "transparent");
          ring.addColorStop(crest * .56, `${ink}36`);
          ring.addColorStop(crest, `${ink}ba`);
          ring.addColorStop(crest + (1 - crest) * .48, `${ink}55`);
          ring.addColorStop(1, "transparent");
          light.globalAlpha = strength;
          light.fillStyle = ring;
          light.fillRect(wave.x - outer, wave.y - outer, 2 * outer, 2 * outer);
        }
        light.globalAlpha = 1;
        light.globalCompositeOperation = "destination-in";
        light.drawImage(allMask, 0, 0, width, height);
        light.globalCompositeOperation = "source-over";
        ctx.drawImage(lighting, 0, 0, width, height);
      }
      if (fading || tracking || waves.length) kick();
      else lastFrame = 0;
    }

    const idleInk = (index: number) => (lightTheme ? .009 : .006) + (lightTheme ? .062 : .044) * (index / LEVELS) ** 2.4;

    function paintHover(context: CanvasRenderingContext2D) {
      const { x, y } = hover;
      const left = Math.floor(x - HOVER_RADIUS);
      const top = Math.floor(y - HOVER_RADIUS);
      const size = HOVER_RADIUS * 2 + 1;
      const firstRow = Math.max(0, Math.floor(top / rowHeight) - 1);
      const lastRow = Math.min(dotRows.length - 1, Math.ceil((top + size) / rowHeight) + 1);
      const firstCol = Math.max(0, Math.floor(left / pitch) - 1);
      for (const bucket of hoverLevels) bucket.length = 0;
      for (const bucket of glowLevels) bucket.length = 0;

      for (let row = firstRow; row <= lastRow; row++) {
        const dots = dotRows[row];
        const lastCol = Math.min(dots.length - 1, Math.ceil((left + size) / pitch) + 1);
        for (let col = firstCol; col <= lastCol; col++) {
          const dot = dots[col];
          const dx = dot.x - x;
          const dy = dot.y - y;
          const falloff = Math.max(0, 1 - Math.hypot(dx, dy) / HOVER_RADIUS);
          const bend = hoverStrength * falloff ** 2 * (19 / HOVER_RADIUS);
          const shifted = falloff ? { ...dot, x: dot.x + dx * bend, y: dot.y + dy * bend } : dot;
          hoverLevels[dot.shade].push(shifted);
          if (dot.glows) {
            const glow = Math.round(LEVELS * .34 * hoverStrength * falloff ** 1.45);
            if (glow) glowLevels[glow].push(shifted);
          }
        }
      }

      context.save();
      context.beginPath();
      context.rect(left, top, size, size);
      context.clip();
      context.clearRect(left, top, size, size);
      context.fillStyle = ink;
      hoverLevels.forEach((dots, index) => {
        context.globalAlpha = idleInk(index);
        paintDots(context, dots);
      });
      glowLevels.forEach((dots, index) => {
        if (!dots.length) return;
        context.globalAlpha = index / LEVELS;
        paintDots(context, dots);
      });
      context.restore();
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
      if (!canvas || !ctx || !base || !all || !light) return;
      width = document.documentElement.clientWidth;
      height = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      for (const buffer of [canvas, texture, allMask, lighting]) {
        buffer.width = Math.round(width * dpr);
        buffer.height = Math.round(height * dpr);
      }
      for (const context of [ctx, base, all, light]) context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const allDots: Dot[] = [];
      pitch = Math.max(4.8, Math.sqrt(width * height / (65_000 * .866)));
      rowHeight = pitch * .866;
      const cols = Math.ceil(width / pitch) + 1;
      const rows = Math.ceil(height / rowHeight) + 1;
      levels = Array.from({ length: LEVELS + 1 }, () => []);
      dotRows = Array.from({ length: rows }, () => []);
      pointer = undefined;
      hoverStrength = 0;

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
            x: (col + row % 2 * .5 + (((seed >>> 8) & 7) - 3.5) * .009) * pitch,
            y: (row + (((seed >>> 11) & 7) - 3.5) * .009) * rowHeight,
            radius: pitch * (.44 + band * .025),
            shade: Math.round((band * .62 + falloff * .26 + grain * .12) * LEVELS),
            glows: (cluster >>> 24) < 26,
          };
          levels[dot.shade].push(dot);
          allDots.push(dot);
          dotRows[row].push(dot);
        }
      }
      paintDots(all, allDots);
      paintTheme();
    }

    function move(event: PointerEvent) {
      if (motion.matches || document.hidden || event.pointerType === "touch") return;
      const { clientX: x, clientY: y } = event;
      if (!hoverStrength) hover = { x, y };
      pointer = { x, y };
      kick();
    }

    const leave = () => {
      pointer = undefined;
      kick();
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
      frame = 0;
      pointer = undefined;
      waves.length = 0;
      hoverStrength = 0;
      lastFrame = 0;
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
