import * as THREE from "three";
import type { WheelItem } from "@/components/home/ProjectWheels";

function drawProjectMotif(
  ctx: CanvasRenderingContext2D,
  slug: string,
  cx: number,
  cy: number,
  radius: number,
  fg: string,
  muted: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = fg;
  ctx.fillStyle = fg;
  ctx.lineWidth = 2.2;

  switch (slug) {
    case "elysium": {
      for (let r = radius * 0.28; r <= radius; r += radius * 0.24) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = muted;
      ctx.beginPath();
      ctx.moveTo(-radius * 1.15, 0);
      ctx.lineTo(radius * 1.15, 0);
      ctx.moveTo(0, -radius * 1.15);
      ctx.lineTo(0, radius * 1.15);
      ctx.stroke();
      break;
    }
    case "otto": {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const x = Math.cos(a) * radius * 0.88;
        const y = Math.sin(a) * radius * 0.88;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      const bars = [-0.52, -0.26, 0, 0.26, 0.52];
      const heights = [0.28, 0.65, 0.92, 0.54, 0.32];
      bars.forEach((bx, idx) => {
        const h = radius * heights[idx];
        ctx.fillRect(bx * radius - 3, -h / 2, 6, h);
      });
      break;
    }
    case "c0re": {
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.56, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const nx = Math.cos(a) * radius * 0.94;
        const ny = Math.sin(a) * radius * 0.94;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * radius * 0.56, Math.sin(a) * radius * 0.56);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(nx, ny, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "v4ult": {
      const s = radius * 0.84;
      ctx.strokeRect(-s, -s, s * 2, s * 2);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.52, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * radius * 0.58, Math.sin(a) * radius * 0.58);
        ctx.lineTo(Math.cos(a) * radius * 0.72, Math.sin(a) * radius * 0.72);
        ctx.stroke();
      }
      break;
    }
    case "billy": {
      const w = radius * 1.15;
      const h = radius * 1.4;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      for (let row = -2; row <= 2; row++) {
        const ry = row * (radius * 0.22);
        ctx.beginPath();
        ctx.moveTo(-w * 0.34, ry);
        ctx.lineTo(w * 0.08, ry);
        ctx.moveTo(w * 0.18, ry);
        ctx.lineTo(w * 0.34, ry);
        ctx.stroke();
      }
      break;
    }
    case "securefin": {
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.95);
      ctx.lineTo(radius * 0.85, 0);
      ctx.lineTo(0, radius * 0.95);
      ctx.lineTo(-radius * 0.85, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = muted;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.62, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
      break;
    }
    case "campus-network": {
      const pts = [
        [-0.75, -0.55],
        [0, -0.78],
        [0.75, -0.55],
        [-0.48, 0.55],
        [0.48, 0.55],
      ];
      ctx.strokeStyle = muted;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          ctx.beginPath();
          ctx.moveTo(pts[i][0] * radius, pts[i][1] * radius);
          ctx.lineTo(pts[j][0] * radius, pts[j][1] * radius);
          ctx.stroke();
        }
      }
      ctx.fillStyle = fg;
      pts.forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px * radius, py * radius, 5.5, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
    default: {
      for (let gx = -2; gx <= 2; gx++) {
        for (let gy = -2; gy <= 2; gy++) {
          const r = gx === 0 && gy === 0 ? 6 : 3;
          ctx.beginPath();
          ctx.arc(gx * radius * 0.34, gy * radius * 0.34, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
  }

  ctx.restore();
}

export function paintProjectPlateCanvas(
  canvas: HTMLCanvasElement,
  item: WheelItem,
  index: number,
  dark: boolean,
  overlayImg?: HTMLImageElement,
) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);

  if (overlayImg?.naturalWidth) {
    const scale = Math.max(w / overlayImg.naturalWidth, h / overlayImg.naturalHeight);
    const width = overlayImg.naturalWidth * scale;
    const height = overlayImg.naturalHeight * scale;
    ctx.save();
    ctx.filter = "grayscale(0.75) contrast(1.06)";
    ctx.drawImage(overlayImg, (w - width) / 2, (h - height) / 2, width, height);
    ctx.restore();
    return;
  }

  const bg = dark ? "#222221" : "#eaeae7";
  const fg = dark ? "#ecece9" : "#1c1c1c";
  const muted = dark ? "rgba(236,236,233,0.48)" : "rgba(28,28,28,0.48)";
  const grid = dark ? "rgba(236,236,233,0.08)" : "rgba(28,28,28,0.08)";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  const step = 36;
  for (let x = step; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = step; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.save();
  ctx.globalAlpha = dark ? 0.42 : 0.34;
  drawProjectMotif(ctx, item.slug, w * 0.78, h * 0.5, 86, fg, muted);
  ctx.restore();

  ctx.strokeStyle = muted;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(12, 12, w - 24, h - 24);

  ctx.beginPath();
  ctx.moveTo(w - 44, h - 32);
  ctx.lineTo(w - 22, h - 32);
  ctx.moveTo(w - 33, h - 43);
  ctx.lineTo(w - 33, h - 21);
  ctx.stroke();

  ctx.fillStyle = muted;
  ctx.font = '600 14px "Geist Mono Variable", ui-monospace, monospace';
  ctx.fillText(`PLATE::N°${String(index + 1).padStart(2, "0")}`, 28, 42);
  ctx.fillText(item.tag, w - 28 - ctx.measureText(item.tag).width, 42);

  ctx.fillStyle = fg;
  ctx.font = '500 40px "Geist Variable", -apple-system, sans-serif';
  ctx.fillText(item.name.slice(0, 22), 28, h * 0.57);

  ctx.fillStyle = muted;
  ctx.font = '500 13px "Geist Mono Variable", ui-monospace, monospace';
  ctx.fillText(`${item.lens} · ${item.role} · ${item.year}`, 28, h - 28);
}

export function paintIconEmblemCanvas(
  canvas: HTMLCanvasElement,
  item: WheelItem,
  index: number,
  overlayImg?: HTMLImageElement,
) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createRadialGradient(w * 0.35, h * 0.3, 12, w * 0.5, h * 0.5, w * 0.72);
  grad.addColorStop(0, "#2c2c2b");
  grad.addColorStop(1, "#141414");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(236,236,233,0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, w - 28, h - 28);

  if (overlayImg && overlayImg.complete && overlayImg.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.drawImage(overlayImg, w * 0.18, h * 0.18, w * 0.64, h * 0.64);
    ctx.restore();
  }

  drawProjectMotif(ctx, item.slug, w * 0.5, h * 0.45, 58, "#f0f0ed", "rgba(240,240,237,0.42)");

  ctx.fillStyle = "rgba(240,240,237,0.64)";
  ctx.font = '600 13px "Geist Mono Variable", ui-monospace, monospace';
  const code = `${String(index + 1).padStart(2, "0")}::${item.slug.slice(0, 5).toUpperCase()}`;
  ctx.fillText(code, (w - ctx.measureText(code).width) / 2, h - 26);
}

export function createBeveledTileGeometry(
  size = 1.24,
  radius = 0.22,
  depth = 0.14,
  bevelSegments = 3,
  curveSegments = 8,
): THREE.ExtrudeGeometry {
  const half = size * 0.5;
  const r = Math.min(radius, half * 0.45);
  const shape = new THREE.Shape();

  shape.moveTo(-half + r, -half);
  shape.lineTo(half - r, -half);
  shape.quadraticCurveTo(half, -half, half, -half + r);
  shape.lineTo(half, half - r);
  shape.quadraticCurveTo(half, half, half - r, half);
  shape.lineTo(-half + r, half);
  shape.quadraticCurveTo(-half, half, -half, half - r);
  shape.lineTo(-half, -half + r);
  shape.quadraticCurveTo(-half, -half, -half + r, -half);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.045,
    bevelSegments,
    curveSegments,
  });
  geo.center();
  return geo;
}

export function createParticleSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.55, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
