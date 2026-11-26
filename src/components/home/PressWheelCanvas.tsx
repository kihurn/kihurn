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
  settled: boolean;
  pull: number;
  selected: number;
  focused: boolean;
}

const PLATE_WIDTH = 3.2;
const PLATE_HEIGHT = 1.8;
const PLATE_ASPECT = PLATE_WIDTH / PLATE_HEIGHT;
const PLATE_CORNER = 0.07;

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
      uOpacity: { value: 0.3 },
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
        gl_PointSize = (1.2 + position.z * 0.85) * uPixelRatio;
      }
    `,
    fragmentShader: `
      uniform vec3 uInk;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        float edge = 1.0 - smoothstep(0.29, 0.5, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(uInk, vAlpha * edge * uOpacity);
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
  uniform float uFocus;

  void main() {
    vUv = uv;
    vec3 pos = position;
    pos.z *= 1.0 - 0.38 * uFocus;
    pos.z += ((uv.y - 0.5) * uVel.y * 0.18 + (uv.x - 0.5) * uVel.x * 0.14) * (1.0 - uFocus);
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
  uniform float uHover;
  uniform float uFocus;

  void main() {
    vec2 p = (vUv - 0.5) * vec2(${PLATE_ASPECT}, 1.0);
    vec2 corner = abs(p) - vec2(${PLATE_ASPECT / 2}, 0.5) + ${PLATE_CORNER};
    float edge = length(max(corner, 0.0)) + min(max(corner.x, corner.y), 0.0) - ${PLATE_CORNER};
    float aa = max(fwidth(edge), 0.0005);
    float mask = 1.0 - smoothstep(-aa, aa, edge);
    if (mask <= 0.0) discard;

    float depth = texture2D(uDepth, vUv).r;
    float surface = 1.0 - uFocus;
    vec2 parallax = (uPointer - 0.5) * (depth - 0.5) * (mix(0.012, 0.026, uFocus) * uActive)
                  + uVel * depth * 0.018 * surface;

    float scan = sin(vUv.y * 140.0 + uTime * 22.0);
    float scanJitter = step(0.84, abs(scan)) * scan * uGlitch * surface * 0.003;
    vec2 baseUv = clamp(vUv + parallax + vec2(scanJitter, 0.0), 0.004, 0.996);

    float chroma = uGlitch * surface * 0.0025;
    float r = texture2D(uMap, clamp(baseUv + vec2(chroma, 0.0), 0.002, 0.998)).r;
    float g = texture2D(uMap, baseUv).g;
    float b = texture2D(uMap, clamp(baseUv - vec2(chroma, 0.0), 0.002, 0.998)).b;
    float a = texture2D(uMap, baseUv).a;

    float dim = mix(0.71, 1.0, uActive);
    float grain = fract(sin(dot(floor(vUv * vec2(640.0, 360.0)), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
    float finish = 1.0 + (grain * 0.075 - step(0.5, fract(vUv.y * 90.0)) * (0.032 + 0.043 * uGlitch)) * surface;
    vec3 ink = vec3(r, g, b) * dim * finish;
    if (uHover > 0.002 && edge > -0.045) {
      float phase = atan(p.y, p.x) - uTime * 1.95;
      float sweep = smoothstep(0.75, 0.998, cos(phase));
      float line = 1.0 - smoothstep(0.001, 0.006 + aa, abs(edge + 0.006));
      float bloom = (1.0 - smoothstep(0.0, 0.032, abs(edge + 0.006))) * sweep;
      ink = mix(ink, vec3(0.91, 0.94, 1.0), uHover * min(0.93, line * (0.29 + 0.51 * sweep) + 0.27 * bloom));
    }
    gl_FragColor = vec4(ink, a * uOpacity * mask);
    #include <colorspace_fragment>
  }
`;

export function PressWheelCanvas({
  items,
  simRef,
  centerRef,
  shadeRef,
  hitPlateRef,
}: {
  items: WheelItem[];
  simRef: React.RefObject<WheelSimState>;
  centerRef: React.RefObject<HTMLDivElement | null>;
  shadeRef: React.RefObject<HTMLDivElement | null>;
  hitPlateRef: React.RefObject<((x: number, y: number) => boolean) | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;
    const center = centerRef.current;
    const shade = shadeRef.current;

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

    const photoGeo = new THREE.PlaneGeometry(PLATE_WIDTH, PLATE_HEIGHT, 24, 8);
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
      roughness: 0.24,
      clearcoat: 0.85,
      clearcoatRoughness: 0.105,
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
          uHover: { value: 0 },
          uFocus: { value: 0 },
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
    let focusIndex = -1;
    let focusAmount = 0;
    let hoverState = false;
    const stage = canvas.parentElement;

    const intersectsPlate = (index: number) => {
      const plate = leftMeshes[index];
      if (!plate?.visible) return false;
      hits.length = 0;
      raycaster.intersectObject(plate, false, hits);
      const uv = hits[0]?.uv;
      if (!uv) return false;
      const dx = Math.max(0, Math.abs(uv.x - 0.5) * PLATE_ASPECT - PLATE_ASPECT / 2 + PLATE_CORNER);
      const dy = Math.max(0, Math.abs(uv.y - 0.5) - 0.5 + PLATE_CORNER);
      return dx * dx + dy * dy <= PLATE_CORNER * PLATE_CORNER;
    };

    hitPlateRef.current = (x, y) => {
      const rect = canvas.getBoundingClientRect();
      pointer.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2);
      raycaster.setFromCamera(pointer, camera);
      return intersectsPlate(simRef.current.selected);
    };

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
      const focusTarget = Number(s.focused);
      if (s.focused) focusIndex = s.selected;
      const previousFocus = focusAmount;
      focusAmount = THREE.MathUtils.lerp(focusAmount, focusTarget, 1 - Math.exp(-12.5 * dt));
      if (Math.abs(focusTarget - focusAmount) < 0.002) focusAmount = focusTarget;
      if (focusAmount === 0) focusIndex = -1;
      if (previousFocus !== focusAmount && shade) shade.style.opacity = String(focusAmount);
      if (center) {
        const x = viewW * (stacked ? 0.025 : 0.192) * focusAmount;
        const y = stacked ? viewH * 0.035 * focusAmount : 0;
        const transform = focusAmount ? `translate3d(${x}px, ${y}px, 0)` : "";
        if (center.style.transform !== transform) center.style.transform = transform;
      }

      const selected = s.selected;
      const pointerActive = s.pointerActive && !s.dragging;
      let plateHovered = false;
      let iconHovered = false;
      hoverTilt.set(0, 0);
      pointer.set(px * 2 - 1, py * 2 - 1);
      if (pointerActive && s.settled) {
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
        } else plateHovered = intersectsPlate(selected);
      }
      if (plateHovered !== hoverState) {
        hoverState = plateHovered;
        stage?.toggleAttribute("data-plate-hover", plateHovered);
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
      haloUniforms.uOpacity.value = 0.3 * (1 - 0.72 * focusAmount);

      const leftFloat = Math.sin(elapsed * 1.35) * 0.05;
      const rightFloat = Math.sin(elapsed * 1.11 + 1.5) * 0.05;
      const leftBreath = Math.sin(elapsed * 1.17 + 0.8) * (Math.PI / 120);
      const rightBreath = Math.sin(elapsed * 1.31 + 2.4) * (Math.PI / 120);
      const titleClearance = Math.min(152, viewW * 0.13) * (2 * halfW / viewW);
      const plateScale = stacked ? Math.min(0.64, halfW * 0.36) : Math.min(0.98, (halfW - titleClearance - 0.16) / PLATE_WIDTH);
      const plateCenter = -(halfW + titleClearance) * 0.5;
      const focusDepth = 0.38;
      const focusProjection = 1 - focusDepth / camera.position.z;
      const focusPlateScale = (2 * halfW / PLATE_WIDTH) * (stacked ? 0.88 : 0.54) * focusProjection;
      const focusPlateX = (stacked ? 0 : -halfW * 0.43) * focusProjection;
      const focusPlateY = halfH * (stacked ? 0.35 : 0.03) * focusProjection;
      const arcRadius = stacked ? halfW * 0.66 : Math.min(halfH * 0.88, halfW * 0.9);
      const arcX = halfW * (stacked ? 0.67 : 0.62);
      const arcY = halfH * (stacked ? 0.40 : -0.025);
      const iconScale = stacked ? Math.min(0.61, halfW * 0.32) : Math.min(0.91, halfW * 0.37);
      const focusIconDepth = 0.18;
      const iconProjection = 1 - focusIconDepth / camera.position.z;
      const focusIconX = halfW * (stacked ? 0.70 : 0.82) * iconProjection;
      const focusIconY = halfH * (stacked ? -0.045 : 0.015) * iconProjection;
      const focusIconScale = Math.min(iconScale, (stacked ? 0.36 : 0.29) * halfW * iconProjection / 1.31);
      const selectedIconX = stacked ? halfW * 0.53 : Math.max(halfW * 0.43, titleClearance + iconScale * 0.73);

      for (let i = 0; i < N; i++) {
        const off = wrapHalfOffset(i - pos, N);
        const absOff = Math.abs(off);
        const activeWeight = 1 - THREE.MathUtils.smoothstep(absOff, 0, 1);
        const inspection = i === focusIndex ? focusAmount : 0;
        const pull = i === s.selected ? s.pull : 0;
        const iconFocus = inspection * pull;
        const backgroundDim = i === focusIndex ? 1 : 1 - 0.83 * focusAmount;
        const L = leftMeshes[i];
        const R = rightGroups[i];

        const lAngle = off * (stacked ? 0.72 : 1.02);
        const lSin = Math.sin(lAngle);
        const lCos = Math.cos(lAngle);
        const normalX = stacked
          ? halfW * (-0.38 + lSin * 0.22)
          : THREE.MathUtils.lerp(halfW * (-0.94 + lCos * 0.44), plateCenter, activeWeight);
        const normalY = stacked ? halfH * (0.34 - lSin * 0.28) : halfH * (-0.04 + lSin * 0.74);
        const normalZ = stacked ? lCos * 0.55 - 0.55 : lCos * 0.9 - 0.85;
        const normalOpacity = stacked
          ? Math.max(0, 1 - absOff * 0.62)
          : Math.max(0, 1 - Math.max(0, absOff - 1.05) * 0.92);
        const plateOpacity = THREE.MathUtils.lerp(
          absOff < (stacked ? 1.65 : 2.25) ? normalOpacity * backgroundDim : 0, 1, inspection,
        );
        const uniforms = L.material.uniforms;
        L.visible = plateOpacity > 0.02;
        if (L.visible) {
          L.position.set(
            THREE.MathUtils.lerp(normalX, focusPlateX, inspection),
            THREE.MathUtils.lerp(normalY, focusPlateY, inspection) + leftFloat * activeWeight * (1 - 0.55 * inspection),
            THREE.MathUtils.lerp(normalZ, focusDepth, inspection),
          );
          L.rotation.set(
            off * 0.12 * (1 - inspection) + leftBreath * activeWeight * (1 - 0.7 * inspection),
            THREE.MathUtils.lerp((stacked ? 0.03 : 0.22) - off * 0.16, 0.06, inspection),
            off * (stacked ? -0.24 : 0.42) * (1 - inspection),
          );
          const scale = plateScale * (1 - Math.min(0.34, absOff * 0.16));
          L.scale.setScalar(THREE.MathUtils.lerp(scale, focusPlateScale, inspection));
          uniforms.uOpacity.value = plateOpacity;
          uniforms.uActive.value = Math.max(activeWeight, inspection);
          uniforms.uHover.value = THREE.MathUtils.lerp(uniforms.uHover.value, Number(plateHovered && i === selected), ease);
          uniforms.uFocus.value = inspection;
          uniforms.uPointer.value.set(pointerActive ? px : 0.5, pointerActive ? py : 0.5);
          uniforms.uVel.value.set(vx, vy);
          uniforms.uGlitch.value = smoothGlitch;
          uniforms.uTime.value = elapsed;
        }

        const rAngle = -off * (stacked ? 0.85 : 0.93);
        const orbitX = arcX + arcRadius * (1 - Math.cos(rAngle));
        const orbitY = arcY + arcRadius * Math.sin(rAngle);
        const rOpacity = absOff < 1.85 ? Math.max(0, 1 - Math.max(0, absOff - 1) * 1.12) : 0;
        const iconOpacity = THREE.MathUtils.lerp(rOpacity * backgroundDim, 1, iconFocus);
        R.group.visible = iconOpacity > 0.02;
        if (R.group.visible) {
          R.group.position.set(
            THREE.MathUtils.lerp(THREE.MathUtils.lerp(orbitX, selectedIconX, pull), focusIconX, iconFocus),
            THREE.MathUtils.lerp(orbitY, focusIconY, iconFocus) + rightFloat * pull,
            THREE.MathUtils.lerp(0.32 * pull, focusIconDepth, iconFocus),
          );
          R.group.rotation.set(
            -off * 0.08 * (1 - pull) + (rightBreath + iconTilt.x) * pull,
            THREE.MathUtils.lerp(-0.30 + off * 0.11, -0.045 + iconTilt.y, pull),
            (-0.12 - off * 0.41) * (1 - pull),
          );
          R.group.scale.setScalar(THREE.MathUtils.lerp(iconScale * (1 + 0.18 * pull), focusIconScale, iconFocus));
          R.bodyMat.opacity = iconOpacity;
          R.faceMat.opacity = iconOpacity;
          R.bodyMat.iridescence = 0.045 + 0.42 * pull * iconHover;
          R.bodyMat.clearcoatRoughness = 0.105 - 0.035 * pull * iconHover;
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
      hitPlateRef.current = null;
      if (center) center.style.transform = "";
      if (shade) shade.style.opacity = "";
      stage?.removeAttribute("data-plate-hover");
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
  }, [items, simRef, centerRef, shadeRef, hitPlateRef]);

  return <canvas ref={canvasRef} className="hv2__glcanvas" data-testid="home-press-canvas" aria-hidden="true" />;
}
