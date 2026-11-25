"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { ExperimentSpec } from "@/content/experiments";

interface TuneParams {
  speed: number;
  amplitude: number;
  damping: number;
  wireframe: boolean;
}

const DEFAULTS: TuneParams = {
  speed: 1.0,
  amplitude: 1.0,
  damping: 0.88,
  wireframe: false,
};

function detectSoftwareGl(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  try {
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
    return /SwiftShader|llvmpipe|Software Rasterizer|WARP/i.test(renderer);
  } catch {
    return false;
  }
}

export function ExperimentWorkbench({
  spec,
  prev,
  next,
}: {
  spec: ExperimentSpec;
  prev: ExperimentSpec | null;
  next: ExperimentSpec | null;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [params, setParams] = useState<TuneParams>(DEFAULTS);
  const paramsRef = useRef<TuneParams>(DEFAULTS);
  const [tuneOpen, setTuneOpen] = useState(true);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [soundClick, setSoundClick] = useState(false);
  const [notchLabel, setNotchLabel] = useState("NOTCH::00");
  const audioLevelRef = useRef(0);
  const soundClickRef = useRef(false);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    soundClickRef.current = soundClick;
  }, [soundClick]);

  useEffect(() => {
    if (spec.slug !== "vocal-orb" || !micActive) {
      audioLevelRef.current = 0;
      return;
    }
    let stopped = false;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;

    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((s) => {
        if (stopped) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const src = ctx.createMediaStreamSource(s);
        src.connect(analyser);
        const buf = new Uint8Array(analyser.frequencyBinCount);
        const sample = () => {
          if (stopped) return;
          analyser.getByteFrequencyData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i];
          audioLevelRef.current = Math.min(1, (sum / buf.length / 128) * 1.6);
          raf = requestAnimationFrame(sample);
        };
        sample();
      })
      .catch(() => {
        setMicActive(false);
      });

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => {});
    };
  }, [spec.slug, micActive]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (spec.slug === "vocal-orb" || spec.slug === "paper-poster") {
      const canvas = document.createElement("canvas");
      canvas.className = "workbench__canvas";
      host.innerHTML = "";
      host.appendChild(canvas);

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setClearColor(0, 0);
      const software = detectSoftwareGl(renderer.getContext());
      const maxDpr = software ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(maxDpr);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.z = spec.slug === "vocal-orb" ? 3.3 : 2.9;

      const pointer = new THREE.Vector2(0.5, 0.5);
      const pointerVel = new THREE.Vector2(0, 0);
      let lastPx = 0.5;
      let lastPy = 0.5;

      let geometry: THREE.BufferGeometry;
      let material: THREE.ShaderMaterial;
      let mesh: THREE.Mesh;

      if (spec.slug === "vocal-orb") {
        geometry = new THREE.SphereGeometry(1.05, software ? 40 : 72, software ? 30 : 54);
        material = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uAmp: { value: 0.22 },
            uInk: { value: new THREE.Color(0x1e1e1e) },
            uPaper: { value: new THREE.Color(0xd6d6d5) },
            uSpot: { value: new THREE.Color(0xb03a1e) },
            uPointer: { value: new THREE.Vector2(0, 0) },
          },
          vertexShader: `
            varying vec3 vNormal;
            varying float vDisp;
            uniform float uTime;
            uniform float uAmp;
            uniform vec2 uPointer;

            float waveNoise(vec3 p) {
              return sin(p.x * 3.1 + uTime) * cos(p.y * 2.7 - uTime * 0.8) * sin(p.z * 3.4 + uTime * 0.6);
            }

            void main() {
              vec3 pos = position;
              float n = waveNoise(pos * 1.45) * 0.65 + waveNoise(pos * 2.9) * 0.35;
              float pull = (pos.x * uPointer.x + pos.y * uPointer.y) * 0.14;
              float d = n * uAmp + pull;
              pos += normal * d;
              vDisp = d;
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            varying float vDisp;
            uniform vec3 uInk;
            uniform vec3 uPaper;
            uniform vec3 uSpot;

            void main() {
              vec3 n = normalize(vNormal);
              float fresnel = pow(1.0 - max(dot(n, vec3(0.0, 0.0, 1.0)), 0.0), 2.1);
              float bands = step(0.02, sin(vDisp * 28.0));
              vec3 col = mix(uPaper * 0.85, uInk, clamp(fresnel * 1.15 + bands * 0.22, 0.0, 1.0));
              col = mix(col, uSpot, clamp(fresnel * 0.32, 0.0, 0.45));
              gl_FragColor = vec4(col, 1.0);
            }
          `,
          wireframe: paramsRef.current.wireframe,
        });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      } else {
        geometry = new THREE.PlaneGeometry(1.55, 2.05, software ? 20 : 34, software ? 26 : 44);
        material = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uAmp: { value: 0.25 },
            uPointer: { value: new THREE.Vector2(0.5, 0.5) },
            uVel: { value: new THREE.Vector2(0, 0) },
            uInk: { value: new THREE.Color(0x1e1e1e) },
            uPaper: { value: new THREE.Color(0xf2f1ee) },
          },
          vertexShader: `
            varying vec2 vUv;
            varying float vBend;
            uniform float uTime;
            uniform float uAmp;
            uniform vec2 uPointer;
            uniform vec2 uVel;

            void main() {
              vUv = uv;
              vec3 pos = position;
              float dist = distance(uv, uPointer);
              float bow = exp(-dist * dist * 6.0) * uAmp;
              float ripple = sin(uv.y * 7.5 - uTime * 1.8) * length(uVel) * 0.65;
              pos.z += bow + ripple;
              pos.x += (uv.y - 0.5) * uVel.x * 0.4;
              vBend = bow + ripple;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `,
          fragmentShader: `
            varying vec2 vUv;
            varying float vBend;
            uniform vec3 uInk;
            uniform vec3 uPaper;

            void main() {
              vec2 grid = abs(fract(vUv * vec2(8.0, 11.0) - 0.5) - 0.5) / fwidth(vUv * vec2(8.0, 11.0));
              float rule = 1.0 - min(min(grid.x, grid.y), 1.0);
              float border = step(0.03, vUv.x) * step(vUv.x, 0.97) * step(0.025, vUv.y) * step(vUv.y, 0.975);
              float circle = smoothstep(0.29, 0.285, distance(vUv, vec2(0.5, 0.54)));
              float bar = step(0.1, vUv.x) * step(vUv.x, 0.9) * step(0.14, vUv.y) * step(vUv.y, 0.165);
              float shade = clamp(vBend * 0.7, -0.14, 0.16);
              vec3 base = mix(uInk, uPaper + shade, border);
              base = mix(base, uInk, rule * 0.12);
              base = mix(base, uInk, max(circle, bar) * 0.9);
              gl_FragColor = vec4(base, 1.0);
            }
          `,
          side: THREE.DoubleSide,
          wireframe: paramsRef.current.wireframe,
        });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      }

      const syncThemeColors = () => {
        const dark = document.documentElement.dataset.theme === "dark";
        if (spec.slug === "vocal-orb") {
          material.uniforms.uInk.value.set(dark ? 0xd6d6d5 : 0x1e1e1e);
          material.uniforms.uPaper.value.set(dark ? 0x1e1e1e : 0xd6d6d5);
        } else {
          material.uniforms.uInk.value.set(dark ? 0xd6d6d5 : 0x1e1e1e);
          material.uniforms.uPaper.value.set(dark ? 0x262626 : 0xf2f1ee);
        }
      };
      syncThemeColors();

      const mo = new MutationObserver(syncThemeColors);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

      const resize = () => {
        const r = host.getBoundingClientRect();
        const w = Math.max(240, r.width);
        const h = Math.max(240, r.height);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      const onPointerMove = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        const nx = (e.clientX - r.left) / Math.max(1, r.width);
        const ny = 1 - (e.clientY - r.top) / Math.max(1, r.height);
        pointerVel.set(nx - lastPx, ny - lastPy);
        lastPx = nx;
        lastPy = ny;
        pointer.set(nx, ny);
      };
      host.addEventListener("pointermove", onPointerMove);

      let raf = 0;
      let timer = 0;
      let stopped = false;
      let t = 0;
      const gl = renderer.getContext();

      const afterDraw = (nextFrame: () => void) => {
        if (stopped) return;
        if (!software) {
          raf = requestAnimationFrame(nextFrame);
          return;
        }
        const gl2 = "fenceSync" in gl ? (gl as WebGL2RenderingContext) : null;
        const sync = gl2 ? gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
        if (gl2 && sync) {
          gl.flush();
          const poll = () => {
            if (stopped) {
              gl2.deleteSync(sync);
              return;
            }
            const res = gl2.clientWaitSync(sync, 0, 0);
            if (res === gl2.TIMEOUT_EXPIRED) {
              timer = window.setTimeout(poll, 16);
              return;
            }
            gl2.deleteSync(sync);
            timer = window.setTimeout(() => {
              if (!stopped) raf = requestAnimationFrame(nextFrame);
            }, 64);
          };
          timer = window.setTimeout(poll, 16);
        } else {
          timer = window.setTimeout(() => {
            if (!stopped) raf = requestAnimationFrame(nextFrame);
          }, 80);
        }
      };

      const tick = () => {
        if (stopped) return;
        const p = paramsRef.current;
        t += (reduced ? 0.002 : 0.016) * p.speed;
        const dark = document.documentElement.dataset.theme === "dark";
        material.wireframe = p.wireframe;

        if (spec.slug === "vocal-orb") {
          const synth = 0.2 + Math.abs(Math.sin(t * 2.1) * Math.cos(t * 0.9)) * 0.22;
          const amp = (audioLevelRef.current > 0.02 ? audioLevelRef.current * 0.45 : synth) * p.amplitude;
          material.uniforms.uTime.value = t;
          material.uniforms.uAmp.value = amp;
          material.uniforms.uPointer.value.lerp(
            new THREE.Vector2((pointer.x - 0.5) * 2, (pointer.y - 0.5) * 2),
            1 - Math.min(0.96, p.damping) + 0.04,
          );
          mesh.rotation.y += 0.005 * p.speed;
          mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, (pointer.y - 0.5) * 0.6, 0.08);
          material.uniforms.uSpot.value.set(dark ? 0xe06a4a : 0xb03a1e);
        } else {
          material.uniforms.uTime.value = t;
          material.uniforms.uAmp.value = 0.28 * p.amplitude;
          material.uniforms.uPointer.value.lerp(pointer, 0.14);
          material.uniforms.uVel.value.lerp(pointerVel, 0.2);
          pointerVel.multiplyScalar(p.damping);
          mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, (pointer.x - 0.5) * 0.45, 0.08);
          mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, -(pointer.y - 0.5) * 0.35, 0.08);
        }

        renderer.render(scene, camera);
        afterDraw(tick);
      };
      tick();

      return () => {
        stopped = true;
        clearTimeout(timer);
        cancelAnimationFrame(raf);
        ro.disconnect();
        mo.disconnect();
        host.removeEventListener("pointermove", onPointerMove);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    }

    if (spec.slug === "polka-field") {
      const canvas = document.createElement("canvas");
      canvas.className = "workbench__canvas";
      host.innerHTML = "";
      host.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let width = 600;
      let height = 400;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      interface Cell {
        hx: number;
        hy: number;
        x: number;
        y: number;
        vx: number;
        vy: number;
      }
      let cells: Cell[] = [];
      const pointer = { x: -999, y: -999, active: false };

      const rebuild = () => {
        const r = host.getBoundingClientRect();
        width = Math.max(240, Math.round(r.width));
        height = Math.max(240, Math.round(r.height));
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const gap = 24;
        const cols = Math.floor(width / gap);
        const rows = Math.floor(height / gap);
        const ox = (width - (cols - 1) * gap) * 0.5;
        const oy = (height - (rows - 1) * gap) * 0.5;
        cells = [];
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const hx = ox + col * gap;
            const hy = oy + row * gap;
            cells.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0 });
          }
        }
      };

      rebuild();
      const ro = new ResizeObserver(rebuild);
      ro.observe(host);

      const onMove = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
        pointer.active = true;
      };
      const onLeave = () => {
        pointer.active = false;
      };
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);

      let raf = 0;
      let t = 0;
      const draw = () => {
        const p = paramsRef.current;
        t += 0.025 * p.speed;
        const dark = document.documentElement.dataset.theme === "dark";
        const ink = dark ? "#d6d6d5" : "#1e1e1e";
        const accent = dark ? "#e06a4a" : "#b03a1e";

        ctx.clearRect(0, 0, width, height);
        const px = pointer.active ? pointer.x : width * 0.5 + Math.cos(t * 0.8) * (width * 0.22);
        const py = pointer.active ? pointer.y : height * 0.5 + Math.sin(t * 1.1) * (height * 0.16);
        const radius = 120 * p.amplitude;

        for (let i = 0; i < cells.length; i++) {
          const c = cells[i];
          const dx = c.x - px;
          const dy = c.y - py;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < radius && !reduced) {
            const push = (1 - dist / radius) * 2.2 * p.amplitude;
            c.vx += (dx / dist) * push;
            c.vy += (dy / dist) * push;
          }
          c.vx = (c.vx + (c.hx - c.x) * 0.12) * p.damping;
          c.vy = (c.vy + (c.hy - c.y) * 0.12) * p.damping;
          c.x += c.vx;
          c.y += c.vy;

          const disp = Math.hypot(c.x - c.hx, c.y - c.hy);
          const dotR = Math.min(7.5, 2.3 + disp * 0.12);
          if (p.wireframe) {
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(c.hx, c.hy);
            ctx.lineTo(c.x, c.y);
            ctx.stroke();
          }
          ctx.fillStyle = disp > 10 ? accent : ink;
          ctx.beginPath();
          ctx.arc(c.x, c.y, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
        raf = requestAnimationFrame(draw);
      };
      draw();

      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        host.removeEventListener("pointermove", onMove);
        host.removeEventListener("pointerleave", onLeave);
      };
    }

    const canvas = document.createElement("canvas");
    canvas.className = "workbench__canvas";
    host.innerHTML = "";
    host.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 500;
    let height = 400;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = host.getBoundingClientRect();
      width = Math.max(240, Math.round(r.width));
      height = Math.max(240, Math.round(r.height));
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let angle = 0;
    let angVel = 0;
    let dragging = false;
    let prevPtrAngle = 0;
    let lastNotch = 0;
    let audioCtx: AudioContext | null = null;

    const clickTick = () => {
      if (!soundClickRef.current) return;
      try {
        if (!audioCtx) audioCtx = new AudioContext();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1100, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.035);
      } catch {}
    };

    const ptrAngle = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height * 0.5), e.clientX - (r.left + r.width * 0.5));
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      prevPtrAngle = ptrAngle(e);
      try {
        host.setPointerCapture(e.pointerId);
      } catch {}
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const cur = ptrAngle(e);
      let d = cur - prevPtrAngle;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      angle += d;
      angVel = d * 0.65;
      prevPtrAngle = cur;
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      try {
        if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId);
      } catch {}
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      angVel += (e.deltaY || e.deltaX) * 0.0016 * paramsRef.current.speed;
    };

    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointercancel", onUp);
    host.addEventListener("wheel", onWheel, { passive: false });

    const step = (Math.PI * 2) / 12;
    let raf = 0;
    const draw = () => {
      const p = paramsRef.current;
      const dark = document.documentElement.dataset.theme === "dark";
      const ink = dark ? "#d6d6d5" : "#1e1e1e";
      const muted = dark ? "rgba(214,214,213,0.35)" : "rgba(30,30,30,0.35)";
      const accent = dark ? "#e06a4a" : "#b03a1e";

      if (!dragging && !reduced) {
        const nearest = Math.round(angle / step) * step;
        const torque = (nearest - angle) * 0.14 * p.amplitude;
        angVel = (angVel + torque) * p.damping;
        angle += angVel;
      }

      const notch = ((Math.round(angle / step) % 12) + 12) % 12;
      if (notch !== lastNotch) {
        lastNotch = notch;
        setNotchLabel(`NOTCH::${String(notch).padStart(2, "0")}`);
        clickTick();
      }

      ctx.clearRect(0, 0, width, height);
      const cx = width * 0.5;
      const cy = height * 0.5;
      const radius = Math.min(width, height) * 0.31;

      for (let i = 0; i < 12; i++) {
        const a = i * step - Math.PI / 2;
        const active = i === notch;
        ctx.strokeStyle = active ? accent : muted;
        ctx.lineWidth = active ? 2.5 : 1.25;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (radius + 14), cy + Math.sin(a) * (radius + 14));
        ctx.lineTo(cx + Math.cos(a) * (radius + (active ? 30 : 24)), cy + Math.sin(a) * (radius + (active ? 30 : 24)));
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      if (p.wireframe) {
        ctx.strokeStyle = muted;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
        ctx.moveTo(-radius, 0);
        ctx.lineTo(radius, 0);
        ctx.moveTo(0, -radius);
        ctx.lineTo(0, radius);
        ctx.stroke();
      }

      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.3);
      ctx.lineTo(0, -radius + 8);
      ctx.stroke();

      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
      host.removeEventListener("wheel", onWheel);
      audioCtx?.close().catch(() => {});
    };
  }, [spec.slug]);

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(spec.snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <main id="main" className="labpage case">
      <Link className="case__back text-mono-meta" href="/lab">
        ← LAB::INDEX
      </Link>

      <header className="labpage__head">
        <p className="text-mono-meta u-muted">
          EXP::{spec.index} · {spec.engine} · {spec.year}
        </p>
        <h1 className="text-display">{spec.title}</h1>
        <p className="labpage__intro text-body">{spec.subtitle}</p>
      </header>

      <section className="workbench" aria-label={`${spec.title} interactive stage`}>
        <div className="workbench__hud text-mono-sm">
          <span>STAGE::{spec.slug.toUpperCase()}</span>
          {spec.slug === "rotary-detent" ? <span>{notchLabel}</span> : null}
          <div className="workbench__hud-actions">
            {spec.slug === "vocal-orb" ? (
              <button
                type="button"
                className="chip text-mono-sm workbench__btn"
                aria-pressed={micActive}
                onClick={() => setMicActive((m) => !m)}
              >
                {micActive ? "Mic::LIVE" : "Mic::SYNTH"}
              </button>
            ) : null}
            {spec.slug === "rotary-detent" ? (
              <button
                type="button"
                className="chip text-mono-sm workbench__btn"
                aria-pressed={soundClick}
                onClick={() => setSoundClick((s) => !s)}
              >
                {soundClick ? "Click::ON" : "Click::MUTE"}
              </button>
            ) : null}
            <button
              type="button"
              className="chip text-mono-sm workbench__btn"
              aria-expanded={sourceOpen}
              onClick={() => setSourceOpen((s) => !s)}
            >
              {sourceOpen ? "Close Code" : "Code"}
            </button>
            <button
              type="button"
              className="chip text-mono-sm workbench__btn"
              aria-expanded={tuneOpen}
              onClick={() => setTuneOpen((o) => !o)}
            >
              {tuneOpen ? "Close Tune" : "Tune"}
            </button>
          </div>
        </div>

        <div className="workbench__stage-wrap">
          <div ref={hostRef} className="workbench__stage" />

          {tuneOpen || sourceOpen ? (
            <div className="workbench__drawers">
              {tuneOpen ? (
                <div className="workbench__drawer" role="region" aria-label="Experiment parameters">
                  <div className="workbench__drawer-head text-mono-sm">
                    <span>TUNE::PARAMS</span>
                    <button
                      type="button"
                      className="chip text-mono-sm workbench__btn"
                      onClick={() => setParams(DEFAULTS)}
                    >
                      Reset
                    </button>
                  </div>
                  <label className="workbench__ctrl text-mono-sm">
                    <span>SPEED ({params.speed.toFixed(1)}×)</span>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.1"
                      value={params.speed}
                      onChange={(e) => setParams((p) => ({ ...p, speed: Number(e.target.value) }))}
                    />
                  </label>
                  <label className="workbench__ctrl text-mono-sm">
                    <span>AMPLITUDE ({params.amplitude.toFixed(1)}×)</span>
                    <input
                      type="range"
                      min="0.3"
                      max="2.2"
                      step="0.1"
                      value={params.amplitude}
                      onChange={(e) => setParams((p) => ({ ...p, amplitude: Number(e.target.value) }))}
                    />
                  </label>
                  <label className="workbench__ctrl text-mono-sm">
                    <span>DAMP ({params.damping.toFixed(2)})</span>
                    <input
                      type="range"
                      min="0.7"
                      max="0.96"
                      step="0.01"
                      value={params.damping}
                      onChange={(e) => setParams((p) => ({ ...p, damping: Number(e.target.value) }))}
                    />
                  </label>
                  <div className="workbench__ctrl-btns">
                    <button
                      type="button"
                      className="chip text-mono-sm workbench__btn"
                      aria-pressed={params.wireframe}
                      onClick={() => setParams((p) => ({ ...p, wireframe: !p.wireframe }))}
                    >
                      {params.wireframe ? "MeshMode::WIRE" : "MeshMode::INK"}
                    </button>
                  </div>
                </div>
              ) : null}

              {sourceOpen ? (
                <div className="workbench__drawer workbench__drawer--code" role="region" aria-label="Source snippet">
                  <div className="workbench__drawer-head text-mono-sm">
                    <span className="u-muted">{spec.snippetLabel}</span>
                    <button type="button" className="chip text-mono-sm workbench__btn" onClick={copySnippet}>
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre>
                    <code className="text-mono-meta">{spec.snippet}</code>
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="lab-sec" aria-labelledby="exp-notes">
        <h2 id="exp-notes" className="lab-sec__title text-label">
          Implementation notes
        </h2>
        <p className="text-body">{spec.summary}</p>
      </section>

      <nav className="workbench__pager" aria-label="Adjacent experiments">
        {prev ? (
          <Link href={`/lab/${prev.slug}`} className="workbench__pager-link">
            <span className="text-mono-sm u-muted">‹ PREV · EXP::{prev.index}</span>
            <span className="text-tag">{prev.title}</span>
          </Link>
        ) : (
          <span className="workbench__pager-link is-disabled" aria-disabled="true">
            <span className="text-mono-sm u-muted">‹ START</span>
          </span>
        )}
        <div className="workbench__pager-count text-mono-meta" aria-label={`Experiment ${spec.index} of 04`}>
          &lt; {spec.index} / 04 &gt;
        </div>
        {next ? (
          <Link href={`/lab/${next.slug}`} className="workbench__pager-link workbench__pager-link--next">
            <span className="text-mono-sm u-muted">NEXT · EXP::{next.index} ›</span>
            <span className="text-tag">{next.title}</span>
          </Link>
        ) : (
          <span className="workbench__pager-link workbench__pager-link--next is-disabled" aria-disabled="true">
            <span className="text-mono-sm u-muted">END ›</span>
          </span>
        )}
      </nav>
    </main>
  );
}
