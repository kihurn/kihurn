"use client";

import { useEffect, useRef } from "react";

type ThemeBurstDetail = { x?: number; y?: number; resolved: "light" | "dark" };

export function dispatchThemeBurst(detail: ThemeBurstDetail) {
  window.dispatchEvent(new CustomEvent("kh:theme-burst", { detail }));
}

type Dot = { x: number; y: number; radius: number; shade: number };
type Wake = { dx: number; dy: number; x: number; y: number; energy: number; at: number };
type Sample = { x: number; y: number; start: number };
type Wave = Sample & { reach: number };

const WAKE_MS = 560;
const WAKE_RADIUS = 112;
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
    const wake = new Map<Dot, Wake>();
    const wakeLevels: Dot[][] = Array.from({ length: LEVELS + 1 }, () => []);
    let levels: Dot[][] = [];
    let hoverRows: Dot[][] = [];
    let rowHeight = 1;
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastFrame = 0;
    let ink = "#e8e8e4";
    let lightTheme = false;
    let previous: Sample | undefined;

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
      if (wake.size) {
        const originals: Dot[] = [];
        for (const bucket of wakeLevels) bucket.length = 0;
        const blend = 1 - Math.exp(-dt / 38);
        for (const [dot, motion] of wake) {
          const age = Math.max(0, now - motion.at);
          const fade = Math.max(0, 1 - age / WAKE_MS);
          const spring = Math.cos(age / 74) * fade ** 2.4;
          motion.x += (motion.dx * spring - motion.x) * blend;
          motion.y += (motion.dy * spring - motion.y) * blend;
          if (!fade && Math.abs(motion.x) + Math.abs(motion.y) < .12) {
            wake.delete(dot);
            continue;
          }
          const alpha = idleInk(dot.shade) + motion.energy * .68 * fade ** 1.65;
          originals.push(dot);
          wakeLevels[Math.max(1, Math.round(alpha * LEVELS))].push({
            ...dot, x: dot.x + motion.x, y: dot.y + motion.y,
          });
        }
        ctx.globalCompositeOperation = "destination-out";
        paintDots(ctx, originals);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = ink;
        for (let i = 1; i <= LEVELS; i++) {
          if (!wakeLevels[i].length) continue;
          ctx.globalAlpha = i / LEVELS;
          paintDots(ctx, wakeLevels[i]);
        }
        ctx.globalAlpha = 1;
      }
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
      if (wake.size || waves.length) kick();
      else lastFrame = 0;
    }

    const idleInk = (index: number) => .009 + (lightTheme ? .062 : .073) * (index / LEVELS) ** 2.4;

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
      const pitch = Math.max(4.8, Math.sqrt(width * height / (65_000 * .866)));
      rowHeight = pitch * .866;
      const cols = Math.ceil(width / pitch) + 1;
      const rows = Math.ceil(height / rowHeight) + 1;
      levels = Array.from({ length: LEVELS + 1 }, () => []);
      hoverRows = Array.from({ length: rows }, () => []);
      wake.clear();
      previous = undefined;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const seed = Math.imul(Math.imul(col + 103, 19349663) ^ Math.imul(row + 271, 83492791), 0x85ebca6b) >>> 0;
          const grain = (seed & 255) / 255;
          const u = col / Math.max(1, cols - 1);
          const v = row / Math.max(1, rows - 1);
          const band = .5 + .5 * Math.sin(10 * u - 7 * v + 1.8 * Math.sin(5 * v));
          const falloff = 1 - Math.min(1, Math.hypot(u - .58, v - .42));
          const dot = {
            x: (col + row % 2 * .5 + (((seed >>> 8) & 7) - 3.5) * .009) * pitch,
            y: (row + (((seed >>> 11) & 7) - 3.5) * .009) * rowHeight,
            radius: pitch * (.44 + band * .025),
            shade: Math.round((band * .62 + falloff * .26 + grain * .12) * LEVELS),
          };
          levels[dot.shade].push(dot);
          allDots.push(dot);
          if (((seed >>> 20) & 255) < 26) hoverRows[row].push(dot);
        }
      }
      paintDots(all, allDots);
      paintTheme();
    }

    function move(event: PointerEvent) {
      if (motion.matches || document.hidden || event.pointerType === "touch") return;
      const { clientX: x, clientY: y } = event;
      const start = performance.now();
      const from = previous && start - previous.start < 130 ? previous : { x, y, start };
      const distance = Math.hypot(x - from.x, y - from.y);
      if (previous && start - previous.start < 130 && distance < 13) return;
      const steps = Math.max(1, Math.min(10, Math.ceil(distance / 17)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const sx = from.x + (x - from.x) * t;
        const sy = from.y + (y - from.y) * t;
        const first = Math.max(0, Math.floor((sy - WAKE_RADIUS) / rowHeight));
        const last = Math.min(hoverRows.length - 1, Math.ceil((sy + WAKE_RADIUS) / rowHeight));
        for (let row = first; row <= last; row++) {
          for (const dot of hoverRows[row]) {
            const dx = dot.x - sx;
            if (dx < -WAKE_RADIUS) continue;
            if (dx > WAKE_RADIUS) break;
            const dy = dot.y - sy;
            const length = Math.hypot(dx, dy);
            if (length >= WAKE_RADIUS) continue;
            const energy = (1 - length / WAKE_RADIUS) ** 1.55;
            const current = wake.get(dot);
            if (current && current.energy * Math.max(0, 1 - (start - current.at) / WAKE_MS) > energy) continue;
            const push = 7 * energy / Math.max(7, length);
            wake.set(dot, { dx: dx * push, dy: dy * push, x: current?.x ?? 0, y: current?.y ?? 0, energy, at: start });
          }
        }
      }
      previous = { x, y, start };
      kick();
    }

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
      previous = undefined;
      waves.length = 0;
      wake.clear();
      lastFrame = 0;
      kick();
    };

    const theme = new MutationObserver(paintTheme);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true, capture: true });
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
