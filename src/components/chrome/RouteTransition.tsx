"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { computeTornWipeOffsets, generateTornEdgePoints, type TornPoint } from "@/lib/tornPaper";

export const NAVIGATE_EVENT = "kh:navigate";

export function dispatchTornNavigate(href: string) {
  window.dispatchEvent(new CustomEvent<{ href: string }>(NAVIGATE_EVENT, { detail: { href } }));
}

export function RouteTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pendingRef = useRef<{ path: string; reveal: () => void; scroll: boolean } | null>(null);
  const activeRafRef = useRef(0);
  const safetyTimerRef = useRef(0);
  useLayoutEffect(() => {
    const pending = pendingRef.current;
    if (!pending || pending.path !== pathname) return;
    pendingRef.current = null;
    if (pending.scroll) window.scrollTo({ top: 0, behavior: "instant" });
    pending.reveal();
  }, [pathname]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let edges: { width: number; seed: number; top: TornPoint[]; bottom: TornPoint[] } | undefined;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = document.documentElement.clientWidth || window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const drawTornBand = (progress: number, seed: number) => {
      ctx.clearRect(0, 0, width, height);
      if (progress <= 0 || progress >= 1) return;

      const isLight = document.documentElement.dataset.theme === "light";
      const lip = Math.min(37, Math.max(14, width * .024));
      const { topEdgeY, bottomEdgeY } = computeTornWipeOffsets(progress, height, 78);
      if (!edges || edges.width !== width || edges.seed !== seed) {
        const amplitude = Math.min(24, width * .033);
        edges = {
          width, seed,
          top: generateTornEdgePoints(width, 0, seed, amplitude, 64),
          bottom: generateTornEdgePoints(width, 0, seed + 3.7, amplitude, 64),
        };
      }

      const { top, bottom } = edges;
      const paintSheet = (color: string, inset: number) => {
        ctx.beginPath();
        top.forEach(({ x, y }, i) => {
          const edge = topEdgeY + y + inset * (1 + .29 * Math.sin(i * .29 + seed));
          if (i === 0) ctx.moveTo(x, edge);
          else ctx.lineTo(x, edge);
        });
        for (let i = bottom.length - 1; i >= 0; i--) {
          const { x, y } = bottom[i];
          ctx.lineTo(x, bottomEdgeY + y - inset * (1 + .23 * Math.cos(i * .25 + seed)));
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      };

      paintSheet(isLight ? "#383633" : "#eae9e5", 0);
      paintSheet(isLight ? "#e4e1db" : "#151515", lip);
    };

    const runTransition = (href: string) => {
      const target = new URL(href, window.location.href);
      if (target.origin !== window.location.origin) return;
      if (pendingRef.current && canvas.classList.contains("is-active")) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || target.pathname === window.location.pathname) {
        pendingRef.current = null;
        if (!target.hash) window.scrollTo({ top: 0, behavior: "instant" });
        router.push(href);
        return;
      }

      pendingRef.current = null;
      cancelAnimationFrame(activeRafRef.current);
      window.clearTimeout(safetyTimerRef.current);
      canvas.classList.add("is-active");
      router.prefetch(href);
      const seed = (performance.now() % 100) * 0.13 + 1.2;

      const coverDur = 365;
      const revealDur = 470;
      const t0 = performance.now();

      const animateReveal = () => {
        const rStart = performance.now();
        const stepReveal = (now: number) => {
          const k = Math.min(1, (now - rStart) / revealDur);
          drawTornBand(0.5 + k * 0.5, seed);
          if (k < 1) {
            activeRafRef.current = requestAnimationFrame(stepReveal);
          } else {
            drawTornBand(1, seed);
            canvas.classList.remove("is-active");
          }
        };
        activeRafRef.current = requestAnimationFrame(stepReveal);
      };

      const stepCover = (now: number) => {
        const k = Math.min(1, (now - t0) / coverDur);
        drawTornBand(k * 0.5, seed);
        if (k < 1) {
          activeRafRef.current = requestAnimationFrame(stepCover);
        } else {
          let startedReveal = false;
          const finishRoute = () => {
            if (startedReveal) return;
            startedReveal = true;
            window.clearTimeout(safetyTimerRef.current);
            animateReveal();
          };
          pendingRef.current = { path: target.pathname, reveal: finishRoute, scroll: !target.hash };
          if (!target.hash) window.scrollTo({ top: 0, behavior: "instant" });
          safetyTimerRef.current = window.setTimeout(finishRoute, 1200);
          router.push(href, { scroll: Boolean(target.hash) });
        }
      };

      activeRafRef.current = requestAnimationFrame(stepCover);
    };

    const onNavigate = (e: Event) => {
      const href = (e as CustomEvent<{ href?: string }>).detail?.href;
      if (href) runTransition(href);
    };

    window.addEventListener(NAVIGATE_EVENT, onNavigate);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener(NAVIGATE_EVENT, onNavigate);
      cancelAnimationFrame(activeRafRef.current);
      window.clearTimeout(safetyTimerRef.current);
      pendingRef.current = null;
    };
  }, [router]);

  return <canvas ref={canvasRef} className="torn-transition" data-torn-transition aria-hidden="true" />;
}
