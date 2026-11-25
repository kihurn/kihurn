"use client";

import { useEffect, useRef } from "react";

type ThemeBurstDetail = { x?: number; y?: number; resolved: "light" | "dark" };

export function dispatchThemeBurst(detail: ThemeBurstDetail) {
  window.dispatchEvent(new CustomEvent("kh:theme-burst", { detail }));
}

type Dot = { x: number; y: number; brightness: number; touchedAt: number; grain: number };
type Wave = { x: number; y: number; start: number; reach: number };

const PITCH = 10;
const WAKE_MS = 560;
const WAVE_SPEED = 1.05;
const WAVE_WIDTH = 124;
const DOT_SIZE = 1.6;
const LEVELS = 20;

export function GlobalDotField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const backing = document.createElement("canvas");
    const base = backing.getContext("2d");
    if (!base) return;

    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const waves: Wave[] = [];
    const levels: Dot[][] = Array.from({ length: LEVELS + 1 }, () => []);
    let dots: Dot[] = [];
    let cols = 0;
    let rows = 0;
    let width = 0;
    let height = 0;
    let frame = 0;
    let ink = "#d6d6d5";
    let previous: { x: number; y: number; time: number } | undefined;

    function kick() {
      if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
    }

    function draw(now: number) {
      frame = 0;
      if (!ctx || document.hidden) return;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(backing, 0, 0, width, height);
      ctx.fillStyle = ink;
      let awake = false;
      for (let i = waves.length - 1; i >= 0; i--) {
        if ((now - waves[i].start) * WAVE_SPEED > waves[i].reach + WAVE_WIDTH) waves.splice(i, 1);
      }
      const fronts = waves.map((wave) => {
        const radius = (now - wave.start) * WAVE_SPEED;
        return {
          ...wave, radius,
          inner: Math.max(0, radius - WAVE_WIDTH) ** 2,
          outer: (radius + WAVE_WIDTH) ** 2,
          strength: Math.min(1, radius / 75) * (1 - .3 * Math.min(1, radius / wave.reach)),
        };
      });
      for (const bucket of levels) bucket.length = 0;
      for (const dot of dots) {
        const elapsed = now - dot.touchedAt;
        const wake = elapsed < WAKE_MS ? dot.brightness * (1 - elapsed / WAKE_MS) ** 1.6 : 0;
        let waveLight = 0;
        for (const wave of fronts) {
          const dx = dot.x - wave.x;
          const dy = dot.y - wave.y;
          const distance = dx * dx + dy * dy;
          if (distance < wave.inner || distance > wave.outer) continue;
          const band = Math.max(0, 1 - Math.abs(Math.sqrt(distance) - wave.radius) / WAVE_WIDTH);
          const falloff = band * band * (3 - 2 * band);
          waveLight = Math.max(waveLight, falloff * wave.strength * (.36 + dot.grain * .34));
        }
        const level = Math.round(Math.max(wake, waveLight) * LEVELS);
        if (level) levels[level].push(dot);
        awake ||= wake > .025;
      }
      for (let i = 1; i <= LEVELS; i++) {
        if (!levels[i].length) continue;
        ctx.globalAlpha = i / LEVELS * .82;
        ctx.beginPath();
        for (const dot of levels[i]) ctx.rect(dot.x, dot.y, DOT_SIZE, DOT_SIZE);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (awake || waves.length) kick();
    }

    function paintBase() {
      if (!base) return;
      base.clearRect(0, 0, width, height);
      base.fillStyle = ink;
      for (const dot of dots) {
        base.globalAlpha = .06 + dot.grain * .06;
        base.fillRect(dot.x, dot.y, DOT_SIZE, DOT_SIZE);
      }
      base.globalAlpha = 1;
    }

    function resize() {
      if (!canvas || !ctx) return;
      width = document.documentElement.clientWidth;
      height = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      backing.width = canvas.width = Math.round(width * dpr);
      backing.height = canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      base?.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / PITCH);
      rows = Math.ceil(height / PITCH);
      previous = undefined;
      dots = Array.from({ length: cols * rows }, (_, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const seed = Math.imul(col + 103, 19349663) ^ Math.imul(row + 271, 83492791);
        return {
          x: col * PITCH + 2 + (seed >>> 4) % 6,
          y: row * PITCH + 2 + (seed >>> 11) % 6,
          brightness: 0,
          touchedAt: 0,
          grain: (seed >>> 20) % 997 / 996,
        };
      });
      paintBase();
      kick();
    }

    function syncTheme() {
      ink = document.documentElement.dataset.theme === "light" ? "#1e1e1e" : "#e8e8e4";
      paintBase();
      kick();
    }

    function move(event: PointerEvent) {
      if (motion.matches || document.hidden || event.pointerType === "touch") return;
      const x = event.clientX;
      const y = event.clientY;
      const time = performance.now();
      const from = previous && time - previous.time < 140 ? previous : { x, y };
      previous = { x, y, time };
      const dx = x - from.x;
      const dy = y - from.y;
      const lengthSquared = dx * dx + dy * dy;
      const reach = 68;
      const firstCol = Math.max(0, Math.floor((Math.min(from.x, x) - reach) / PITCH));
      const lastCol = Math.min(cols - 1, Math.floor((Math.max(from.x, x) + reach) / PITCH));
      const firstRow = Math.max(0, Math.floor((Math.min(from.y, y) - reach) / PITCH));
      const lastRow = Math.min(rows - 1, Math.floor((Math.max(from.y, y) + reach) / PITCH));
      for (let row = firstRow; row <= lastRow; row++) {
        for (let col = firstCol; col <= lastCol; col++) {
          const dot = dots[row * cols + col];
          const along = lengthSquared ? Math.max(0, Math.min(1, ((dot.x - from.x) * dx + (dot.y - from.y) * dy) / lengthSquared)) : 1;
          const distance = Math.hypot(dot.x - from.x - dx * along, dot.y - from.y - dy * along);
          if (distance >= reach) continue;
          const brightness = (1 - distance / reach) ** 1.75 * (.6 + dot.grain * .4);
          const remaining = dot.brightness * Math.max(0, 1 - (time - dot.touchedAt) / WAKE_MS) ** 1.6;
          if (brightness < remaining) continue;
          dot.brightness = brightness;
          dot.touchedAt = time;
        }
      }
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
      dots.forEach((dot) => { dot.brightness = 0; });
      kick();
    };

    const theme = new MutationObserver(syncTheme);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    resize();
    syncTheme();
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
