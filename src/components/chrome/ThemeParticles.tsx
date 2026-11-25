"use client";

import { useEffect, useRef } from "react";
import { createThemeBurstParticles, stepThemeBurstParticles, type ThemeParticle } from "@/lib/themeParticles";

export interface ThemeBurstDetail {
  x?: number;
  y?: number;
  resolved: "light" | "dark";
}

export function dispatchThemeBurst(detail: ThemeBurstDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ThemeBurstDetail>("kh:theme-burst", { detail }));
}

export function ThemeParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: ThemeParticle[] = [];
    let raf = 0;
    let activeResolved: "light" | "dark" = "dark";

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (particles.length === 0) {
        raf = 0;
        return;
      }

      const inkRgb = activeResolved === "light" ? "30,30,30" : "236,236,233";
      const accentRgb = activeResolved === "light" ? "176,58,30" : "224,106,74";

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.fillStyle = `rgba(${p.accent ? accentRgb : inkRgb}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      particles = stepThemeBurstParticles(particles);
      if (particles.length > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        raf = 0;
      }
    };

    const onBurst = (ev: Event) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const custom = ev as CustomEvent<ThemeBurstDetail>;
      const ox = typeof custom.detail?.x === "number" ? custom.detail.x : window.innerWidth * 0.85;
      const oy = typeof custom.detail?.y === "number" ? custom.detail.y : 52;
      activeResolved = custom.detail?.resolved ?? "dark";
      resize();
      particles = [...particles.slice(-40), ...createThemeBurstParticles(ox, oy, 44)];
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("kh:theme-burst", onBurst);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("kh:theme-burst", onBurst);
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="theme-burst" aria-hidden="true" />;
}
