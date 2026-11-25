"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

interface Wake {
  x: number;
  y: number;
  t: number;
  r: number;
}

const CELL = 7;
const WAKE_MS = 900;
const MAX_WAKE = 40;

export function HalftoneImage({ src, alt, width, height, className }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = wrap.current;
    const image = img.current;
    const cv = canvas.current;
    if (!host || !image || !cv) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let luma: Float32Array | null = null;
    let cols = 0;
    let rows = 0;
    let w = 0;
    let h = 0;
    let raf = 0;
    const wake: Wake[] = [];

    function sample() {
      try {
        const rect = host!.getBoundingClientRect();
        w = Math.max(1, Math.round(rect.width));
        h = Math.max(1, Math.round(rect.height));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        cv!.width = w * dpr;
        cv!.height = h * dpr;
        ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
        cols = Math.ceil(w / CELL);
        rows = Math.ceil(h / CELL);
        const off = document.createElement("canvas");
        off.width = cols;
        off.height = rows;
        const octx = off.getContext("2d", { willReadFrequently: true });
        if (!octx) return;
        octx.drawImage(image!, 0, 0, cols, rows);
        const data = octx.getImageData(0, 0, cols, rows).data;
        luma = new Float32Array(cols * rows);
        for (let i = 0; i < luma.length; i++) {
          const r = data[i * 4];
          const g = data[i * 4 + 1];
          const b = data[i * 4 + 2];
          luma[i] = 1 - (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        }
      } catch {
        luma = null;
      }
    }

    const ink = () => (document.documentElement.dataset.theme === "light" ? "#1e1e1e" : "#f7f7f7");
    const paper = () => (document.documentElement.dataset.theme === "light" ? "#efeeeb" : "#1e1e1e");

    function frame(now: number) {
      raf = 0;
      ctx!.clearRect(0, 0, w, h);
      while (wake.length && now - wake[0].t > WAKE_MS) wake.shift();
      if (!luma || wake.length === 0) return;

      const inkC = ink();
      const paperC = paper();
      const cos = Math.SQRT1_2;
      const sin = Math.SQRT1_2;
      const pitch = CELL * 1.25;
      const R = Math.ceil(Math.hypot(w, h) / 2 / pitch) + 1;
      for (let gy = -R; gy <= R; gy++) {
        for (let gx = -R; gx <= R; gx++) {
          const u = gx * pitch;
          const v = gy * pitch;
          const x = u * cos - v * sin + w / 2;
          const y = u * sin + v * cos + h / 2;
          if (x < -pitch || y < -pitch || x > w + pitch || y > h + pitch) continue;
          let energy = 0;
          for (const p of wake) {
            const d = Math.hypot(x - p.x, y - p.y);
            if (d > p.r) continue;
            const e = (1 - d / p.r) * (1 - (now - p.t) / WAKE_MS);
            if (e > energy) energy = e;
          }
          if (energy <= 0.02) continue;
          const ci = Math.min(cols - 1, Math.max(0, Math.floor(x / CELL)));
          const ri = Math.min(rows - 1, Math.max(0, Math.floor(y / CELL)));
          const dark = luma[ri * cols + ci];
          ctx!.globalAlpha = Math.min(1, energy * 1.6);
          ctx!.fillStyle = paperC;
          ctx!.fillRect(x - pitch / 2, y - pitch / 2, pitch, pitch);
          const rad = (pitch / 2) * Math.sqrt(0.12 + 0.88 * dark) * Math.min(1, energy * 1.4);
          ctx!.fillStyle = inkC;
          ctx!.beginPath();
          ctx!.arc(x, y, rad, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
      ctx!.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    function kick() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    function add(e: PointerEvent, r: number) {
      if (e.pointerType !== "mouse") return;
      const rect = host!.getBoundingClientRect();
      wake.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, t: performance.now(), r });
      if (wake.length > MAX_WAKE) wake.shift();
      kick();
    }

    const onMove = (e: PointerEvent) => add(e, 46);
    const onDown = (e: PointerEvent) => add(e, 110);

    if (image.complete && image.naturalWidth) sample();
    image.addEventListener("load", sample);
    const ro = new ResizeObserver(sample);
    ro.observe(host);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onDown);

    return () => {
      cancelAnimationFrame(raf);
      image.removeEventListener("load", sample);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
    };
  }, [src]);

  return (
    <div ref={wrap} className={`halftone ${className ?? ""}`} style={{ aspectRatio: `${width} / ${height}` }}>
      <Image unoptimized ref={img} src={src} alt={alt} width={width} height={height} className="halftone__img" draggable={false} />
      <canvas ref={canvas} className="halftone__canvas" aria-hidden="true" />
    </div>
  );
}
