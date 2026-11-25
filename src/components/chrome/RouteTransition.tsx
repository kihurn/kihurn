"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { computeTornWipeOffsets, generateTornEdgePoints } from "@/lib/tornPaper";

export const NAVIGATE_EVENT = "kh:navigate";

export function dispatchTornNavigate(href: string) {
  window.dispatchEvent(new CustomEvent<{ href: string }>(NAVIGATE_EVENT, { detail: { href } }));
}

/**
 * Full-viewport Canvas torn-paper wipe that sweeps bottom -> top on route change
 * with an organic deckled edge, clean RAF lifecycle, and reduced-motion bypass.
 */
export function RouteTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathCommittedRef = useRef<(() => void) | null>(null);
  const activeRafRef = useRef(0);
  const safetyTimerRef = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    pathCommittedRef.current?.();
    pathCommittedRef.current = null;
  }, [pathname]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = document.documentElement.clientWidth || window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    };
    resize();
    window.addEventListener("resize", resize);

    const drawTornBand = (progress: number, seed: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (progress <= 0 || progress >= 1) {
        ctx.restore();
        return;
      }

      const isLight = document.documentElement.dataset.theme === "light";
      const sheetColor = isLight ? "#1e1e1e" : "#d6d6d5";
      const deckleEdgeColor = isLight ? "rgba(214,214,213,0.45)" : "rgba(30,30,30,0.45)";
      const { topEdgeY, bottomEdgeY } = computeTornWipeOffsets(progress, h, 44);

      const topPts = generateTornEdgePoints(w, topEdgeY, seed, 24, 48);
      const bottomPts = generateTornEdgePoints(w, bottomEdgeY, seed + 3.7, 24, 48);

      ctx.beginPath();
      ctx.moveTo(topPts[0].x, topPts[0].y);
      for (let i = 1; i < topPts.length; i++) {
        ctx.lineTo(topPts[i].x, topPts[i].y);
      }
      for (let i = bottomPts.length - 1; i >= 0; i--) {
        ctx.lineTo(bottomPts[i].x, bottomPts[i].y);
      }
      ctx.closePath();

      ctx.fillStyle = sheetColor;
      ctx.fill();

      // Crisp deckle fiber highlight along leading and trailing torn edges
      ctx.strokeStyle = deckleEdgeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(topPts[0].x, topPts[0].y);
      for (let i = 1; i < topPts.length; i++) ctx.lineTo(topPts[i].x, topPts[i].y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(bottomPts[0].x, bottomPts[0].y);
      for (let i = 1; i < bottomPts.length; i++) ctx.lineTo(bottomPts[i].x, bottomPts[i].y);
      ctx.stroke();

      ctx.restore();
    };

    const runTransition = (href: string) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }

      const targetPath = href.split(/[?#]/)[0];
      if (targetPath === window.location.pathname && !href.includes("#")) {
        return;
      }

      cancelAnimationFrame(activeRafRef.current);
      window.clearTimeout(safetyTimerRef.current);
      busyRef.current = true;
      canvas.classList.add("is-active");
      const seed = (performance.now() % 100) * 0.13 + 1.2;

      const coverDur = 290;
      const revealDur = 340;
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
            busyRef.current = false;
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
            requestAnimationFrame(animateReveal);
          };
          pathCommittedRef.current = finishRoute;
          safetyTimerRef.current = window.setTimeout(finishRoute, 520);
          router.push(href);
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
      pathCommittedRef.current = null;
      busyRef.current = false;
    };
  }, [router]);

  return <canvas ref={canvasRef} className="torn-transition" data-torn-transition aria-hidden="true" />;
}
