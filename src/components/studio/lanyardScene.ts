import * as THREE from "three";
import { crewRoles } from "@/content/gigs";
import { disposeScene } from "@/lib/disposeScene";
import { computeBadgePose, type VerletChain } from "@/lib/physics/verlet";

function badgePrint(back: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 840;
  canvas.height = 930;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(3, 3);
  ctx.fillStyle = "#e8e2d6";
  ctx.fillRect(0, 0, 280, 310);
  ctx.fillStyle = "#780606";
  ctx.fillRect(0, 0, 280, 9);
  ctx.fillStyle = "#22211d";
  ctx.font = "bold 10px monospace";
  ctx.fillText(back ? "CREW ROLES" : "KIHURN", 25, 37);
  ctx.textAlign = "right";
  if (!back) ctx.fillText("EVENT CREW", 253, 37);
  ctx.textAlign = "left";
  ctx.fillRect(25, 49, 228, 1);

  if (back) {
    ctx.font = "15px monospace";
    crewRoles.forEach((role, i) => {
      const y = 76 + 32 * i;
      ctx.fillStyle = "#22211d";
      ctx.fillText(role, 25, y);
      ctx.fillStyle = "#bcb4a5";
      ctx.fillRect(25, y + 9, 228, 1);
    });
  } else {
    ctx.fillStyle = "#22211d";
    ctx.fillRect(25, 61, 228, 146);
    ctx.fillStyle = "#d7d2c4";
    for (let y = 68; y < 202; y += 4) {
      for (let x = 32; x < 250; x += 4) {
        const nx = (x - 139) / 52;
        const ny = (y - 121) / 43;
        const face = Math.hypot(nx, ny) < 0.75 || (y > 147 && Math.hypot(nx * 0.61, (y - 193) / 33) < 1);
        ctx.beginPath();
        ctx.arc(x, y, face ? 1.25 : 0.37, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = "#22211d";
    ctx.font = "600 24px sans-serif";
    ctx.fillText("Wong Ki Hurn", 25, 242);
    ctx.fillStyle = "#780606";
    ctx.fillRect(0, 264, 280, 46);
    ctx.fillStyle = "#fff4e9";
    ctx.font = "bold 12px monospace";
    ctx.fillText("CREW · ALL ACCESS", 25, 292);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

export function createLanyardScene(canvas: HTMLCanvasElement, chain: VerletChain) {
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: true });
  if (!gl || gl.isContextLost()) return;
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, -1, 1, 2000);
  camera.position.z = 1000;
  scene.add(new THREE.HemisphereLight(0xfff5df, 0x818a92, 2.35));
  const key = new THREE.DirectionalLight(0xfff5e1, 2.1);
  key.position.set(-330, 250, 450);
  scene.add(key);
  const edgeLight = new THREE.DirectionalLight(0xb8d1ee, 1.6);
  edgeLight.position.set(200, -110, -200);
  scene.add(edgeLight);

  const badge = new THREE.Group();
  scene.add(badge);
  const shape = new THREE.Shape();
  shape.moveTo(-133, -22);
  shape.lineTo(133, -22);
  shape.quadraticCurveTo(139, -22, 139, -28);
  shape.lineTo(139, -327);
  shape.quadraticCurveTo(139, -333, 133, -333);
  shape.lineTo(-133, -333);
  shape.quadraticCurveTo(-139, -333, -139, -327);
  shape.lineTo(-139, -28);
  shape.quadraticCurveTo(-139, -22, -133, -22);
  const housing = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 7, bevelEnabled: true, bevelThickness: 2, bevelSize: 2, bevelSegments: 3 }),
    new THREE.MeshStandardMaterial({ color: 0x63615b, metalness: 0.56, roughness: 0.34 }),
  );
  housing.position.z = -3.5;
  badge.add(housing);

  for (const back of [false, true]) {
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(276, 307),
      new THREE.MeshStandardMaterial({ map: badgePrint(back), roughness: 0.78 }),
    );
    face.rotation.y = back ? Math.PI : 0;
    face.position.set(0, -177.5, back ? -5.55 : 5.55);
    badge.add(face);
  }

  const steel = new THREE.MeshStandardMaterial({ color: 0xcac6b8, metalness: 0.69, roughness: 0.29 });
  const clip = new THREE.Mesh(new THREE.TorusGeometry(11, 2.6, 10, 32), steel);
  clip.scale.y = 1.35;
  clip.position.y = -12;
  badge.add(clip);
  const cordMapCanvas = document.createElement("canvas");
  cordMapCanvas.width = cordMapCanvas.height = 32;
  const weave = cordMapCanvas.getContext("2d")!;
  weave.fillStyle = "#490f13";
  weave.fillRect(0, 0, 32, 32);
  for (let y = 0; y < 32; y += 3) {
    for (let x = 0; x < 32; x += 4) {
      weave.fillStyle = (x / 4 + y / 3) % 2 ? "#743134" : "#290c10";
      weave.fillRect(x, y, 3, 2);
    }
  }
  const weaveMap = new THREE.CanvasTexture(cordMapCanvas);
  weaveMap.colorSpace = THREE.SRGBColorSpace;
  weaveMap.wrapT = THREE.RepeatWrapping;
  weaveMap.repeat.y = 18;
  const strap = new THREE.PlaneGeometry(1, 1, 1, chain.nodes.length - 1);
  const cord = new THREE.Mesh(strap, new THREE.MeshStandardMaterial({
    map: weaveMap, roughness: 0.94, side: THREE.DoubleSide,
  }));
  cord.frustumCulled = false;
  scene.add(cord);
  const points = strap.getAttribute("position");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let yaw = 0;
  let pitch = 0;
  let flip = 0;
  let flipVelocity = 0;

  return {
    resize(width: number, height: number) {
      camera.right = width;
      camera.bottom = -height;
      camera.updateProjectionMatrix();
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    },
    draw(flipped: boolean, dt: number) {
      const pose = computeBadgePose(chain);
      const tail = chain.nodes[chain.nodes.length - 1];
      const horizontal = tail.x - tail.oldX;
      const vertical = tail.y - tail.oldY;
      const previousNode = chain.nodes[chain.nodes.length - 2];
      const target = flipped ? Math.PI : 0;
      if (motion.matches) {
        yaw = pitch = flipVelocity = 0;
        flip = target;
      } else {
        yaw = THREE.MathUtils.damp(yaw, THREE.MathUtils.clamp(horizontal * 0.032, -0.78, 0.78), 8, dt);
        const strapPitch = Math.atan2(tail.z - previousNode.z, Math.max(1, tail.y - previousNode.y));
        pitch = THREE.MathUtils.damp(pitch, THREE.MathUtils.clamp(strapPitch + vertical * 0.025, -0.52, 0.52), 9, dt);
        flipVelocity += ((target - flip) * 106 - flipVelocity * 14) * dt;
        flip += flipVelocity * dt;
      }
      badge.position.set(pose.x, -pose.y, tail.z);
      badge.scale.setScalar(THREE.MathUtils.clamp(camera.right / 435, 0.58, 1));
      badge.rotation.set(pitch, yaw + flip, THREE.MathUtils.degToRad(-pose.angleDeg), "ZXY");
      chain.nodes.forEach((node, i) => {
        const prev = chain.nodes[Math.max(0, i - 1)];
        const next = chain.nodes[Math.min(chain.nodes.length - 1, i + 1)];
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const width = 6 / (Math.hypot(dx, dy) || 1);
        const t = i / (chain.nodes.length - 1);
        const twist = (yaw + flip * 0.28) * t;
        const z = node.z;
        points.setXYZ(i * 2, node.x - dy * width * Math.cos(twist), -node.y - dx * width, z + Math.sin(twist) * 6);
        points.setXYZ(i * 2 + 1, node.x + dy * width * Math.cos(twist), -node.y + dx * width, z - Math.sin(twist) * 6);
      });
      points.needsUpdate = true;
      strap.computeVertexNormals();
      renderer.render(scene, camera);
    },
    dispose() { disposeScene(scene, renderer); },
  };
}
