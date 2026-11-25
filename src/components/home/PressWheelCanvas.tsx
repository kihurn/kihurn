"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  createBeveledTileGeometry,
  paintIconEmblemCanvas,
  paintProjectPlateCanvas,
} from "@/lib/pressWheelTextures";
import { wrapHalfOffset } from "@/lib/wheelMath";
import type { WheelItem } from "./ProjectWheels";

export interface WheelSimState {
  pos: number;
  vel: number;
  pointerX: number;
  pointerY: number;
  pointerVelX: number;
  pointerVelY: number;
  stacked: boolean;
}

function detectSoftwareGl(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  try {
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
    return /SwiftShader|llvmpipe|softpipe|Software|WARP/i.test(renderer);
  } catch {
    return false;
  }
}

interface PlateTextureHandle {
  map: THREE.CanvasTexture;
  depth: THREE.CanvasTexture;
  repaint: (dark: boolean) => void;
}

function buildPlateTexture(item: WheelItem, index: number, dark: boolean): PlateTextureHandle {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;

  let currentDark = dark;
  let loadedImg: HTMLImageElement | undefined;
  paintProjectPlateCanvas(canvas, item, index, currentDark);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    loadedImg = img;
    paintProjectPlateCanvas(canvas, item, index, currentDark, loadedImg);
    map.needsUpdate = true;
  };
  if (item.photo) img.src = item.photo;

  const repaint = (nextDark: boolean) => {
    currentDark = nextDark;
    paintProjectPlateCanvas(canvas, item, index, currentDark, loadedImg);
    map.needsUpdate = true;
  };

  const dCanvas = document.createElement("canvas");
  dCanvas.width = 128;
  dCanvas.height = 128;
  const dCtx = dCanvas.getContext("2d")!;
  const grad = dCtx.createRadialGradient(64, 64, 10, 64, 64, 72);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.55, "#888888");
  grad.addColorStop(1, "#1c1c1c");
  dCtx.fillStyle = grad;
  dCtx.fillRect(0, 0, 128, 128);
  const depth = new THREE.CanvasTexture(dCanvas);
  depth.needsUpdate = true;

  return { map, depth, repaint };
}

function buildEmblemTexture(item: WheelItem, index: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 320;
  paintIconEmblemCanvas(canvas, item, index);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    paintIconEmblemCanvas(canvas, item, index, img);
    map.needsUpdate = true;
  };
  img.src = item.plate;

  return map;
}

const PLATE_VERTEX_SHADER = `
  varying vec2 vUv;
  uniform vec2 uVel;
  uniform float uBend;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float arc = sin(uv.x * 3.14159265);
    pos.z += arc * uBend + (uv.y - 0.5) * uVel.y * 0.18 + (uv.x - 0.5) * uVel.x * 0.14;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const PLATE_FRAGMENT_SHADER = `
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform sampler2D uDepth;
  uniform vec2 uPointer;
  uniform vec2 uVel;
  uniform float uOpacity;
  uniform float uActive;
  uniform float uGlitch;
  uniform float uTime;

  void main() {
    float depth = texture2D(uDepth, vUv).r;
    vec2 parallax = (uPointer - 0.5) * (depth - 0.5) * (0.045 * uActive) + uVel * depth * 0.025;

    float scan = sin(vUv.y * 140.0 + uTime * 22.0);
    float scanJitter = step(0.84, abs(scan)) * scan * uGlitch * 0.012;
    vec2 baseUv = clamp(vUv + parallax + vec2(scanJitter, 0.0), 0.004, 0.996);

    float chroma = uGlitch * 0.014;
    float r = texture2D(uMap, clamp(baseUv + vec2(chroma, 0.0), 0.002, 0.998)).r;
    float g = texture2D(uMap, baseUv).g;
    float b = texture2D(uMap, clamp(baseUv - vec2(chroma, 0.0), 0.002, 0.998)).b;
    float a = texture2D(uMap, baseUv).a;

    float vignette = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x)
                   * smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y);
    float dim = mix(0.68, 1.0, uActive);

    float lineMask = 1.0 - (step(0.5, fract(vUv.y * 90.0)) * 0.08 * uGlitch);

    gl_FragColor = vec4(vec3(r, g, b) * dim * lineMask, a * uOpacity * mix(0.9, 1.0, vignette));
  }
`;

export function PressWheelCanvas({
  items,
  simRef,
}: {
  items: WheelItem[];
  simRef: React.RefObject<WheelSimState>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    const gl = renderer.getContext();
    renderer.setClearColor(0, 0);
    const software = detectSoftwareGl(gl);
    renderer.setPixelRatio(software ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 7.4;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.65);
    keyLight.position.set(4.5, 5.2, 6.0);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd6d6d5, 0.85);
    rimLight.position.set(-5.0, -2.5, 4.5);
    scene.add(rimLight);

    const photoGeo = new THREE.PlaneGeometry(3.2, 1.8, software ? 10 : 18, software ? 6 : 12);
    const tileBevelGeo = createBeveledTileGeometry(1.22, 0.22, 0.12, software ? 2 : 3, software ? 5 : 8);
    const tileFaceGeo = new THREE.PlaneGeometry(1.06, 1.06);

    const tileBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x161616,
      metalness: 0.28,
      roughness: 0.22,
      clearcoat: 0.85,
      clearcoatRoughness: 0.16,
      transparent: true,
      opacity: 1,
    });

    const isDark = () => document.documentElement.dataset.theme === "dark";
    const texturesToDispose: THREE.Texture[] = [envTex];
    const materialsToDispose: THREE.Material[] = [tileBodyMat];
    const repainters: Array<(dark: boolean) => void> = [];

    const leftMeshes: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
    const rightGroups: Array<{
      group: THREE.Group;
      bodyMat: THREE.MeshPhysicalMaterial;
      faceMat: THREE.MeshBasicMaterial;
    }> = [];

    items.forEach((item, i) => {
      const dark = isDark();
      const plateTex = buildPlateTexture(item, i, dark);
      texturesToDispose.push(plateTex.map, plateTex.depth);
      repainters.push(plateTex.repaint);

      const plateMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uMap: { value: plateTex.map },
          uDepth: { value: plateTex.depth },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uVel: { value: new THREE.Vector2(0, 0) },
          uOpacity: { value: 1 },
          uActive: { value: 1 },
          uBend: { value: 0.08 },
          uGlitch: { value: 0 },
          uTime: { value: 0 },
        },
        vertexShader: PLATE_VERTEX_SHADER,
        fragmentShader: PLATE_FRAGMENT_SHADER,
      });
      materialsToDispose.push(plateMat);
      const plateMesh = new THREE.Mesh(photoGeo, plateMat);
      scene.add(plateMesh);
      leftMeshes.push(plateMesh);

      const emblemMap = buildEmblemTexture(item, i);
      texturesToDispose.push(emblemMap);
      const bodyMat = tileBodyMat.clone();
      const faceMat = new THREE.MeshBasicMaterial({
        map: emblemMap,
        transparent: true,
        opacity: 1,
      });
      materialsToDispose.push(bodyMat, faceMat);

      const group = new THREE.Group();
      const bodyMesh = new THREE.Mesh(tileBevelGeo, bodyMat);
      const faceMesh = new THREE.Mesh(tileFaceGeo, faceMat);
      faceMesh.position.z = 0.112;
      group.add(bodyMesh, faceMesh);
      scene.add(group);
      rightGroups.push({ group, bodyMat, faceMat });
    });

    const themeObs = new MutationObserver(() => {
      const nextDark = isDark();
      repainters.forEach((fn) => fn(nextDark));
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let viewW = 1200;
    let viewH = 800;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const r = parent.getBoundingClientRect();
      viewW = Math.max(320, r.width);
      viewH = Math.max(320, r.height);
      camera.aspect = viewW / viewH;
      camera.updateProjectionMatrix();
      renderer.setSize(viewW, viewH, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const N = items.length;
    let frameHandle = 0;
    let disposed = false;
    let prevPos = simRef.current?.pos ?? 0;
    let smoothGlitch = 0;
    const tStart = performance.now();

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl2 = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl2.fenceSync === "function") {
        const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl2.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl2.deleteSync(sync);
            return;
          }
          const state = sync ? gl2.getSyncParameter(sync, gl2.SYNC_STATUS) : gl2.SIGNALED;
          if (state === gl2.UNSIGNALED) {
            frameHandle = window.setTimeout(poll, 5);
          } else {
            if (sync) gl2.deleteSync(sync);
            frameHandle = window.setTimeout(cb, 80);
          }
        };
        frameHandle = window.setTimeout(poll, 5);
      } else {
        frameHandle = window.setTimeout(cb, 80);
      }
    }

    const tick = () => {
      if (disposed) return;
      const nowSec = (performance.now() - tStart) * 0.001;
      const s = simRef.current;
      const stacked = viewW < 768 || Boolean(s?.stacked);
      const aspect = viewW / Math.max(1, viewH);
      const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
      const halfW = halfH * aspect;

      const pos = s?.pos ?? 0;
      const deltaPos = pos - prevPos;
      prevPos = pos;
      const targetGlitch = Math.min(1, (Math.abs(deltaPos) * 16 + Math.abs(s?.vel ?? 0) * 12));
      smoothGlitch += (targetGlitch - smoothGlitch) * 0.18;
      if (smoothGlitch < 0.005) smoothGlitch = 0;

      const px = s?.pointerX ?? 0.5;
      const py = s?.pointerY ?? 0.5;
      const vx = s?.pointerVelX ?? 0;
      const vy = s?.pointerVelY ?? 0;

      for (let i = 0; i < N; i++) {
        const off = wrapHalfOffset(i - pos, N);
        const absOff = Math.abs(off);
        const activeWeight = Math.max(0, 1 - absOff * 0.85);

        const L = leftMeshes[i];
        const R = rightGroups[i];

        if (stacked) {
          const angle = off * 0.72;
          const rad = halfH * 0.28;
          const lx = -halfW * 0.16 + Math.sin(angle) * (halfW * 0.22);
          const ly = halfH * 0.34 - Math.sin(angle) * rad;
          const lz = Math.cos(angle) * 0.55 - 0.55;
          const lVis = absOff < 1.65;
          const lOpacity = lVis ? Math.max(0, 1 - absOff * 0.62) : 0;

          L.visible = lOpacity > 0.02;
          L.position.set(lx, ly, lz);
          L.rotation.set(off * 0.14, -off * 0.18, -off * 0.24);
          const ls = (0.64 - Math.min(0.22, absOff * 0.12)) * Math.min(1, aspect * 1.4);
          L.scale.setScalar(Math.max(0.28, ls));
          L.material.uniforms.uOpacity.value = lOpacity;
          L.material.uniforms.uActive.value = activeWeight;
          L.material.uniforms.uPointer.value.set(px, py);
          L.material.uniforms.uVel.value.set(vx, vy);
          L.material.uniforms.uGlitch.value = smoothGlitch;
          L.material.uniforms.uTime.value = nowSec;

          const rx = halfW * 0.42 - Math.cos(angle * 1.1) * 0.16;
          const ry = halfH * 0.4 + Math.sin(-angle * 1.1) * rad * 0.75;
          const rOpacity = lVis ? Math.max(0, 1 - absOff * 0.68) : 0;
          R.group.visible = rOpacity > 0.02;
          R.group.position.set(rx, ry, lz - 0.1);
          R.group.rotation.set((py - 0.5) * 0.16, -0.25 + (px - 0.5) * 0.22, -0.14 - off * 0.44);
          R.group.scale.setScalar(Math.max(0.32, ls * 0.8));
          R.bodyMat.opacity = rOpacity;
          R.faceMat.opacity = rOpacity;
        } else {
          const lAngle = off * 1.02;
          const lRadiusX = halfW * 0.44;
          const lRadiusY = halfH * 0.74;
          const lx = -halfW * 0.94 + Math.cos(lAngle) * lRadiusX;
          const ly = -halfH * 0.04 + Math.sin(lAngle) * lRadiusY;
          const lz = Math.cos(lAngle) * 0.9 - 0.85;
          const lVis = absOff < 2.25;
          const lOpacity = lVis ? Math.max(0, 1 - Math.max(0, absOff - 1.05) * 0.92) : 0;

          L.visible = lOpacity > 0.02;
          L.position.set(lx, ly, lz);
          L.rotation.set(off * 0.1, 0.22 - off * 0.14, off * 0.42);
          const ls = 1 - Math.min(0.34, absOff * 0.16);
          L.scale.setScalar(ls);
          L.material.uniforms.uOpacity.value = lOpacity;
          L.material.uniforms.uActive.value = activeWeight;
          L.material.uniforms.uPointer.value.set(px, py);
          L.material.uniforms.uVel.value.set(vx, vy);
          L.material.uniforms.uBend.value = 0.08 + Math.min(0.18, smoothGlitch * 0.14);
          L.material.uniforms.uGlitch.value = smoothGlitch;
          L.material.uniforms.uTime.value = nowSec;

          const rAngle = -off * 1.45;
          const rRadiusX = halfW * 0.34;
          const rRadiusY = halfH * 0.64;
          const rx = halfW * 0.95 - Math.cos(rAngle) * rRadiusX;
          const ry = -halfH * 0.02 + Math.sin(rAngle) * rRadiusY;
          const rz = Math.cos(rAngle) * 0.75 - 0.75;
          const rVis = absOff < 1.9;
          const rOpacity = rVis ? Math.max(0, 1 - Math.max(0, absOff - 0.95) * 0.95) : 0;

          R.group.visible = rOpacity > 0.02;
          R.group.position.set(rx, ry, rz);
          R.group.rotation.set(
            -off * 0.08 + (py - 0.5) * 0.22 * activeWeight,
            -0.28 + off * 0.14 + (px - 0.5) * 0.26 * activeWeight,
            -0.14 - off * 0.56,
          );
          const rs = 1 - Math.min(0.26, absOff * 0.14);
          R.group.scale.setScalar(rs);
          R.bodyMat.opacity = rOpacity;
          R.faceMat.opacity = rOpacity;
        }
      }

      renderer.render(scene, camera);
      if (software) afterDraw(tick);
      else frameHandle = requestAnimationFrame(tick);
    };

    if (software) frameHandle = window.setTimeout(tick, 0);
    else frameHandle = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameHandle);
      window.clearTimeout(frameHandle);
      ro.disconnect();
      themeObs.disconnect();
      photoGeo.dispose();
      tileBevelGeo.dispose();
      tileFaceGeo.dispose();
      materialsToDispose.forEach((m) => m.dispose());
      texturesToDispose.forEach((t) => t.dispose());
      renderer.dispose();
    };
  }, [items, simRef]);

  return <canvas ref={canvasRef} className="hv2__glcanvas" data-testid="home-press-canvas" aria-hidden="true" />;
}
