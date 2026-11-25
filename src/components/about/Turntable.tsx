"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { disposeScene } from "@/lib/disposeScene";

const tracks = [
  { title: "Nujabes — Feather", album: "Modal Soul (2005)", bpm: 92, length: 175, ink: "#ae774f" },
  { title: "Ryo Fukui — Scenery", album: "Scenery (1976)", bpm: 116, length: 350, ink: "#a35840" },
  { title: "LAMP — Yume Utsutsu", album: "For Lovers (2004)", bpm: 84, length: 315, ink: "#738a74" },
];

type TrackSource = { art?: string; audio?: string };

function TurntableScene({ transport, sources }: {
  transport: React.RefObject<{ playing: boolean; index: number; progress: number }>;
  sources: TrackSource[];
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
    camera.position.set(2.2, 5.5, 5.8);
    camera.lookAt(0, 0, 0);
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

    function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) {
      const part = new THREE.Mesh(geometry, material);
      part.position.set(x, y, z);
      parent.add(part);
      return part;
    }

    mesh(scene, new RoundedBoxGeometry(4.22, 0.27, 3.12, 3, 0.08), stock, 0, -0.14, 0);
    mesh(scene, new THREE.CylinderGeometry(1.32, 1.32, 0.10, 96), chrome, -0.48, 0.05, 0);
    const record = new THREE.Group();
    record.position.set(-0.48, 0.13, 0);
    scene.add(record);
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
    mesh(scene, new THREE.CylinderGeometry(0.036, 0.036, 0.08, 16), chrome, -0.48, 0.16, 0);

    const arm = new THREE.Group();
    const pivot = new THREE.Group();
    pivot.position.set(1.52, 0.24, -0.97);
    pivot.add(arm);
    scene.add(pivot);
    mesh(scene, new THREE.CylinderGeometry(0.18, 0.22, 0.21, 40), chrome, 1.52, 0.095, -0.97);
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
    mesh(scene, new THREE.CylinderGeometry(0.08, 0.11, 0.15, 20), dark, 1.68, 0.08, 0.02);

    let currentTrack = -1;
    let disposed = false;
    let needsRender = true;
    const artwork = sources.map(({ art }, index) => {
      if (!art) return undefined;
      const image = new Image();
      image.onload = () => {
        if (!disposed && currentTrack === index) printRecord(index);
      };
      image.src = art;
      return image;
    });
    function printRecord(index: number) {
      const track = tracks[index];
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
      context.fillStyle = track.ink;
      context.beginPath();
      context.arc(center, center, 103, 0, 2 * Math.PI);
      context.fill();
      context.strokeStyle = "#eee2d7aa";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(center, center, 91, 0, 2 * Math.PI);
      context.stroke();
      context.textAlign = "center";
      context.fillStyle = "#161313";
      context.font = "bold 27px monospace";
      context.fillText(track.title.split(" — ")[0].toUpperCase(), center, center - 24, 168);
      context.font = "18px monospace";
      context.fillText(track.album, center, center + 40, 172);
      const art = artwork[index];
      if (art?.naturalWidth) {
        const scale = Math.max(206 / art.naturalWidth, 206 / art.naturalHeight);
        context.save();
        context.clip();
        const width = art.naturalWidth * scale;
        const height = art.naturalHeight * scale;
        context.drawImage(art, center - width / 2, center - height / 2, width, height);
        context.restore();
      }
      texture.needsUpdate = true;
      needsRender = true;
    }

    const resize = () => {
      const width = Math.max(1, element.clientWidth);
      const height = Math.max(1, element.clientHeight);
      const aspect = width / height;
      const halfHeight = Math.max(1.62, 2.32 / aspect);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
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
      const { playing, index, progress } = transport.current;
      if (currentTrack !== index) { currentTrack = index; printRecord(index); }
      const targetYaw = playing ? -0.56 - progress * 0.22 : 0.24;
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
      disposed = true;
      observer.disconnect();
      renderer.setAnimationLoop(null);
      element.parentElement?.removeAttribute("data-gl-ready");
      disposeScene(scene, renderer);
    };
  }, [transport, sources]);

  return <canvas ref={canvas} aria-hidden="true" />;
}

export function Turntable({ sources }: { sources: TrackSource[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const track = tracks[index];
  const progress = seconds / track.length;
  const audio = useRef<HTMLAudioElement>(null);
  const currentAudio = sources[index]?.audio;
  const transport = useRef({ playing, index, progress });

  useEffect(() => {
    transport.current = { playing, index, progress };
  }, [playing, index, progress]);

  useEffect(() => {
    if (!playing || currentAudio) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setSeconds((time) => Math.min(time + 1, track.length));
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing, track.length, currentAudio]);

  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    if (!playing) {
      element.pause();
      return;
    }
    void element.play().catch(() => {
      if (audio.current === element && !element.seeking) setPlaying(false);
    });
  }, [playing, currentAudio]);

  const changeTrack = (step: number) => {
    setIndex((previous) => (previous + step + tracks.length) % tracks.length);
    setSeconds(0);
  };
  const elapsed = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="turntable" data-on={playing}>
      <div className="turntable__screen">
        <TurntableScene transport={transport} sources={sources} />
        <div className="turntable__fallback" aria-hidden="true">
          <span className="turntable__record" style={{ "--label-ink": track.ink } as React.CSSProperties} />
        </div>
      </div>
      {currentAudio ? (
        <audio key={currentAudio} ref={audio} src={currentAudio} preload="none"
          onTimeUpdate={(event) => setSeconds(Math.floor(event.currentTarget.currentTime))}
          onEnded={() => { setSeconds(0); setPlaying(false); }}
        />
      ) : null}
      <div className="turntable__head text-mono-sm">
        <span>RADIO :: {playing ? "SPIN" : "OFF-AIR"}</span>
        <span>{track.bpm} BPM · {elapsed}</span>
      </div>
      <div className="turntable__track">
        <strong>{track.title}</strong>
        <span className="text-mono-sm">{track.album}</span>
      </div>
      <div className="turntable__controls text-mono-sm">
        <button type="button" data-radio-next aria-label="Previous track" onClick={() => changeTrack(-1)}>PREV</button>
        <button type="button" data-radio-toggle aria-label={playing ? "Pause turntable" : "Play turntable"} onClick={() => {
          if (seconds === track.length) setSeconds(0);
          setPlaying(!playing);
        }}>{playing ? "PAUSE" : "PLAY"}</button>
        <button type="button" data-radio-next aria-label="Next track" onClick={() => changeTrack(1)}>NEXT</button>
      </div>
    </div>
  );
}
