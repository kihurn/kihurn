"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  createBeveledTileGeometry,
  createTileFaceGeometry,
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
  pointerActive: boolean;
  dragging: boolean;
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

  return { map, repaint };
}

function createPlateDepth(): THREE.CanvasTexture {
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
  return new THREE.CanvasTexture(dCanvas);
}

function buildEmblemTexture(item: WheelItem): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 320;
  paintIconEmblemCanvas(canvas, item);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

function createHalo() {
  const count = 1560;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const radius = Math.sqrt((i + 0.5) / count);
    const angle = i * 2.39996323 + Math.sin(i * 92.41) * 0.07;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius;
    positions[i * 3 + 2] = 0.5 + Math.sin(i * 7.853) * 0.48;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
      uInfluence: { value: 0 },
      uPixelRatio: { value: 1 },
      uInk: { value: new THREE.Color() },
    },
    vertexShader: `
      uniform float uTime;
      uniform vec2 uPointer;
      uniform float uInfluence;
      uniform float uPixelRatio;
      varying float vAlpha;
      void main() {
        float radius = length(position.xy);
        float turn = uTime * 0.052 + (1.0 - radius) * 0.11 * sin(uTime * 0.43 + radius * 4.0);
        vec2 point = mat2(cos(turn), sin(turn), -sin(turn), cos(turn)) * position.xy;
        vec2 delta = point - uPointer;
        float d = length(delta);
        float ripple = (1.0 - smoothstep(0.0, 0.48, d)) * uInfluence;
        point += delta * ripple * (0.27 - d);
        vAlpha = (0.25 + 0.75 * position.z) * smoothstep(0.14, 0.7, radius)
          * (1.0 - smoothstep(0.69, 1.0, radius)) * (0.18 + 0.10 * ripple);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(point, 0.0, 1.0);
        gl_PointSize = (1.5 + position.z * 1.0) * uPixelRatio;
      }
    `,
    fragmentShader: `
      uniform vec3 uInk;
      varying float vAlpha;
      void main() {
        float edge = 1.0 - smoothstep(0.29, 0.5, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(uInk, vAlpha * edge);
        #include <colorspace_fragment>
      }
    `,
  });
  const points = new THREE.Points(geometry, material);
  points.renderOrder = -1;
  points.frustumCulled = false;
  return points;
}

const PLATE_VERTEX_SHADER = `
  varying vec2 vUv;
  uniform vec2 uVel;
  uniform float uHoverMix;

  void main() {
    vUv = uv;
    vec3 pos = position;
    pos.z *= 1.0 - 0.73 * uHoverMix;
    pos.z += (uv.y - 0.5) * uVel.y * 0.18 + (uv.x - 0.5) * uVel.x * 0.14;
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
  uniform float uHoverMix;

  void main() {
    float depth = texture2D(uDepth, vUv).r;
    float surface = 1.0 - 0.94 * uHoverMix;
    vec2 parallax = (uPointer - 0.5) * (depth - 0.5) * (0.018 * uActive * surface) + uVel * depth * 0.018;

    float scan = sin(vUv.y * 140.0 + uTime * 22.0);
    float scanJitter = step(0.84, abs(scan)) * scan * uGlitch * surface * 0.003;
    vec2 baseUv = clamp(vUv + parallax + vec2(scanJitter, 0.0), 0.004, 0.996);

    float chroma = uGlitch * surface * 0.0025;
    float r = texture2D(uMap, clamp(baseUv + vec2(chroma, 0.0), 0.002, 0.998)).r;
    float g = texture2D(uMap, baseUv).g;
    float b = texture2D(uMap, clamp(baseUv - vec2(chroma, 0.0), 0.002, 0.998)).b;
    float a = texture2D(uMap, baseUv).a;

    vec2 edge = smoothstep(0.0, 0.06, min(vUv, 1.0 - vUv));
    float dim = mix(0.71, 1.0, uActive);
    float grain = fract(sin(dot(floor(vUv * vec2(640.0, 360.0)), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
    float finish = 1.0 + (grain * 0.075 - step(0.5, fract(vUv.y * 90.0)) * (0.032 + 0.043 * uGlitch)) * surface;
    gl_FragColor = vec4(vec3(r, g, b) * dim * finish, a * uOpacity * mix(0.92, 1.0, edge.x * edge.y));
    #include <colorspace_fragment>
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
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();

    const halo = createHalo();
    halo.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    scene.add(halo);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.65);
    keyLight.position.set(4.5, 5.2, 6.0);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd6d6d5, 0.85);
    rimLight.position.set(-5.0, -2.5, 4.5);
    scene.add(rimLight);

    const photoGeo = new THREE.PlaneGeometry(3.2, 1.8, 24, 8);
    const photoVertices = photoGeo.getAttribute("position");
    const cylinderRadius = 5.8;
    for (let i = 0; i < photoVertices.count; i++) {
      const x = photoVertices.getX(i);
      photoVertices.setZ(i, Math.sqrt(cylinderRadius ** 2 - x ** 2) - cylinderRadius);
    }
    const plateDepth = createPlateDepth();
    const tileBevelGeo = createBeveledTileGeometry(1.22, 0.22, 0.12, 3, 12);
    const tileFaceGeo = createTileFaceGeometry(1.10, 0.165);

    const tileBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x161616,
      metalness: 0.28,
      roughness: 0.22,
      clearcoat: 0.85,
      clearcoatRoughness: 0.16,
      iridescence: 0.035,
      iridescenceIOR: 1.38,
      iridescenceThicknessMinimum: 185,
      iridescenceThicknessMaximum: 320,
      envMapIntensity: 0.75,
      transparent: true,
      opacity: 1,
    });

    const isDark = () => document.documentElement.dataset.theme === "dark";
    const texturesToDispose: THREE.Texture[] = [plateDepth];
    const materialsToDispose: THREE.Material[] = [tileBodyMat, halo.material];
    const repainters: Array<(dark: boolean) => void> = [];

    const leftMeshes: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
    const rightGroups: Array<{
      group: THREE.Group;
      body: THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshPhysicalMaterial>;
      bodyMat: THREE.MeshPhysicalMaterial;
      faceMat: THREE.MeshBasicMaterial;
    }> = [];

    items.forEach((item, i) => {
      const dark = isDark();
      const plateTex = buildPlateTexture(item, i, dark);
      texturesToDispose.push(plateTex.map);
      repainters.push(plateTex.repaint);

      const plateMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uMap: { value: plateTex.map },
          uDepth: { value: plateDepth },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uVel: { value: new THREE.Vector2(0, 0) },
          uOpacity: { value: 1 },
          uActive: { value: 1 },
          uHoverMix: { value: 0 },
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

      const emblemMap = buildEmblemTexture(item);
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
      rightGroups.push({ group, body: bodyMesh, bodyMat, faceMat });
    });

    const updateTheme = () => {
      const nextDark = isDark();
      halo.material.uniforms.uInk.value.set(nextDark ? 0xd6d6d5 : 0x232323);
      repainters.forEach((fn) => fn(nextDark));
    };
    halo.material.uniforms.uInk.value.set(isDark() ? 0xd6d6d5 : 0x232323);
    const themeObs = new MutationObserver(updateTheme);
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
    let inView = true;
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; });
    observer.observe(canvas);

    const N = items.length;
    let frameHandle = 0;
    let disposed = false;
    let prevPos = simRef.current.pos;
    let smoothGlitch = 0;
    let iconHover = 0;
    const iconTilt = new THREE.Vector2();
    const hoverTilt = new THREE.Vector2();
    const haloPointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hits: THREE.Intersection[] = [];
    let gpuFence: WebGLSync | null = null;
    let frameTime = performance.now();
    let elapsed = 0;

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl2 = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl2.fenceSync === "function") {
        gpuFence = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl2.flush();
        const poll = () => {
          if (disposed) return;
          const state = gpuFence ? gl2.getSyncParameter(gpuFence, gl2.SYNC_STATUS) : gl2.SIGNALED;
          if (state === gl2.UNSIGNALED) {
            frameHandle = window.setTimeout(poll, 5);
          } else {
            if (gpuFence) gl2.deleteSync(gpuFence);
            gpuFence = null;
            frameHandle = window.setTimeout(cb, 24);
          }
        };
        frameHandle = window.setTimeout(poll, 5);
      } else {
        frameHandle = window.setTimeout(cb, 32);
      }
    }

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.075, (now - frameTime) * 0.001);
      frameTime = now;
      if (!inView || document.hidden) {
        frameHandle = requestAnimationFrame(tick);
        return;
      }
      elapsed += dt;
      const s = simRef.current;
      const stacked = viewW < 768 || s.stacked;
      const aspect = viewW / Math.max(1, viewH);
      const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
      const halfW = halfH * aspect;

      const pos = s.pos;
      const deltaPos = pos - prevPos;
      prevPos = pos;
      const targetGlitch = Math.min(1, Math.abs(deltaPos) * 12 + Math.abs(s.vel) * 12);
      const ease = 1 - Math.exp(-13 * dt);
      smoothGlitch = THREE.MathUtils.lerp(smoothGlitch, targetGlitch, ease);
      if (smoothGlitch < 0.005) smoothGlitch = 0;

      const { pointerX: px, pointerY: py, pointerVelX: vx, pointerVelY: vy } = s;
      const selected = ((Math.round(pos) % N) + N) % N;
      const pointerActive = s.pointerActive && !s.dragging;
      let plateHovered = false;
      let iconHovered = false;
      hoverTilt.set(0, 0);
      pointer.set(px * 2 - 1, py * 2 - 1);
      if (pointerActive) {
        raycaster.setFromCamera(pointer, camera);
        const icon = rightGroups[selected];
        hits.length = 0;
        raycaster.intersectObject(icon.body, false, hits);
        const iconHit = hits[0];
        if (iconHit) {
          iconHovered = true;
          const local = icon.group.worldToLocal(iconHit.point);
          const tiltLimit = Math.PI / 15;
          hoverTilt.set(
            THREE.MathUtils.clamp(-local.y / 0.58, -1, 1) * tiltLimit,
            THREE.MathUtils.clamp(local.x / 0.58, -1, 1) * tiltLimit,
          );
        } else {
          hits.length = 0;
          raycaster.intersectObject(leftMeshes[selected], false, hits);
          plateHovered = hits.length > 0;
        }
      }
      iconTilt.lerp(hoverTilt, ease);
      iconHover = THREE.MathUtils.lerp(iconHover, Number(iconHovered), ease);

      const haloRadius = stacked ? Math.min(halfH * 0.74, halfW * 1.18) : Math.min(halfH * 0.83, halfW * 0.72);
      halo.position.set(halfW * 0.10, stacked ? halfH * 0.10 : -halfH * 0.055, -0.65);
      halo.scale.setScalar(haloRadius);
      const haloUniforms = halo.material.uniforms;
      if (pointerActive) {
        const depthFactor = (camera.position.z - halo.position.z) / camera.position.z;
        haloPointer.set(
          (pointer.x * halfW * depthFactor - halo.position.x) / haloRadius,
          (pointer.y * halfH * depthFactor - halo.position.y) / haloRadius,
        );
        haloUniforms.uPointer.value.lerp(haloPointer, ease);
      }
      haloUniforms.uInfluence.value = THREE.MathUtils.lerp(haloUniforms.uInfluence.value, Number(pointerActive), ease);
      haloUniforms.uTime.value = elapsed;

      const leftFloat = Math.sin(elapsed * 1.35) * 0.05;
      const rightFloat = Math.sin(elapsed * 1.11 + 1.5) * 0.05;
      const leftBreath = Math.sin(elapsed * 1.17 + 0.8) * (Math.PI / 120);
      const rightBreath = Math.sin(elapsed * 1.31 + 2.4) * (Math.PI / 120);
      const titleClearance = (Math.min(152, viewW * 0.185) / viewW) * (2 * halfW);
      const inspectionDepth = 0.4;
      const inspectionScale = 1.12;
      const maxPerspective = camera.position.z / (camera.position.z - inspectionDepth - 0.08);
      const desktopPlateScale = Math.min(1, (halfW - titleClearance - 0.16) / (3.2 * inspectionScale * maxPerspective));
      const plateCenter = -(halfW + titleClearance) * 0.5;
      const desktopIconScale = Math.min(1, halfW * 0.38);

      for (let i = 0; i < N; i++) {
        const off = wrapHalfOffset(i - pos, N);
        const absOff = Math.abs(off);
        const activeWeight = 1 - THREE.MathUtils.smoothstep(absOff, 0, 1);

        const L = leftMeshes[i];
        const R = rightGroups[i];
        const uniforms = L.material.uniforms;
        const inspection = THREE.MathUtils.lerp(uniforms.uHoverMix.value, Number(plateHovered && i === selected), ease);
        uniforms.uHoverMix.value = inspection;
        if (stacked) {
          const angle = off * 0.72;
          const rad = halfH * 0.28;
          const lx = -halfW * 0.38 + Math.sin(angle) * (halfW * 0.22);
          const ly = halfH * 0.34 - Math.sin(angle) * rad;
          const lz = Math.cos(angle) * 0.55 - 0.55;
          const lVis = absOff < 1.65;
          const lOpacity = lVis ? Math.max(0, 1 - absOff * 0.62) : 0;

          L.visible = lOpacity > 0.02;
          L.position.set(lx, ly + leftFloat * activeWeight, lz + inspection * 0.2);
          L.rotation.set(off * 0.14 + leftBreath * activeWeight, -off * 0.18, -off * 0.24);
          const ls = Math.min(0.64, halfW * 0.36) * (1 - Math.min(0.34, absOff * 0.16));
          L.scale.setScalar(ls * (1 + 0.12 * inspection));
          uniforms.uOpacity.value = lOpacity;

          const rx = halfW * (0.78 - 0.23 * activeWeight) - Math.cos(angle * 1.1) * 0.06;
          const ry = halfH * 0.4 + Math.sin(-angle * 1.1) * rad * 0.75;
          const rOpacity = lVis ? Math.max(0, 1 - absOff * 0.68) : 0;
          R.group.visible = rOpacity > 0.02;
          R.group.position.set(rx, ry + rightFloat * activeWeight, lz - 0.1 + 0.36 * activeWeight);
          R.group.rotation.set(
            (rightBreath + iconTilt.x) * activeWeight,
            -0.25 + (0.19 + iconTilt.y) * activeWeight,
            -0.14 * (1 - activeWeight) - off * 0.44,
          );
          R.group.scale.setScalar(Math.min(0.65, halfW * 0.31) * (1 + activeWeight * 0.25));
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
          const lift = inspectionDepth * inspection;
          const centeredX = plateCenter * (1 - lift / camera.position.z);
          L.position.set(THREE.MathUtils.lerp(lx, centeredX, activeWeight), ly + leftFloat * activeWeight, lz + lift);
          L.rotation.set(off * 0.1 + leftBreath * activeWeight, (0.22 - off * 0.14) * (1 - inspection * 0.8), off * 0.42);
          const ls = desktopPlateScale * (1 - Math.min(0.34, absOff * 0.16));
          L.scale.setScalar(ls * THREE.MathUtils.lerp(1, inspectionScale, inspection));
          uniforms.uOpacity.value = lOpacity;

          const rAngle = -off * 1.45;
          const rRadiusX = halfW * 0.34;
          const rRadiusY = halfH * 0.64;
          const arcX = halfW * 0.95 - Math.cos(rAngle) * rRadiusX;
          const selectedX = Math.max(halfW * 0.43, titleClearance + desktopIconScale * 0.76);
          const rx = THREE.MathUtils.lerp(arcX, selectedX, activeWeight);
          const ry = -halfH * 0.02 + Math.sin(rAngle) * rRadiusY;
          const rz = Math.cos(rAngle) * 0.75 - 0.75 + 0.47 * activeWeight;
          const rVis = absOff < 1.9;
          const rOpacity = rVis ? Math.max(0, 1 - Math.max(0, absOff - 0.95) * 0.95) : 0;

          R.group.visible = rOpacity > 0.02;
          R.group.position.set(rx, ry + rightFloat * activeWeight, rz);
          R.group.rotation.set(
            -off * 0.08 + (rightBreath + iconTilt.x) * activeWeight,
            -0.28 + off * 0.14 + (0.23 + iconTilt.y) * activeWeight,
            -0.14 * (1 - activeWeight) - off * 0.56,
          );
          const rs = desktopIconScale * (1 + 0.25 * activeWeight - Math.min(0.26, absOff * 0.14));
          R.group.scale.setScalar(rs);
          R.bodyMat.opacity = rOpacity;
          R.faceMat.opacity = rOpacity;
        }
        if (L.visible) {
          uniforms.uActive.value = activeWeight;
          uniforms.uPointer.value.set(pointerActive ? px : 0.5, pointerActive ? py : 0.5);
          uniforms.uVel.value.set(vx, vy);
          uniforms.uGlitch.value = smoothGlitch;
          uniforms.uTime.value = elapsed;
        }
        if (R.group.visible) {
          R.bodyMat.iridescence = 0.035 + 0.37 * activeWeight * iconHover;
          R.bodyMat.clearcoatRoughness = 0.16 - 0.065 * activeWeight * iconHover;
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
      observer.disconnect();
      themeObs.disconnect();
      if (gpuFence) (gl as WebGL2RenderingContext).deleteSync(gpuFence);
      photoGeo.dispose();
      tileBevelGeo.dispose();
      tileFaceGeo.dispose();
      halo.geometry.dispose();
      environment.dispose();
      materialsToDispose.forEach((m) => m.dispose());
      texturesToDispose.forEach((t) => t.dispose());
      renderer.dispose();
    };
  }, [items, simRef]);

  return <canvas ref={canvasRef} className="hv2__glcanvas" data-testid="home-press-canvas" aria-hidden="true" />;
}
