"use client";

import { useEffect, useRef } from "react";
import { createThemeBurstParticles, stepThemeBurstParticles, type ThemeParticle } from "@/lib/themeParticles";

type ThemeBurstDetail = { x?: number; y?: number; resolved: "light" | "dark" };

export function dispatchThemeBurst(detail: ThemeBurstDetail) {
  window.dispatchEvent(new CustomEvent("kh:theme-burst", { detail }));
}

type Dot = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number };
type Pulse = { x: number; y: number; age: number; radius: number; count: number; seed: number };

const MAX_DOTS = 550;
const PULSE_LENGTH = 820;
const PITCH = 27;
const TAU = 2 * Math.PI;

export function GlobalDotField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dots: Dot[] = [];
    const pulses: Pulse[] = [];
    let themeDots: ThemeParticle[] = [];
    let themeClock = 0;
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastFrame = 0;
    let lastMove = 0;
    let trailRemainder = 0;
    let x = -500;
    let y = -500;
    let ink = "#d6d6d5";
    let outline = "#171717";

    const redraw = (now: number) => {
      frame = 0;
      if (document.hidden) return;
      const dt = lastFrame ? Math.min(34, now - lastFrame) : 16;
      lastFrame = now;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = ink;
      for (let row = 0, gy = 13; gy < height; row++, gy += PITCH) {
        for (let gx = 13 + (row % 2) * 6; gx < width; gx += PITCH) {
          let dx = 0;
          let dy = 0;
          let energy = motion.matches ? 0 : Math.max(0, 1 - Math.hypot(gx - x, gy - y) / 108);
          for (const pulse of pulses) {
            const px = gx - pulse.x;
            const py = gy - pulse.y;
            const distance = Math.hypot(px, py) || 1;
            const push = Math.max(0, 1 - Math.abs(distance - pulse.radius) / 31) * (1 - pulse.age / PULSE_LENGTH);
            dx += px / distance * push * 6;
            dy += py / distance * push * 6;
            energy = Math.max(energy, push);
          }
          ctx.globalAlpha = 0.08 + energy * 0.16;
          ctx.fillRect(Math.round(gx + dx), Math.round(gy + dy), 1, 1);
        }
      }
      for (let i = dots.length - 1; i >= 0; i--) {
        const dot = dots[i];
        dot.age += dt;
        if (dot.age >= dot.life) { dots.splice(i, 1); continue; }
        const fade = 1 - dot.age / dot.life;
        dot.x += (dot.vx + Math.sin(dot.age / 63) * 0.023) * dt;
        dot.y += (dot.vy + Math.cos(dot.age / 79) * 0.022) * dt;
        const left = Math.round(dot.x - dot.size / 2);
        const top = Math.round(dot.y - dot.size / 2);
        ctx.fillStyle = outline;
        ctx.globalAlpha = fade * 0.47;
        ctx.fillRect(left - 0.6, top - 0.6, dot.size + 1.2, dot.size + 1.2);
        ctx.fillStyle = ink;
        ctx.globalAlpha = fade ** 1.25 * 0.94;
        ctx.fillRect(left, top, dot.size, dot.size);
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        pulse.age += dt;
        if (pulse.age >= PULSE_LENGTH) { pulses.splice(i, 1); continue; }
        const t = pulse.age / PULSE_LENGTH;
        pulse.radius = 220 * (1 - (1 - t) ** 3);
        ctx.globalAlpha = (1 - t) ** 1.4 * 0.62;
        for (let j = 0; j < pulse.count; j++) {
          const noise = Math.sin(j * 13.11 + pulse.seed);
          const angle = TAU * (j + 0.37 * noise) / pulse.count;
          const r = pulse.radius + noise * (4 + 8 * t);
          const size = 0.65 + (1 - t) * (j % 3) * 0.47;
          ctx.fillRect(Math.round(pulse.x + Math.cos(angle) * r), Math.round(pulse.y + Math.sin(angle) * r), size, size);
        }
      }
      if (themeDots.length) {
        themeClock += dt;
        while (themeClock >= 1000 / 60) {
          themeDots = stepThemeBurstParticles(themeDots);
          themeClock -= 1000 / 60;
        }
        for (const dot of themeDots) {
          ctx.globalAlpha = dot.alpha;
          ctx.fillStyle = dot.accent ? (ink === "#1e1e1e" ? "#b03a1e" : "#e06a4a") : ink;
          ctx.fillRect(dot.x, dot.y, dot.size, dot.size);
        }
      }
      ctx.globalAlpha = 1;
      if (dots.length || pulses.length || themeDots.length) kick();
      else lastFrame = 0;
    };

    const kick = () => {
      if (!frame && !document.hidden) frame = requestAnimationFrame(redraw);
    };
    const resize = () => {
      width = document.documentElement.clientWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      kick();
    };
    const syncTheme = () => {
      const light = document.documentElement.dataset.theme === "light";
      ink = light ? "#1e1e1e" : "#f2f2ef";
      outline = light ? "#f2f2ef" : "#171717";
      kick();
    };
    const move = (event: PointerEvent) => {
      if (motion.matches || document.hidden || event.pointerType === "touch") return;
      const now = performance.now();
      const oldX = x;
      const oldY = y;
      const dx = event.clientX - oldX;
      const dy = event.clientY - oldY;
      const distance = Math.hypot(dx, dy);
      const continuous = lastMove > 0 && now - lastMove < 140 && distance < 320;
      const pace = 6;
      const first = continuous ? pace - trailRemainder : 0;
      const count = continuous ? Math.min(24, Math.max(0, 1 + Math.floor((distance - first) / pace))) : 1;
      trailRemainder = continuous ? (trailRemainder + distance) % pace : 0;
      x = event.clientX;
      y = event.clientY;
      lastMove = now;
      const room = MAX_DOTS - pulses.reduce((total, pulse) => total + pulse.count, themeDots.length);
      dots.splice(0, Math.max(0, dots.length + count - room));
      for (let i = 0; i < count; i++) {
        const position = continuous && distance ? Math.min(1, (count === 24 ? distance * (i + 1) / count : first + pace * i) / distance) : 1;
        const scatter = (Math.random() - 0.5) * 6;
        const nx = continuous && distance ? -dy / distance : 0;
        const ny = continuous && distance ? dx / distance : 0;
        dots.push({
          x: oldX + dx * position + nx * scatter,
          y: oldY + dy * position + ny * scatter,
          vx: nx * scatter * 0.011,
          vy: ny * scatter * 0.011,
          age: 0,
          life: 710 + Math.random() * 180,
          size: i % 4 === 0 ? 3 : 2,
        });
      }
      kick();
    };
    const burst = (event: PointerEvent) => {
      if (motion.matches || document.hidden || event.button !== 0) return;
      if (pulses.length === 4) pulses.shift();
      pulses.push({ x: event.clientX, y: event.clientY, age: 0, radius: 0, count: 108, seed: Math.random() * TAU });
      dots.splice(0, Math.max(0, dots.length + pulses.length * 108 + themeDots.length - MAX_DOTS));
      for (const dot of dots) {
        const dx = dot.x - event.clientX;
        const dy = dot.y - event.clientY;
        const length = Math.hypot(dx, dy) || 1;
        const force = Math.max(0, 1 - length / 130) * 0.19;
        dot.vx += dx / length * force;
        dot.vy += dy / length * force;
      }
      kick();
    };
    const themeBurst = (event: Event) => {
      if (motion.matches || document.hidden) return;
      const { x, y } = (event as CustomEvent<ThemeBurstDetail>).detail;
      themeDots = createThemeBurstParticles(x ?? width * 0.85, y ?? 52, 44);
      themeClock = 0;
      dots.splice(0, Math.max(0, dots.length + pulses.length * 108 + themeDots.length - MAX_DOTS));
      kick();
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
      lastMove = 0;
      trailRemainder = 0;
      dots.length = 0;
      pulses.length = 0;
      themeDots = [];
      x = y = -500;
      kick();
    };

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    resize();
    syncTheme();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true, capture: true });
    window.addEventListener("pointerdown", burst, { passive: true, capture: true });
    window.addEventListener("kh:theme-burst", themeBurst);
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", stop);
    motion.addEventListener("change", stop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerdown", burst, true);
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
