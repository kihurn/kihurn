import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { eventPortfolioQr } from "@/content/gigs";
import { disposeScene } from "@/lib/disposeScene";
import { computeBadgePose, type VerletChain } from "@/lib/physics/verlet";
import { ART_HEIGHT, ART_WIDTH, BADGE_HEIGHT, BADGE_WIDTH, CARD_PAPER, FRAME_BORDER, QR_CENTER_Y, QR_SIZE } from "./LanyardArtwork";

export const BADGE_TOP = 64;
export const STRAP_WIDTH = 41;

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

function badgePrint(art: SVGSVGElement, onTextureReady: () => void) {
  const canvas = document.createElement("canvas");
  canvas.width = ART_WIDTH * 4;
  canvas.height = ART_HEIGHT * 4;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = CARD_PAPER;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const image = new Image();
  image.onload = () => {
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    map.needsUpdate = true;
    onTextureReady();
  };
  image.src = `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(art))}`;
  return { map, image };
}

export function createLanyardScene(canvas: HTMLCanvasElement, chain: VerletChain, artwork: [SVGSVGElement, SVGSVGElement], onTextureReady: () => void) {
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
  const opening = roundedPanel(ART_WIDTH + 3, ART_HEIGHT + 3, top - FRAME_BORDER + 1.5, 5);
  shape.holes.push(new THREE.Path(opening.getPoints()));
  const frameMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x101010, metalness: .12, roughness: .54, clearcoat: .24, specularIntensity: .36, envMapIntensity: .1,
  });
  const housing = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 9, bevelThickness: 1.5, bevelSize: 1.5, bevelSegments: 5, curveSegments: 18 }),
    [new THREE.MeshBasicMaterial({ color: 0x161616 }), frameMaterial],
  );
  housing.position.z = -4.5;
  badge.add(housing);

  const insert = new THREE.Mesh(
    new THREE.BoxGeometry(ART_WIDTH, ART_HEIGHT, 4),
    new THREE.MeshStandardMaterial({ color: CARD_PAPER, roughness: .52 }),
  );
  insert.position.y = top - BADGE_HEIGHT / 2 - 1;
  badge.add(insert);

  const lamination = new THREE.ShaderMaterial({
    uniforms: { shift: { value: 0 }, strength: { value: .02 } },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec2 surfaceUv;
      void main() {
        surfaceUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 surfaceUv;
      uniform float shift;
      uniform float strength;
      void main() {
        float ribbon = 1.0 - smoothstep(0.008, 0.17, abs(surfaceUv.x - surfaceUv.y * 0.68 - shift));
        gl_FragColor = vec4(1.0, 1.0, 1.0, ribbon * strength);
      }
    `,
  });
  const prints = artwork.map((art) => badgePrint(art, onTextureReady));
  for (const [i, { map }] of prints.entries()) {
    const back = i === 1;
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(ART_WIDTH, ART_HEIGHT),
      new THREE.MeshBasicMaterial({ map }),
    );
    face.rotation.y = back ? Math.PI : 0;
    face.position.set(0, insert.position.y, back ? -2.1 : 2.1);
    badge.add(face);
    const sheen = new THREE.Mesh(face.geometry, lamination);
    sheen.rotation.y = face.rotation.y;
    sheen.position.set(0, insert.position.y, back ? -2.2 : 2.2);
    badge.add(sheen);
  }

  const qrImage = new Image();
  const qrMap = new THREE.Texture(qrImage);
  qrMap.colorSpace = THREE.SRGBColorSpace;
  qrMap.magFilter = THREE.NearestFilter;
  qrMap.minFilter = THREE.NearestFilter;
  qrMap.generateMipmaps = false;
  const qr = new THREE.Mesh(new THREE.PlaneGeometry(QR_SIZE, QR_SIZE), new THREE.MeshBasicMaterial({ map: qrMap, transparent: true }));
  qr.rotation.y = Math.PI;
  qr.position.set(0, insert.position.y + ART_HEIGHT / 2 - QR_CENTER_Y, -2.3);
  qr.visible = false;
  badge.add(qr);
  qrImage.onload = () => {
    qrMap.needsUpdate = true;
    qr.visible = true;
    onTextureReady();
  };
  qrImage.src = eventPortfolioQr;

  const steel = new THREE.MeshStandardMaterial({ color: 0x27292d, metalness: .87, roughness: .37, envMapIntensity: .32 });
  const ferrule = new THREE.Mesh(new THREE.BoxGeometry(STRAP_WIDTH + 4, 9, 9), frameMaterial);
  ferrule.position.y = -1;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 2.4, 16, 64), steel);
  ring.position.y = -15;
  const swivel = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.6, 13, 24), steel);
  swivel.position.y = -31;
  const eyelet = new THREE.Mesh(new THREE.TorusGeometry(10, 4, 12, 36), frameMaterial);
  eyelet.scale.set(1.45, .72, 1);
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
    map: weaveMap, color: 0xb1b1b1, roughness: .98, envMapIntensity: .12, side: THREE.DoubleSide,
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
      lamination.uniforms.shift.value = .15 + Math.sin(yaw + flip) * .4 + pitch * .22;
      lamination.uniforms.strength.value = .033 + Math.abs(Math.sin(yaw + flip)) * .055;
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
      for (const { image } of prints) image.onload = null;
      reflections.dispose();
      disposeScene(scene, renderer);
    },
  };
}
