import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { eventPortfolioQr } from "@/content/gigs";
import { disposeScene } from "@/lib/disposeScene";
import { computeBadgePose, type VerletChain } from "@/lib/physics/verlet";

export const BADGE_WIDTH = 245;
export const BADGE_HEIGHT = 390;
export const BADGE_TOP = 64;
export const FRAME_BORDER = 16;
export const STRAP_WIDTH = 38;
export const QR_SIZE = 156;

const insertWidth = BADGE_WIDTH - FRAME_BORDER * 2;
const insertHeight = BADGE_HEIGHT - FRAME_BORDER * 2;

function roundedPanel(width: number, height: number, top: number, radius: number) {
  const half = width / 2;
  const bottom = top - height;
  const shape = new THREE.Shape();
  shape.moveTo(-half + radius, top);
  shape.lineTo(half - radius, top);
  shape.quadraticCurveTo(half, top, half, top - radius);
  shape.lineTo(half, bottom + radius);
  shape.quadraticCurveTo(half, bottom, half - radius, bottom);
  shape.lineTo(-half + radius, bottom);
  shape.quadraticCurveTo(-half, bottom, -half, bottom + radius);
  shape.lineTo(-half, top - radius);
  shape.quadraticCurveTo(-half, top, -half + radius, top);
  return shape;
}

function badgePrint(back: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = insertWidth * 4;
  canvas.height = insertHeight * 4;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(4, 4);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, insertWidth, insertHeight);
  const labelY = back ? 18 : insertHeight - 66;
  ctx.fillStyle = "#15161a";
  ctx.fillRect(14, labelY, insertWidth - 28, 48);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = back ? "600 19px sans-serif" : "600 24px sans-serif";
  ctx.fillText(back ? "Event portfolio" : "Wong Ki Hurn", insertWidth / 2, labelY + 24);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}

export function createLanyardScene(canvas: HTMLCanvasElement, chain: VerletChain, onTextureReady: () => void) {
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: true });
  if (!gl || gl.isContextLost()) return;
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
  renderer.setClearColor(0, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, -1, 1, 2000);
  camera.position.z = 1000;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const reflections = pmrem.fromScene(room, .04);
  scene.environment = reflections.texture;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x818a92, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(-330, 250, 450);
  scene.add(key);
  const edgeLight = new THREE.DirectionalLight(0xb8d1ee, 1.6);
  edgeLight.position.set(200, -110, -200);
  scene.add(edgeLight);

  const badge = new THREE.Group();
  scene.add(badge);
  const top = -BADGE_TOP;
  const shape = roundedPanel(BADGE_WIDTH - 2, BADGE_HEIGHT - 2, top, 13);
  const opening = roundedPanel(insertWidth + 3, insertHeight + 3, top - FRAME_BORDER + 1.5, 5);
  shape.holes.push(new THREE.Path(opening.getPoints()));
  const frameMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0a0b0d, metalness: .12, roughness: .38, clearcoat: .35, envMapIntensity: .22,
  });
  const housing = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 9, bevelThickness: 1.5, bevelSize: 1.5, bevelSegments: 5, curveSegments: 18 }),
    frameMaterial,
  );
  housing.position.z = -4.5;
  badge.add(housing);

  const insert = new THREE.Mesh(
    new THREE.BoxGeometry(insertWidth, insertHeight, 4),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .52 }),
  );
  insert.position.y = top - BADGE_HEIGHT / 2 - 1;
  badge.add(insert);

  for (const back of [false, true]) {
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(insertWidth, insertHeight),
      new THREE.MeshBasicMaterial({ map: badgePrint(back) }),
    );
    face.rotation.y = back ? Math.PI : 0;
    face.position.set(0, insert.position.y, back ? -2.1 : 2.1);
    badge.add(face);
  }

  const qrImage = new Image();
  const qrMap = new THREE.Texture(qrImage);
  qrMap.colorSpace = THREE.SRGBColorSpace;
  qrMap.magFilter = THREE.NearestFilter;
  qrMap.minFilter = THREE.NearestFilter;
  qrMap.generateMipmaps = false;
  const qr = new THREE.Mesh(new THREE.PlaneGeometry(QR_SIZE, QR_SIZE), new THREE.MeshBasicMaterial({ map: qrMap, transparent: true }));
  qr.rotation.y = Math.PI;
  qr.position.set(0, top - FRAME_BORDER - 190, -2.3);
  qr.visible = false;
  badge.add(qr);
  qrImage.onload = () => {
    qrMap.needsUpdate = true;
    qr.visible = true;
    onTextureReady();
  };
  qrImage.src = eventPortfolioQr;

  const steel = new THREE.MeshStandardMaterial({ color: 0xe1e7ef, metalness: .89, roughness: .22 });
  const ferrule = new THREE.Mesh(new THREE.BoxGeometry(STRAP_WIDTH + 4, 9, 9), frameMaterial);
  ferrule.position.y = -1;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 2.4, 16, 64), steel);
  ring.position.y = -15;
  const swivel = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.6, 13, 24), steel);
  swivel.position.y = -31;
  const eyelet = new THREE.Mesh(new THREE.TorusGeometry(12, 4, 12, 36), frameMaterial);
  eyelet.position.y = top + 4;
  const claspPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -34, 1), new THREE.Vector3(-7, -42, 1), new THREE.Vector3(-8, -51, 1),
    new THREE.Vector3(-3, -58, 1), new THREE.Vector3(7, -57, 1), new THREE.Vector3(10, -50, 1),
    new THREE.Vector3(6, -46, 1),
  ]);
  const hook = new THREE.Mesh(new THREE.TubeGeometry(claspPath, 40, 2.8, 12), steel);
  const latch = new THREE.Mesh(new THREE.CapsuleGeometry(1.4, 8, 6, 12), steel);
  latch.position.set(3.4, -43, 1);
  latch.rotation.z = .49;
  badge.add(ferrule, ring, swivel, eyelet, hook, latch);
  const cordMapCanvas = document.createElement("canvas");
  cordMapCanvas.width = cordMapCanvas.height = 128;
  const weave = cordMapCanvas.getContext("2d")!;
  weave.fillStyle = "#0c0d10";
  weave.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 4) {
    for (let x = 0; x < 128; x += 4) {
      weave.fillStyle = (x / 4 + y / 4) % 2 ? "#191b20" : "#060709";
      weave.fillRect(x, y, 3, 2);
    }
  }
  const weaveMap = new THREE.CanvasTexture(cordMapCanvas);
  weaveMap.colorSpace = THREE.SRGBColorSpace;
  weaveMap.wrapT = THREE.RepeatWrapping;
  weaveMap.repeat.y = 18;
  const strap = new THREE.PlaneGeometry(1, 1, 1, chain.nodes.length - 1);
  const cord = new THREE.Mesh(strap, new THREE.MeshStandardMaterial({
    map: weaveMap, roughness: .94, envMapIntensity: .18, side: THREE.DoubleSide,
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
      const pixels = Math.max(1, width * height);
      renderer.setPixelRatio(Math.min(2.25, Math.max(1.5, devicePixelRatio), Math.sqrt(5_000_000 / pixels)));
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
        yaw = THREE.MathUtils.damp(yaw, THREE.MathUtils.clamp(horizontal * 0.032, -0.78, 0.78), 5, dt);
        const strapPitch = Math.atan2(tail.z - previousNode.z, Math.max(1, tail.y - previousNode.y));
        pitch = THREE.MathUtils.damp(pitch, THREE.MathUtils.clamp(strapPitch + vertical * 0.025, -0.52, 0.52), 6, dt);
        flipVelocity += ((target - flip) * 48 - flipVelocity * 8.4) * dt;
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
      reflections.dispose();
      disposeScene(scene, renderer);
    },
  };
}
