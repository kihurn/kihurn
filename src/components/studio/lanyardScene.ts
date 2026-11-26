import * as THREE from "three";
import { eventPortfolioQr } from "@/content/gigs";
import { disposeScene } from "@/lib/disposeScene";
import { computeBadgePose, type VerletChain } from "@/lib/physics/verlet";

export const BADGE_WIDTH = 200;
export const BADGE_HEIGHT = 318;
export const BADGE_TOP = 24;
export const STRAP_WIDTH = 26;
export const QR_SIZE = 144;

function badgePrint(back: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = BADGE_WIDTH * 3;
  canvas.height = BADGE_HEIGHT * 3;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(3, 3);
  const graphite = ctx.createLinearGradient(0, 0, BADGE_WIDTH, BADGE_HEIGHT);
  graphite.addColorStop(0, "#24262b");
  graphite.addColorStop(.34, "#151619");
  graphite.addColorStop(.56, "#303237");
  graphite.addColorStop(.67, "#141519");
  graphite.addColorStop(1, "#1d1f23");
  ctx.fillStyle = graphite;
  ctx.fillRect(0, 0, BADGE_WIDTH, BADGE_HEIGHT);
  ctx.fillStyle = "#8a151b";
  ctx.fillRect(0, BADGE_HEIGHT - 4, BADGE_WIDTH, 4);
  ctx.fillStyle = "#e9e9e4";
  ctx.textAlign = "center";
  const center = BADGE_WIDTH / 2;
  if (back) {
    ctx.font = "bold 11px monospace";
    ctx.fillText("KIHURN", center, 51);
    ctx.font = "600 23px sans-serif";
    ctx.fillText("Event portfolio", center, 83);
  } else {
    ctx.font = "bold 11px monospace";
    ctx.fillText("EVENT CREW", center, 220);
    ctx.font = "600 26px sans-serif";
    ctx.fillText("Wong Ki Hurn", center, 252);
    ctx.fillStyle = "#babcc2";
    ctx.font = "bold 10px monospace";
    ctx.fillText("CREW · ALL ACCESS", center, 280);
    ctx.fillStyle = "#101115";
    ctx.fillRect(24, 24, 152, 156);
    ctx.fillStyle = "#d9dadf";
    for (let y = 29; y < 177; y += 4) {
      for (let x = 28; x < 173; x += 4) {
        const nx = (x - center) / 39;
        const ny = (y - 81) / 36;
        const face = Math.hypot(nx, ny) < .8 || (y > 115 && Math.hypot(nx * .69, (y - 146) / 36) < 1);
        ctx.beginPath();
        ctx.arc(x, y, face ? 1.25 : 0.37, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

export function createLanyardScene(canvas: HTMLCanvasElement, chain: VerletChain, onTextureReady: () => void) {
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: true });
  if (!gl || gl.isContextLost()) return;
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
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
  const half = BADGE_WIDTH / 2;
  const top = -BADGE_TOP;
  const bottom = top - BADGE_HEIGHT;
  const shape = new THREE.Shape();
  shape.moveTo(-half + 6, top);
  shape.lineTo(half - 6, top);
  shape.quadraticCurveTo(half, top, half, top - 6);
  shape.lineTo(half, bottom + 6);
  shape.quadraticCurveTo(half, bottom, half - 6, bottom);
  shape.lineTo(-half + 6, bottom);
  shape.quadraticCurveTo(-half, bottom, -half, bottom + 6);
  shape.lineTo(-half, top - 6);
  shape.quadraticCurveTo(-half, top, -half + 6, top);
  const housing = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 7, bevelEnabled: true, bevelThickness: 2, bevelSize: 2, bevelSegments: 3 }),
    new THREE.MeshPhysicalMaterial({ color: 0x282a30, metalness: .55, roughness: .22, clearcoat: 1 }),
  );
  housing.position.z = -3.5;
  badge.add(housing);

  for (const back of [false, true]) {
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(BADGE_WIDTH - 3, BADGE_HEIGHT - 3),
      new THREE.MeshPhysicalMaterial({ map: badgePrint(back), roughness: .27, clearcoat: 1, clearcoatRoughness: .17 }),
    );
    face.rotation.y = back ? Math.PI : 0;
    face.position.set(0, top - BADGE_HEIGHT / 2, back ? -5.55 : 5.55);
    badge.add(face);
  }

  const qrImage = new Image();
  const qrMap = new THREE.Texture(qrImage);
  qrMap.colorSpace = THREE.SRGBColorSpace;
  qrMap.magFilter = THREE.NearestFilter;
  qrMap.minFilter = THREE.NearestFilter;
  qrMap.generateMipmaps = false;
  const qr = new THREE.Mesh(new THREE.PlaneGeometry(QR_SIZE, QR_SIZE), new THREE.MeshBasicMaterial({ map: qrMap }));
  qr.rotation.y = Math.PI;
  qr.position.set(0, top - 186, -5.8);
  qr.visible = false;
  badge.add(qr);
  qrImage.onload = () => {
    qrMap.needsUpdate = true;
    qr.visible = true;
    onTextureReady();
  };
  qrImage.src = eventPortfolioQr;

  const steel = new THREE.MeshStandardMaterial({ color: 0xcac6b8, metalness: 0.69, roughness: 0.29 });
  const clip = new THREE.Mesh(new THREE.TorusGeometry(11, 2.6, 10, 32), steel);
  clip.scale.y = 1.35;
  clip.position.y = -12;
  badge.add(clip);
  const cordMapCanvas = document.createElement("canvas");
  cordMapCanvas.width = cordMapCanvas.height = 32;
  const weave = cordMapCanvas.getContext("2d")!;
  weave.fillStyle = "#36383e";
  weave.fillRect(0, 0, 32, 32);
  for (let y = 0; y < 32; y += 3) {
    for (let x = 0; x < 32; x += 4) {
      weave.fillStyle = (x / 4 + y / 3) % 2 ? "#53565f" : "#22242a";
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
        const width = STRAP_WIDTH / 2 / (Math.hypot(dx, dy) || 1);
        const t = i / (chain.nodes.length - 1);
        const twist = (yaw + flip * 0.28) * t;
        const z = node.z;
        const depth = Math.sin(twist) * STRAP_WIDTH / 2;
        points.setXYZ(i * 2, node.x - dy * width * Math.cos(twist), -node.y - dx * width, z + depth);
        points.setXYZ(i * 2 + 1, node.x + dy * width * Math.cos(twist), -node.y + dx * width, z - depth);
      });
      points.needsUpdate = true;
      strap.computeVertexNormals();
      renderer.render(scene, camera);
    },
    dispose() {
      qrImage.onload = null;
      disposeScene(scene, renderer);
    },
  };
}
