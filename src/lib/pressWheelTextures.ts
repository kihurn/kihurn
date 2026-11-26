import * as THREE from "three";
import { projectEmblems } from "./projectEmblems";
import type { WheelItem } from "@/components/home/ProjectWheels";

function drawProjectMotif(
  ctx: CanvasRenderingContext2D,
  slug: string,
  x: number,
  y: number,
  radius: number,
  color: string,
  metallic = false,
) {
  ctx.save();
  ctx.translate(x - radius, y - radius);
  ctx.scale(radius / 50, radius / 50);
  if (metallic) {
    const alloy = ctx.createLinearGradient(18, 0, 79, 100);
    alloy.addColorStop(0, "#6e737d");
    alloy.addColorStop(0.27, "#e8e9e8");
    alloy.addColorStop(0.42, "#aeb4c1");
    alloy.addColorStop(0.63, "#e4e0d8");
    alloy.addColorStop(0.82, "#9299a8");
    alloy.addColorStop(1, "#ced0cf");
    ctx.strokeStyle = alloy;
  } else ctx.strokeStyle = color;
  ctx.lineWidth = metallic ? 3.6 : 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const emblem = projectEmblems[slug];
  if (emblem) {
    ctx.stroke(new Path2D(emblem));
  } else {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 34px ui-monospace, monospace";
    ctx.fillStyle = color;
    ctx.fillText(slug.slice(0, 3).toUpperCase(), 50, 50);
  }
  ctx.restore();
}

function drawPlateTitle(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, width: number, lineHeight: number) {
  let line = "";
  for (const word of name.split(" ")) {
    const next = line ? line + " " + word : word;
    if (line && ctx.measureText(next).width > width) {
      ctx.fillText(line, x, y, width);
      y += lineHeight;
      line = word;
    } else {
      line = next;
    }
  }
  ctx.fillText(line, x, y, width);
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

  const layout = index % 4;
  const paper = dark ? "#17191b" : "#242628";
  const ink = "#efefeb";
  const muted = "#a3a7a9";
  const line = "#4c5052";
  const stock = ctx.createLinearGradient(0, h, w, 0);
  stock.addColorStop(0, paper);
  stock.addColorStop(1, ["#33383d", "#202427", "#283335", "#34383e"][layout]);
  ctx.fillStyle = stock;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = line;

  if (layout === 0) {
    ctx.save();
    ctx.translate(505, 171);
    ctx.rotate(-0.14);
    ctx.lineWidth = 1.2;
    for (const radius of [92, 129, 166, 203]) {
      ctx.beginPath();
      ctx.ellipse(25, 2, radius, radius * 0.79, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    drawProjectMotif(ctx, item.slug, 497, 171, 78, ink);
    ctx.fillStyle = muted;
    for (let i = 0; i < 14; i++) ctx.fillRect(30 + i * 7, 300, i % 3 === 0 ? 4 : 2, 13);
  } else if (layout === 1) {
    ctx.fillStyle = "#262a2d";
    ctx.fillRect(349, 63, 254, 222);
    ctx.strokeRect(349.5, 63.5, 253, 221);
    ctx.strokeRect(349.5, 63.5, 253, 29);
    ctx.strokeRect(368.5, 110.5, 215, 100);
    drawProjectMotif(ctx, item.slug, 476, 160, 48, ink);
    ctx.fillStyle = muted;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(366 + i * 58, 235, 43, 2);
      ctx.fillRect(366 + i * 58, 248, 32 - (i % 3) * 5, 2);
    }
  } else if (layout === 2) {
    ctx.beginPath();
    for (let x = 345; x <= 609; x += 24) {
      ctx.moveTo(x, 69);
      ctx.lineTo(x, 288);
    }
    for (let y = 69; y <= 288; y += 24) {
      ctx.moveTo(345, y);
      ctx.lineTo(609, y);
    }
    ctx.stroke();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    const plot = [247, 233, 240, 194, 204, 137, 167, 115, 130, 91];
    plot.forEach((y, i) => {
      const x = 346 + i * 29;
      const sample = y + Math.sin(index * 2.7 + i) * 12;
      if (i === 0) ctx.moveTo(x, sample);
      else ctx.lineTo(x, sample);
    });
    ctx.stroke();
    ctx.fillStyle = paper;
    ctx.fillRect(489, 178, 120, 110);
    drawProjectMotif(ctx, item.slug, 550, 232, 42, ink);
  } else {
    ctx.beginPath();
    for (let i = -1; i < 7; i++) {
      ctx.moveTo(433 + i * 40, 0);
      ctx.lineTo(303 + i * 40, h);
    }
    ctx.stroke();
    drawProjectMotif(ctx, item.slug, 507, 177, 91, ink);
    ctx.fillStyle = muted;
    ctx.fillRect(25, 273, 192, 1);
    ctx.fillRect(25, 284, 141, 1);
  }

  ctx.fillStyle = muted;
  ctx.font = "600 13px ui-monospace, monospace";
  ctx.fillText(item.lens, 27, 36);
  ctx.fillText(item.tag, 27, h - 24);

  ctx.fillStyle = ink;
  ctx.font = layout === 0 ? '600 52px Georgia, serif' : "600 43px system-ui, sans-serif";
  drawPlateTitle(ctx, item.name, 26, layout === 0 ? 144 : 137, layout === 0 ? 310 : 294, layout === 0 ? 49 : 44);
}

export function paintIconEmblemCanvas(canvas: HTMLCanvasElement, item: WheelItem) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const background = ctx.createRadialGradient(w * 0.38, h * 0.30, 10, w * 0.5, h * 0.5, w * 0.74);
  background.addColorStop(0, "#333332");
  background.addColorStop(1, "#151515");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);
  drawProjectMotif(ctx, item.slug, w / 2, h / 2, w * 0.325, "#efefeb", true);
}

function roundedTileShape(size: number, radius: number) {
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
  return shape;
}

export function createTileFaceGeometry(size: number, radius: number): THREE.ShapeGeometry {
  const geometry = new THREE.ShapeGeometry(roundedTileShape(size, radius), 10);
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) / size + 0.5, uv.getY(i) / size + 0.5);
  }
  return geometry;
}

export function createBeveledTileGeometry(
  size = 1.24,
  radius = 0.22,
  depth = 0.14,
  bevelSegments = 3,
  curveSegments = 8,
): THREE.ExtrudeGeometry {
  const geo = new THREE.ExtrudeGeometry(roundedTileShape(size, radius), {
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
