"use client";

import { useEffect, useRef } from "react";

type ThemeBurstDetail = { x?: number; y?: number; resolved: "light" | "dark" };

export function dispatchThemeBurst(detail: ThemeBurstDetail) {
  window.dispatchEvent(new CustomEvent("kh:theme-burst", { detail }));
}

type Dot = { x: number; y: number; radius: number };
type Sample = { x: number; y: number; start: number };
type Wave = Sample & { reach: number };

const WAKE_MS = 580;
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
    const hoverMask = document.createElement("canvas");
    const lighting = document.createElement("canvas");
    const base = texture.getContext("2d");
    const all = allMask.getContext("2d");
    const hover = hoverMask.getContext("2d");
    const light = lighting.getContext("2d");
    if (!base || !all || !hover || !light) return;

    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const waves: Wave[] = [];
    const samples: Sample[] = [];
    let levels: Dot[][] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let ink = "#e8e8e4";
    let lightTheme = false;
    let glow: HTMLCanvasElement;
    let previous: Sample | undefined;

    function kick() {
      if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
    }

    function draw(now: number) {
      frame = 0;
      if (!ctx || !light || document.hidden) return;
      while (samples.length && now - samples[0].start >= WAKE_MS) samples.shift();
      for (let i = waves.length - 1; i >= 0; i--) {
        if ((now - waves[i].start) * WAVE_SPEED > waves[i].reach + WAVE_WIDTH) waves.splice(i, 1);
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(texture, 0, 0, width, height);
      if (samples.length) {
        light.clearRect(0, 0, width, height);
        for (const sample of samples) {
          light.globalAlpha = ((1 - (now - sample.start) / WAKE_MS) ** 1.7) * .38;
          light.drawImage(glow, sample.x - WAKE_RADIUS, sample.y - WAKE_RADIUS);
        }
        light.globalAlpha = 1;
        light.globalCompositeOperation = "destination-in";
        light.drawImage(hoverMask, 0, 0, width, height);
        light.globalCompositeOperation = "source-over";
        ctx.drawImage(lighting, 0, 0, width, height);
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
      if (samples.length || waves.length) kick();
    }

    function paintTheme() {
      if (!base) return;
      lightTheme = document.documentElement.dataset.theme === "light";
      ink = lightTheme ? "#1e1e1e" : "#e8e8e4";
      base.clearRect(0, 0, width, height);
      base.fillStyle = ink;
      levels.forEach((dots, index) => {
        base.globalAlpha = .012 + (lightTheme ? .075 : .09) * (index / LEVELS) ** 2.4;
        paintDots(base, dots);
      });
      base.globalAlpha = 1;

      glow = document.createElement("canvas");
      glow.width = glow.height = 2 * WAKE_RADIUS;
      const lens = glow.getContext("2d");
      if (!lens) return;
      const wash = lens.createRadialGradient(WAKE_RADIUS, WAKE_RADIUS, 0, WAKE_RADIUS, WAKE_RADIUS, WAKE_RADIUS);
      wash.addColorStop(0, ink);
      wash.addColorStop(.42, `${ink}a0`);
      wash.addColorStop(.72, `${ink}35`);
      wash.addColorStop(1, "transparent");
      lens.fillStyle = wash;
      lens.fillRect(0, 0, glow.width, glow.height);
      kick();
    }

    function resize() {
      if (!canvas || !ctx || !base || !all || !hover || !light) return;
      width = document.documentElement.clientWidth;
      height = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      for (const buffer of [canvas, texture, allMask, hoverMask, lighting]) {
        buffer.width = Math.round(width * dpr);
        buffer.height = Math.round(height * dpr);
      }
      for (const context of [ctx, base, all, hover, light]) context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const hoverDots: Dot[] = [];
      const allDots: Dot[] = [];
      const pitch = Math.max(5, Math.sqrt(width * height / 65_000));
      const cols = Math.ceil(width / pitch);
      const rows = Math.ceil(height / pitch);
      levels = Array.from({ length: LEVELS + 1 }, () => []);
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
            x: (col + .5 + (((seed >>> 8) & 7) - 3.5) * .035) * pitch,
            y: (row + .5 + (((seed >>> 11) & 7) - 3.5) * .035) * pitch,
            radius: 1.25 + band * .62 + grain * .15,
          };
          levels[Math.round((band * .62 + falloff * .26 + grain * .12) * LEVELS)].push(dot);
          allDots.push(dot);
          if (((seed >>> 20) & 255) < 77) hoverDots.push(dot);
        }
      }
      paintDots(all, allDots);
      paintDots(hover, hoverDots);
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
        samples.push({ x: from.x + (x - from.x) * t, y: from.y + (y - from.y) * t, start });
      }
      if (samples.length > 36) samples.splice(0, samples.length - 36);
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
      samples.length = 0;
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
