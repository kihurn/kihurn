"use client";

import { useEffect, useLayoutEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { curtainPath, type CurtainPhase } from "@/lib/tornPaper";

const NAVIGATE_EVENT = "kh:navigate";
const SWEEP_DURATION = 750;
const MOUNT_HOLD = 60;

export function dispatchTornNavigate(href: string) {
  window.dispatchEvent(new CustomEvent<{ href: string }>(NAVIGATE_EVENT, { detail: { href } }));
}

export function PageTransitionWipe() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const svgRef = useRef<SVGSVGElement>(null);
  const paperRef = useRef<SVGPathElement>(null);
  const baseRef = useRef<SVGPathElement>(null);
  const afterRoute = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    if (isPending || !afterRoute.current) return;
    const complete = afterRoute.current;
    afterRoute.current = null;
    complete();
  }, [isPending]);

  useEffect(() => {
    const svg = svgRef.current;
    const paper = paperRef.current;
    const base = baseRef.current;
    if (!svg || !paper || !base) return;

    let frame = 0;
    let hold = 0;
    let wiping = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sweep = (phase: CurtainPhase, done: () => void) => {
      let start: number | undefined;
      const step = () => {
        const now = performance.now();
        if (start === undefined) {
          svg.dataset.phase = phase;
          start = now;
        }
        const progress = Math.min(1, (now - start) / SWEEP_DURATION);
        paper.setAttribute("d", curtainPath(phase, "paper", progress));
        base.setAttribute("d", curtainPath(phase, "base", progress));
        if (progress < 1) frame = requestAnimationFrame(step);
        else done();
      };
      frame = requestAnimationFrame(step);
    };

    const navigate = (event: Event) => {
      const href = (event as CustomEvent<{ href: string }>).detail.href;
      const target = new URL(href, window.location.href);
      if (target.origin !== window.location.origin || wiping) return;

      const scrollToTop = () => {
        if (!target.hash) window.scrollTo({ top: 0, behavior: "instant" });
      };
      if (reducedMotion.matches || target.pathname === window.location.pathname) {
        scrollToTop();
        router.push(href);
        return;
      }

      router.prefetch(href);
      wiping = true;
      sweep("cover", () => {
        svg.dataset.phase = "hold";
        afterRoute.current = () => {
          scrollToTop();
          hold = window.setTimeout(() => {
            sweep("reveal", () => {
              delete svg.dataset.phase;
              wiping = false;
            });
          }, MOUNT_HOLD);
        };
        startTransition(() => router.push(href, { scroll: Boolean(target.hash) }));
      });
    };

    const prefetchNavLink = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>(".navpill__link, .header__logo, .drawer__link");
      if (!link || link.pathname === window.location.pathname) return;
      if (event instanceof MouseEvent && event.relatedTarget instanceof Node && link.contains(event.relatedTarget)) return;
      router.prefetch(link.pathname + link.search);
    };

    window.addEventListener(NAVIGATE_EVENT, navigate);
    document.addEventListener("mouseover", prefetchNavLink);
    document.addEventListener("focusin", prefetchNavLink);
    return () => {
      window.removeEventListener(NAVIGATE_EVENT, navigate);
      document.removeEventListener("mouseover", prefetchNavLink);
      document.removeEventListener("focusin", prefetchNavLink);
      cancelAnimationFrame(frame);
      window.clearTimeout(hold);
      afterRoute.current = null;
      delete svg.dataset.phase;
    };
  }, [router, startTransition]);

  return (
    <svg ref={svgRef} className="page-transition-wipe" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path ref={paperRef} />
      <path ref={baseRef} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
