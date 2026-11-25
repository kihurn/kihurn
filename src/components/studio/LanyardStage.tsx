"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { HalftonePortrait } from "@/components/chrome/HalftonePortrait";
import { crewRoles } from "@/content/gigs";
import {
  computeBadgePose,
  createVerletChain,
  pinTailToPoint,
  releaseTailWithImpulse,
  setChainAnchor,
  stepVerletChain,
} from "@/lib/physics/verlet";
import { createLanyardScene } from "./lanyardScene";

function subscribeToReducedMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function LanyardStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);
  const reduced = useSyncExternalStore(subscribeToReducedMotion, prefersReducedMotion, () => false);

  useEffect(() => {
    const stage = stageRef.current;
    const path = pathRef.current;
    const badge = badgeRef.current;
    if (!stage || !path || !badge) return;

    let rect = stage.getBoundingClientRect();
    const restY = -8;
    const startY = reduced ? restY : -rect.height - 32;
    const chain = createVerletChain(rect.width * .5, startY, 10, 20, reduced ? 0 : 36);
    const scene = canvasRef.current ? createLanyardScene(canvasRef.current, chain) : undefined;
    if (scene) stage.dataset.glReady = "";
    stage.dataset.ready = "";

    let started = performance.now();
    let lastFrame = 0;
    let frame = 0;
    let visible = true;
    let anchorY = startY;
    let drag: { id: number; offsetX: number; offsetY: number; x: number; y: number; originY: number; distance: number; vx: number; vy: number } | undefined;

    function paint(dt: number) {
      if (!path || !badge) return;
      const { nodes } = chain;
      const tail = nodes[nodes.length - 1];
      const pose = computeBadgePose(chain);
      const xTilt = Math.max(-12, Math.min(12, (tail.oldY - tail.y) * 1.1));
      const yTilt = Math.max(-16, Math.min(16, (tail.x - tail.oldX) * 1.4));
      const scale = Math.min(1, Math.max(.58, rect.width / 435));
      const curves = nodes.slice(1, -1).map((node, index) => {
        const next = nodes[index + 2];
        return `Q ${node.x} ${node.y} ${(node.x + next.x) * .5} ${(node.y + next.y) * .5}`;
      });
      path.setAttribute("d", `M ${nodes[0].x} ${nodes[0].y} ${curves.join(" ")} L ${tail.x} ${tail.y}`);
      badge.style.transform = `translate3d(${pose.x - 140}px,${pose.y - 10}px,0) rotate(${pose.angleDeg}deg) rotateX(${xTilt}deg) rotateY(${yTilt}deg) scale(${scale})`;
      scene?.draw(badge.dataset.flipped === "true", dt);
    }

    function resize() {
      if (!stage) return;
      const oldCenter = rect.width * .5;
      rect = stage.getBoundingClientRect();
      const center = rect.width * .5;
      chain.segmentLength = Math.min(24, Math.max(17, rect.height * .036));
      for (const [i, node] of chain.nodes.entries()) {
        node.x += center - oldCenter;
        node.oldX += center - oldCenter;
        if (reduced) {
          node.x = node.oldX = center;
          node.y = node.oldY = restY + i * chain.segmentLength;
        }
      }
      setChainAnchor(chain, center, anchorY);
      scene?.resize(rect.width, rect.height);
      paint(0);
    }

    function tick(now: number) {
      if (document.documentElement.dataset.preloader === "active") {
        started = now;
        frame = requestAnimationFrame(tick);
        return;
      }
      const dt = lastFrame ? Math.min(.028, (now - lastFrame) / 1000) : 1 / 60;
      lastFrame = now;
      const drop = Math.min(1, Math.max(0, (now - started) / 530));
      anchorY = restY + (startY - restY) * (1 - drop) ** 3;
      setChainAnchor(chain, rect.width * .5, anchorY);
      stepVerletChain(chain, {
        gravity: .72,
        damping: drag ? .94 : .978,
        iterations: 10,
        bounds: {
          minX: 45,
          maxX: Math.max(46, rect.width - 45),
          minY: startY,
          maxY: rect.height - 130,
        },
      });
      paint(dt);
      frame = requestAnimationFrame(tick);
    }

    function onDown(event: PointerEvent) {
      if (reduced || drag || event.button !== 0 || !badge || !stage) return;
      rect = stage.getBoundingClientRect();
      const tail = chain.nodes[chain.nodes.length - 1];
      drag = {
        id: event.pointerId, offsetX: tail.x + rect.left - event.clientX, offsetY: tail.y + rect.top - event.clientY,
        x: event.clientX, y: event.clientY, originY: event.clientY, distance: 0, vx: 0, vy: 0,
      };
      badge.classList.add("is-held");
      badge.setPointerCapture(event.pointerId);
    }

    function onMove(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id || !stage) return;
      rect = stage.getBoundingClientRect();
      drag.vx = (event.clientX - drag.x) * .75;
      drag.vy = (event.clientY - drag.y) * .75;
      drag.distance += Math.hypot(event.clientX - drag.x, event.clientY - drag.y);
      drag.x = event.clientX;
      drag.y = event.clientY;
      const x = Math.max(45, Math.min(rect.width - 45, drag.x - rect.left + drag.offsetX));
      const y = Math.max(12, Math.min(rect.height - 130, drag.y - rect.top + drag.offsetY));
      const z = Math.max(-80, Math.min(80, (drag.y - drag.originY) * .45));
      pinTailToPoint(chain, x, y, z);
    }

    function onUp(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id || !badge) return;
      const { vx, vy, distance } = drag;
      drag = undefined;
      badge.classList.remove("is-held");
      if (badge.hasPointerCapture(event.pointerId)) badge.releasePointerCapture(event.pointerId);
      releaseTailWithImpulse(chain, vx, vy);
      if (event.type === "pointerup" && distance < 6) setFlipped((value) => !value);
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        cancelAnimationFrame(frame);
        frame = lastFrame = 0;
      } else if (!reduced && !frame) {
        frame = requestAnimationFrame(tick);
      }
    });
    intersection.observe(stage);
    const flipObserver = new MutationObserver(() => {
      if (reduced || !visible) paint(0);
    });
    flipObserver.observe(badge, { attributes: true, attributeFilter: ["data-flipped"] });
    badge.addEventListener("pointerdown", onDown);
    badge.addEventListener("pointermove", onMove);
    badge.addEventListener("pointerup", onUp);
    badge.addEventListener("pointercancel", onUp);
    badge.addEventListener("lostpointercapture", onUp);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      flipObserver.disconnect();
      scene?.dispose();
      delete stage.dataset.glReady;
      delete stage.dataset.ready;
      badge.classList.remove("is-held");
      badge.removeEventListener("pointerdown", onDown);
      badge.removeEventListener("pointermove", onMove);
      badge.removeEventListener("pointerup", onUp);
      badge.removeEventListener("pointercancel", onUp);
      badge.removeEventListener("lostpointercapture", onUp);
    };
  }, [reduced]);

  return (
    <div ref={stageRef} className="lanyard__stage">
      <canvas ref={canvasRef} className="lanyard__gl" aria-hidden="true" />
      <svg className="lanyard__cord" aria-hidden="true">
        <path ref={pathRef} className="lanyard__strap" fill="none" strokeWidth="12" strokeLinecap="round" />
      </svg>
      <div
        ref={badgeRef}
        className="lanyard__badge"
        data-flipped={flipped}
        tabIndex={0}
        role="button"
        aria-pressed={flipped}
        aria-label="Crew pass. Flip to view crew roles."
        onClick={(event) => {
          if (reduced || event.detail === 0) setFlipped((value) => !value);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          if (!event.repeat) setFlipped((value) => !value);
        }}
      >
        <div className="lanyard__clip" aria-hidden="true" />
        <div className="lanyard__flipper" data-pass-inner>
          <div className="lanyard__face lanyard__front" aria-hidden={flipped}>
            <div className="lanyard__fhead text-mono-sm">KIHURN <span>EVENT CREW</span></div>
            <div className="lanyard__photo"><HalftonePortrait variant="badge" /></div>
            <strong className="text-h5">Wong Ki Hurn</strong>
            <p className="lanyard__access text-mono-meta">CREW · ALL ACCESS</p>
          </div>
          <div className="lanyard__face lanyard__back" data-pass-back aria-hidden={!flipped}>
            <div className="lanyard__fhead text-mono-sm">CREW ROLES</div>
            <ul className="lanyard__roles text-mono-meta">
              {crewRoles.map((role) => <li key={role}>{role}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
