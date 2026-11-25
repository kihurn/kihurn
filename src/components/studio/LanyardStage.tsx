"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { HalftonePortrait } from "@/components/chrome/HalftonePortrait";
import {
  computeBadgePose,
  createVerletChain,
  pinTailToPoint,
  releaseTailWithImpulse,
  setChainAnchor,
  stepVerletChain,
} from "@/lib/physics/verlet";

function subReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function getReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function LanyardStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLCanvasElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);
  const reduced = useSyncExternalStore(subReduced, getReduced, () => false);
  const resetSignalRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const haloCanvas = haloRef.current;
    const pathEl = pathRef.current;
    const cardEl = cardRef.current;
    if (!stage || !pathEl || !cardEl) return;

    const haloCtx = haloCanvas?.getContext("2d") ?? null;
    const haloDpr = Math.min(window.devicePixelRatio || 1, 2);

    interface HaloParticle {
      angle: number;
      radius: number;
      speed: number;
      size: number;
      offset: number;
    }
    const particles: HaloParticle[] = Array.from({ length: 68 }, (_, i) => ({
      angle: (i / 68) * Math.PI * 2,
      radius: 150 + ((i * 37) % 140),
      speed: 0.002 + ((i % 5) * 0.0008),
      size: 1.1 + (i % 3) * 0.65,
      offset: i * 0.6,
    }));

    let rect = stage.getBoundingClientRect();
    let anchorX = rect.width * 0.5;
    let anchorY = 16;
    const chain = createVerletChain(anchorX, anchorY, 10, Math.min(26, Math.max(18, rect.height * 0.04)), 34);

    let dragging = false;
    let moved = 0;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    let velY = 0;
    let ptrX = rect.width * 0.5;
    let ptrY = rect.height * 0.5;
    let raf = 0;
    let t = 0;

    const paint = () => {
      const { nodes } = chain;
      if (nodes.length < 2) return;
      let d = `M ${nodes[0].x.toFixed(1)} ${nodes[0].y.toFixed(1)}`;
      for (let i = 1; i < nodes.length - 1; i++) {
        const curr = nodes[i];
        const next = nodes[i + 1];
        const mx = (curr.x + next.x) * 0.5;
        const my = (curr.y + next.y) * 0.5;
        d += ` Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
      }
      const tail = nodes[nodes.length - 1];
      const vx = tail.x - tail.oldX;
      const vy = tail.y - tail.oldY;
      d += ` L ${tail.x.toFixed(1)} ${tail.y.toFixed(1)}`;
      pathEl.setAttribute("d", d);

      const pose = computeBadgePose(chain);
      const tiltY = Math.max(-16, Math.min(16, vx * 1.4));
      const tiltX = Math.max(-12, Math.min(12, -vy * 1.1));
      cardEl.style.transform = `translate3d(${(pose.x - 140).toFixed(1)}px, ${(pose.y - 10).toFixed(1)}px, 0) rotate(${pose.angleDeg.toFixed(2)}deg) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;

      // Draw reactive monochrome particle halo centered around the hanging badge
      if (haloCanvas && haloCtx) {
        const dark = document.documentElement.dataset.theme === "dark";
        const fg = dark ? "rgba(236,236,233," : "rgba(28,28,28,";
        const accent = dark ? "rgba(224,106,74," : "rgba(176,58,30,";
        const energy = Math.min(1.6, Math.hypot(vx, vy) * 0.12);
        const cx = pose.x;
        const cy = pose.y + 160;

        haloCtx.clearRect(0, 0, rect.width, rect.height);
        for (let i = 0; i < particles.length; i++) {
          const pt = particles[i];
          const a = pt.angle + t * pt.speed * 14;
          const r = pt.radius + Math.sin(t * 1.4 + pt.offset) * (8 + energy * 18);
          let px = cx + Math.cos(a) * r * 1.15;
          let py = cy + Math.sin(a) * r * 0.85;
          const dx = px - ptrX;
          const dy = py - ptrY;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 110) {
            const push = (1 - dist / 110) * 18;
            px += (dx / dist) * push;
            py += (dy / dist) * push;
          }
          haloCtx.fillStyle = `${i % 9 === 0 ? accent : fg}${Math.min(0.58, 0.2 + energy * 0.25).toFixed(2)})`;
          haloCtx.beginPath();
          haloCtx.arc(px, py, pt.size + energy * 0.6, 0, Math.PI * 2);
          haloCtx.fill();
        }
      }
    };

    const remeasure = () => {
      rect = stage.getBoundingClientRect();
      anchorX = rect.width * 0.5;
      anchorY = 16;
      setChainAnchor(chain, anchorX, anchorY);
      if (haloCanvas && haloCtx) {
        haloCanvas.width = Math.max(200, Math.round(rect.width * haloDpr));
        haloCanvas.height = Math.max(200, Math.round(rect.height * haloDpr));
        haloCtx.setTransform(haloDpr, 0, 0, haloDpr, 0, 0);
      }
      if (reduced) {
        for (let i = 0; i < chain.nodes.length; i++) {
          chain.nodes[i].x = anchorX;
          chain.nodes[i].y = anchorY + i * chain.segmentLength;
          chain.nodes[i].oldX = chain.nodes[i].x;
          chain.nodes[i].oldY = chain.nodes[i].y;
        }
      }
      paint();
    };

    resetSignalRef.current = () => {
      const fresh = createVerletChain(anchorX, anchorY, chain.nodes.length, chain.segmentLength, 56);
      for (let i = 0; i < chain.nodes.length; i++) {
        chain.nodes[i] = fresh.nodes[i];
      }
      paint();
    };

    const ro = new ResizeObserver(remeasure);
    ro.observe(stage);

    const tick = () => {
      t += 0.025;
      if (!dragging) {
        stepVerletChain(chain, {
          gravity: 0.72,
          damping: 0.986,
          wind: Math.sin(t) * 0.045,
          iterations: 10,
          bounds: {
            minX: 150,
            maxX: Math.max(170, rect.width - 150),
            minY: 16,
            maxY: Math.max(220, rect.height - 260),
          },
        });
      } else {
        stepVerletChain(chain, { gravity: 0.45, damping: 0.94, iterations: 10 });
      }
      paint();
      if (!reduced) raf = requestAnimationFrame(tick);
    };

    remeasure();
    paint();
    if (!reduced) raf = requestAnimationFrame(tick);

    const toStage = (clientX: number, clientY: number) => ({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });

    const onStagePointer = (ev: PointerEvent) => {
      const pt = toStage(ev.clientX, ev.clientY);
      ptrX = pt.x;
      ptrY = pt.y;
    };

    const onDown = (ev: PointerEvent) => {
      rect = stage.getBoundingClientRect();
      const pt = toStage(ev.clientX, ev.clientY);
      const tail = chain.nodes[chain.nodes.length - 1];
      dragging = true;
      moved = 0;
      dragOffsetX = tail.x - pt.x;
      dragOffsetY = tail.y - pt.y;
      lastX = pt.x;
      lastY = pt.y;
      velX = 0;
      velY = 0;
      cardEl.classList.add("is-held");
      try {
        cardEl.setPointerCapture(ev.pointerId);
      } catch {}
    };

    const onMove = (ev: PointerEvent) => {
      const pt = toStage(ev.clientX, ev.clientY);
      ptrX = pt.x;
      ptrY = pt.y;
      if (!dragging) return;
      const nx = Math.max(90, Math.min(rect.width - 90, pt.x + dragOffsetX));
      const ny = Math.max(40, Math.min(rect.height - 160, pt.y + dragOffsetY));
      velX = (pt.x - lastX) * 0.75;
      velY = (pt.y - lastY) * 0.75;
      moved += Math.abs(pt.x - lastX) + Math.abs(pt.y - lastY);
      lastX = pt.x;
      lastY = pt.y;
      pinTailToPoint(chain, nx, ny);
      if (reduced) paint();
    };

    const onUp = (ev: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      cardEl.classList.remove("is-held");
      try {
        if (cardEl.hasPointerCapture(ev.pointerId)) cardEl.releasePointerCapture(ev.pointerId);
      } catch {}
      releaseTailWithImpulse(chain, velX, velY);
      if (moved < 6) {
        setFlipped((f) => !f);
      }
    };

    stage.addEventListener("pointermove", onStagePointer);
    cardEl.addEventListener("pointerdown", onDown);
    cardEl.addEventListener("pointermove", onMove);
    cardEl.addEventListener("pointerup", onUp);
    cardEl.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      stage.removeEventListener("pointermove", onStagePointer);
      cardEl.removeEventListener("pointerdown", onDown);
      cardEl.removeEventListener("pointermove", onMove);
      cardEl.removeEventListener("pointerup", onUp);
      cardEl.removeEventListener("pointercancel", onUp);
    };
  }, [reduced]);

  return (
    <section className="lanyard" aria-label="Interactive studio pass">
      <div className="lanyard__bar">
        <span className="text-mono-meta u-muted">PASS::STUDIO-01 · VERLET PHYSICS</span>
        <div className="lanyard__controls">
          <button
            type="button"
            className="chip text-mono-sm lanyard__btn"
            onClick={() => setFlipped((f) => !f)}
            aria-pressed={flipped}
          >
            {flipped ? "Show front" : "Flip 180°"}
          </button>
          <button
            type="button"
            className="chip text-mono-sm lanyard__btn"
            onClick={() => resetSignalRef.current?.()}
          >
            Swing pass
          </button>
        </div>
      </div>

      <div ref={stageRef} className="lanyard__stage">
        <canvas ref={haloRef} className="lanyard__halo" aria-hidden="true" />
        <div className="lanyard__anchor" aria-hidden="true">
          <span className="lanyard__rivet" />
          <span className="text-mono-sm u-muted">CLAMP::TOP</span>
        </div>

        <svg className="lanyard__cord" aria-hidden="true">
          <path ref={pathRef} className="lanyard__strap" fill="none" strokeWidth="8" strokeLinecap="round" />
        </svg>

        <div
          ref={cardRef}
          className="lanyard__badge"
          data-flipped={flipped ? "true" : "false"}
          tabIndex={0}
          role="button"
          aria-pressed={flipped}
          aria-label="Studio ID pass. Drag to swing or click to flip between credentials and technical manifest."
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped((f) => !f);
            }
          }}
        >
          <div className="lanyard__clip" aria-hidden="true" />
          <div className="lanyard__flipper">
            {/* FRONT */}
            <div className="lanyard__face lanyard__front">
              <div className="lanyard__fhead text-mono-sm">
                <span>KIHURN STUDIO</span>
                <span>ID::KH-001</span>
              </div>
              <div className="lanyard__photo">
                <HalftonePortrait variant="badge" />
              </div>
              <div className="lanyard__identity">
                <h2 className="text-h5">Wong Ki Hurn</h2>
                <p className="text-mono-meta u-muted">CS &amp; SYSTEMS ENGINEER</p>
              </div>
              <dl className="lanyard__kv text-mono-sm">
                <div>
                  <dt>LOC::</dt>
                  <dd>SUBANG JAYA, MY</dd>
                </div>
                <div>
                  <dt>STATUS::</dt>
                  <dd>BOOKING::OPEN</dd>
                </div>
              </dl>
              <svg className="lanyard__barcode" viewBox="0 0 180 20" fill="currentColor" aria-hidden="true">
                <rect x="0" y="0" width="3" height="20" />
                <rect x="6" y="0" width="1.5" height="20" />
                <rect x="10" y="0" width="4" height="20" />
                <rect x="17" y="0" width="2" height="20" />
                <rect x="22" y="0" width="1" height="20" />
                <rect x="27" y="0" width="5" height="20" />
                <rect x="35" y="0" width="2" height="20" />
                <rect x="41" y="0" width="3" height="20" />
                <rect x="48" y="0" width="1.5" height="20" />
                <rect x="53" y="0" width="4" height="20" />
                <rect x="61" y="0" width="2" height="20" />
                <rect x="67" y="0" width="1" height="20" />
                <rect x="72" y="0" width="4" height="20" />
                <rect x="80" y="0" width="2" height="20" />
                <rect x="86" y="0" width="3" height="20" />
                <rect x="93" y="0" width="1.5" height="20" />
                <rect x="99" y="0" width="5" height="20" />
                <rect x="108" y="0" width="2" height="20" />
                <rect x="114" y="0" width="3" height="20" />
                <rect x="121" y="0" width="1" height="20" />
                <rect x="126" y="0" width="4" height="20" />
                <rect x="134" y="0" width="2" height="20" />
                <rect x="140" y="0" width="3" height="20" />
                <rect x="147" y="0" width="1.5" height="20" />
                <rect x="152" y="0" width="4" height="20" />
                <rect x="160" y="0" width="2" height="20" />
                <rect x="166" y="0" width="3" height="20" />
                <rect x="173" y="0" width="5" height="20" />
              </svg>
            </div>

            {/* BACK */}
            <div className="lanyard__face lanyard__back">
              <div className="lanyard__fhead text-mono-sm">
                <span>PRESS MANIFEST</span>
                <span>REV::2026.11</span>
              </div>
              <dl className="lanyard__spec text-mono-meta">
                <div>
                  <dt>RUNTIME::</dt>
                  <dd>NEXT 16 · TS · THREE.JS</dd>
                </div>
                <div>
                  <dt>GATEWAY::</dt>
                  <dd>C0RE (RUST + OLLAMA)</dd>
                </div>
                <div>
                  <dt>MESH::</dt>
                  <dd>TAILSCALE PRIVATE</dd>
                </div>
                <div>
                  <dt>TIMEZONE::</dt>
                  <dd>ASIA/KUALA_LUMPUR (+08)</dd>
                </div>
                <div>
                  <dt>CLEARANCE::</dt>
                  <dd>FULL-STACK / NET / AI</dd>
                </div>
              </dl>
              <p className="lanyard__note text-mono-sm u-muted">
                Grab and fling this pass to inspect tension. Click or press Space to flip.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
