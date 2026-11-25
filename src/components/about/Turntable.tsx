"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { disposeScene } from "@/lib/disposeScene";
import { useNowPlaying } from "@/components/chrome/NowPlayingProvider";

const DISPLAY_WIDTH = 400;
const DISPLAY_HEIGHT = 88;

function TurntableScene({ transport, display }: {
  transport: React.RefObject<{ playing: boolean; title: string }>;
  display: React.RefObject<HTMLDivElement | null>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const gl = element.getContext("webgl2", { alpha: true, antialias: true });
    if (!gl || gl.isContextLost()) return;
    const renderer = new THREE.WebGLRenderer({ canvas: element, context: gl, alpha: true, antialias: true });
    renderer.setClearColor(0, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-2.5, 2.5, 1.65, -1.65, 0.1, 30);
    camera.position.set(0.55, 8, 4.5);
    camera.lookAt(0, 0, 0.16);
    scene.add(new THREE.HemisphereLight(0xeeeeeb, 0x6f6a62, 2.0));
    const key = new THREE.DirectionalLight(0xffe5c8, 3.0);
    key.position.set(-3, 5, 4);
    scene.add(key);
    const rim = new THREE.SpotLight(0xb7d2f9, 34, 20, 0.58, 0.7);
    rim.position.set(2, 4, -4);
    scene.add(rim, rim.target);

    const stock = new THREE.MeshStandardMaterial({ color: 0x26282a, roughness: 0.48, metalness: 0.48 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xd6d2c5, roughness: 0.31, metalness: 0.64 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.45 });
    const displayStock = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.92 });

    function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) {
      const part = new THREE.Mesh(geometry, material);
      part.position.set(x, y, z);
      parent.add(part);
      return part;
    }

    mesh(scene, new RoundedBoxGeometry(4.22, 0.27, 4.05, 3, 0.08), stock, 0, -0.15, 0.12);
    mesh(scene, new RoundedBoxGeometry(3.94, 0.032, 1.02, 3, 0.016), displayStock, 0, 0, 1.50);
    const hardware = new THREE.Group();
    hardware.position.z = -0.5;
    scene.add(hardware);
    mesh(hardware, new THREE.CylinderGeometry(1.32, 1.32, 0.10, 96), chrome, -0.48, 0.05, 0);
    const record = new THREE.Group();
    record.position.set(-0.48, 0.13, 0);
    hardware.add(record);
    const strobe = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 0.022, 0.012), dark, 96);
    const dot = new THREE.Object3D();
    for (let i = 0; i < strobe.count; i++) {
      const angle = i / strobe.count * Math.PI * 2;
      dot.position.set(Math.sin(angle) * 1.32, -0.057, Math.cos(angle) * 1.32);
      dot.rotation.y = angle;
      dot.updateMatrix();
      strobe.setMatrixAt(i, dot.matrix);
    }
    record.add(strobe);
    const print = document.createElement("canvas");
    print.width = print.height = 768;
    const context = print.getContext("2d")!;
    const texture = new THREE.CanvasTexture(print);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    const grooves = document.createElement("canvas");
    grooves.width = grooves.height = 512;
    const grooveInk = grooves.getContext("2d")!;
    grooveInk.fillStyle = "#aaa";
    grooveInk.fillRect(0, 0, 512, 512);
    for (let radius = 72; radius < 256; radius += 2.5) {
      grooveInk.beginPath();
      grooveInk.arc(256, 256, radius, 0, 2 * Math.PI);
      grooveInk.strokeStyle = radius % 5 === 2 ? "#666" : "#8c8c8c";
      grooveInk.stroke();
    }
    const grooveMap = new THREE.CanvasTexture(grooves);
    const surface = new THREE.MeshPhysicalMaterial({
      map: texture, bumpMap: grooveMap, bumpScale: 0.012, roughnessMap: grooveMap,
      roughness: 0.68, metalness: 0.18, clearcoat: 0.38, anisotropy: 0.22,
    });
    mesh(record, new THREE.CircleGeometry(1.265, 96), surface, 0, 0, 0).rotation.x = -Math.PI / 2;
    mesh(hardware, new THREE.CylinderGeometry(0.036, 0.036, 0.08, 16), chrome, -0.48, 0.16, 0);

    const arm = new THREE.Group();
    const pivot = new THREE.Group();
    pivot.position.set(1.52, 0.24, -0.97);
    pivot.add(arm);
    hardware.add(pivot);
    mesh(hardware, new THREE.CylinderGeometry(0.18, 0.22, 0.21, 40), chrome, 1.52, 0.095, -0.97);
    mesh(pivot, new THREE.SphereGeometry(0.125, 24, 12), chrome, 0, 0, 0);
    const bend = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, -0.35), new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.09, 0, 0.65), new THREE.Vector3(-0.06, 0, 1.17),
      new THREE.Vector3(-0.20, -0.035, 1.69),
    ]);
    mesh(arm, new THREE.TubeGeometry(bend, 40, 0.035, 12, false), chrome, 0, 0, 0);
    mesh(arm, new THREE.CylinderGeometry(0.10, 0.10, 0.23, 24), chrome, 0, 0, -0.32).rotation.x = Math.PI / 2;
    mesh(arm, new RoundedBoxGeometry(0.15, 0.07, 0.26, 2, 0.025), dark, -0.21, -0.035, 1.72);
    mesh(arm, new THREE.ConeGeometry(0.02, 0.065, 10), chrome, -0.21, -0.095, 1.78).rotation.z = Math.PI;
    mesh(hardware, new THREE.CylinderGeometry(0.08, 0.11, 0.15, 20), dark, 1.68, 0.08, 0.02);

    let currentTitle = "";
    let needsRender = true;
    function printRecord(title: string) {
      const center = print.width / 2;
      context.fillStyle = "#1e1e20";
      context.fillRect(0, 0, print.width, print.height);
      const shine = context.createConicGradient(0.65, center, center);
      shine.addColorStop(0, "#111113");
      shine.addColorStop(0.16, "#38383b");
      shine.addColorStop(0.35, "#171719");
      shine.addColorStop(0.62, "#343438");
      shine.addColorStop(0.83, "#151518");
      shine.addColorStop(1, "#111113");
      context.fillStyle = shine;
      context.fillRect(0, 0, print.width, print.height);
      for (let radius = 112; radius < center; radius += 3) {
        context.beginPath();
        context.arc(center, center, radius, 0, 2 * Math.PI);
        context.strokeStyle = radius % 9 === 1 ? "#a09ca545" : "#02020683";
        context.stroke();
      }
      context.fillStyle = "#780606";
      context.beginPath();
      context.arc(center, center, 103, 0, 2 * Math.PI);
      context.fill();
      context.strokeStyle = "#eee2d7aa";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(center, center, 91, 0, 2 * Math.PI);
      context.stroke();
      context.textAlign = "center";
      context.fillStyle = "#f1d8d6";
      context.font = "bold 27px monospace";
      context.fillText(title, center, center - 23, 165);
      context.font = "17px monospace";
      context.fillText("33 ⅓ RPM", center, center + 42, 125);
      texture.needsUpdate = true;
      needsRender = true;
    }

    const resize = () => {
      const width = Math.max(1, element.clientWidth);
      const height = Math.max(1, element.clientHeight);
      const aspect = width / height;
      const halfHeight = Math.max(2.04, 2.27 / aspect);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      const project = (x: number, z: number) => {
        const point = new THREE.Vector3(x, 0.018, z).project(camera);
        return { x: (point.x + 1) * width / 2, y: (1 - point.y) * height / 2 };
      };
      const topLeft = project(-1.91, 1.03);
      const topRight = project(1.91, 1.03);
      const bottomLeft = project(-1.91, 1.97);
      const a = (topRight.x - topLeft.x) / DISPLAY_WIDTH;
      const b = (topRight.y - topLeft.y) / DISPLAY_WIDTH;
      const c = (bottomLeft.x - topLeft.x) / DISPLAY_HEIGHT;
      const d = (bottomLeft.y - topLeft.y) / DISPLAY_HEIGHT;
      display.current?.style.setProperty("--display-plane", `matrix(${a},${b},${c},${d},${topLeft.x},${topLeft.y})`);
      needsRender = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let last = 0;
    renderer.setAnimationLoop((now) => {
      if (document.hidden) { last = 0; return; }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const { playing, title } = transport.current;
      if (currentTitle !== title) {
        currentTitle = title;
        printRecord(title);
      }
      const targetYaw = playing ? -0.62 : 0.24;
      const targetPitch = playing ? 0 : -0.13;
      const armMoving = Math.abs(pivot.rotation.y - targetYaw) + Math.abs(arm.rotation.x - targetPitch) > 0.001;
      const spinning = playing && !motion.matches;
      if (!needsRender && !armMoving && !spinning) return;
      const blend = motion.matches ? 1 : 1 - Math.exp(-dt * 5);
      pivot.rotation.y = THREE.MathUtils.lerp(pivot.rotation.y, targetYaw, blend);
      arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, targetPitch, blend);
      if (spinning) record.rotation.y += dt * 3.49;
      renderer.render(scene, camera);
      needsRender = false;
    });
    element.parentElement?.setAttribute("data-gl-ready", "");
    return () => {
      observer.disconnect();
      renderer.setAnimationLoop(null);
      element.parentElement?.removeAttribute("data-gl-ready");
      display.current?.style.removeProperty("--display-plane");
      disposeScene(scene, renderer);
    };
  }, [transport, display]);

  return <canvas ref={canvas} aria-hidden="true" />;
}

export function Turntable() {
  const track = useNowPlaying();
  const playing = track?.status === "playing";
  const title = playing ? track.title
    : track?.status === "unconfigured" ? "Spotify disconnected"
    : track?.status === "unavailable" ? "Signal unavailable"
    : track?.status === "idle" ? "Nothing playing"
    : "Checking Spotify";
  const label = playing ? track.artist : "KIHURN";
  const transport = useRef({ playing, title: label });
  const display = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transport.current = { playing, title: label };
  }, [playing, label]);

  return (
    <div className="turntable" data-depth-card data-playing={playing}>
      <div className="turntable__screen">
        <TurntableScene transport={transport} display={display} />
        <div className="turntable__fallback" aria-hidden="true"><span /></div>
        <div ref={display} className="turntable__label" style={{ "--display-width": `${DISPLAY_WIDTH}px`, "--display-height": `${DISPLAY_HEIGHT}px` } as React.CSSProperties}>
          <div className="turntable__meta text-mono-sm">
            <span><i aria-hidden="true" />{playing ? "NOW PLAYING" : "OFF AIR"}</span>
            <span>SPOTIFY</span>
          </div>
          <strong className="turntable__title" aria-live="polite">
            {playing && track.url ? <a href={track.url} target="_blank" rel="noreferrer">{title}</a> : title}
          </strong>
          {playing ? <span className="turntable__artist text-mono-sm">{track.artist}</span> : null}
        </div>
      </div>
    </div>
  );
}
