import * as THREE from "three";
import type { WheelItem } from "@/components/home/ProjectWheels";

const emblems: Readonly<Record<string, string>> = {
  "elysium": "M10 39V23H90V39C72 39 72 61 90 61V77H10V61C28 61 28 39 10 39ZM62 28V34M62 44V50M62 60V66M30 42H49M30 57H45",
  "otto": "M21 19H79L92 33V67L79 81H21L8 67V33ZM24 45V55M37 35V65M50 27V73M63 38V62M76 46V54",
  "c0re": "M50 11L88 32L50 53L12 32ZM12 49L50 70L88 49M12 66L50 87L88 66M50 24L64 32L50 40L36 32Z",
  "v4ult": "M13 13H87V87H13ZM19 36H13M19 64H13M87 50H94M50 31A19 19 0 1 1 49.9 31ZM50 38V62M39 44L61 56M39 56L61 44",
  "billy": "M23 11H77V89L68 83L59 89L50 83L41 89L32 83L23 89ZM34 31H63M34 44H61M34 57H56M34 71H52M66 57H66.1M66 71H66.1",
  "securefin": "M28 43V29A22 22 0 0 1 72 29V43M20 43H80V87H20ZM33 65Q50 47 67 65Q50 83 33 65ZM50 60V70",
  "campus-network": "M50 22V45M50 45H20V74M50 45V74M50 45H80V74M42 10H58V24H42ZM12 74H28V88H12ZM42 74H58V88H42ZM72 74H88V88H72Z",
  "pneumonia-cnn": "M50 12V48M50 36L32 58M50 36L68 58M45 45C40 24 32 22 25 32C12 52 14 72 20 82C27 91 41 83 45 73ZM55 45C60 24 68 22 75 32C88 52 86 72 80 82C73 91 59 83 55 73Z",
  "care": "M39 12H61V34H83V66H61V88H39V66H17V34H39ZM12 50H32L40 41L49 61L57 47L65 50H88",
  "phishing-shield-ai": "M50 9L85 23V49Q83 75 50 91Q17 75 15 49V23ZM50 28V60Q49 70 39 70Q31 69 31 61V55L25 61M50 27A6 6 0 1 1 49.9 27Z",
  "mobile-medical-app": "M29 9H71Q78 9 78 16V84Q78 91 71 91H29Q22 91 22 84V16Q22 9 29 9ZM42 19H58M43 80H57M50 34V62M36 48H64",
  "ibuniaga": "M16 35L24 18H76L84 35Q84 46 73 46Q64 46 62 39Q60 46 50 46Q40 46 38 39Q36 46 27 46Q16 46 16 35ZM22 45V84H78V45M35 84V62H58V84M34 25L29 39M66 25L71 39",
  "lenz": "M13 33V13H33M67 13H87V33M87 67V87H67M33 87H13V67M25 50Q50 24 75 50Q50 76 25 50ZM50 42A8 8 0 1 1 49.9 42Z",
  "moby": "M30 8H70Q77 8 77 15V85Q77 92 70 92H30Q23 92 23 85V15Q23 8 30 8ZM35 31H46V42H35ZM54 31H65V42H54ZM35 50H46V61H35ZM54 50H65V61H54ZM43 80H57",
  "melt": "M50 12C50 12 75 43 75 62A25 25 0 0 1 25 62C25 43 50 12 50 12ZM38 63Q39 72 47 74M83 30V46M75 38H91",
  "interactive-book": "M50 24Q31 13 10 19V76Q30 69 50 83Q70 69 90 76V19Q69 13 50 24V83M19 31Q33 29 42 36M19 46Q33 44 42 51M58 36Q67 29 81 31M58 51Q67 44 81 46",
  "portfolio": "M11 17H89V83H11ZM11 33H89M20 25H20.1M29 25H29.1M38 25H38.1M37 48L27 59L37 70M63 48L73 59L63 70M56 46L44 72",
  "remy": "M26 44Q15 39 17 29Q20 16 35 19Q39 10 50 10Q61 10 65 19Q80 16 83 29Q85 39 74 44V65H26ZM26 74H74V87H26ZM37 74V81M50 74V83M63 74V81",
};

function drawProjectMotif(
  ctx: CanvasRenderingContext2D,
  slug: string,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  ctx.save();
  ctx.translate(x - radius, y - radius);
  ctx.scale(radius / 50, radius / 50);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const emblem = emblems[slug];
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
  const paper = dark ? "#222221" : "#eaeae7";
  const ink = dark ? "#efefeb" : "#1c1c1c";
  const muted = dark ? "#aaa9a3" : "#595954";
  const line = dark ? "#53534e" : "#bcbcb3";
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = line;

  if (layout === 0) {
    ctx.fillStyle = ink;
    ctx.fillRect(363, 0, 277, h);
    drawProjectMotif(ctx, item.slug, 501, 181, 104, paper);
    ctx.fillStyle = muted;
    for (let i = 0; i < 14; i++) ctx.fillRect(30 + i * 7, 300, i % 3 === 0 ? 4 : 2, 13);
  } else if (layout === 1) {
    ctx.fillStyle = dark ? "#30302d" : "#d9d9d2";
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
    ctx.fillStyle = dark ? "#e1e1d7" : "#292928";
    ctx.beginPath();
    ctx.moveTo(401, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(313, h);
    ctx.closePath();
    ctx.fill();
    drawProjectMotif(ctx, item.slug, 507, 177, 91, paper);
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

  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.strokeRect(12.5, 12.5, w - 25, h - 25);
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
  drawProjectMotif(ctx, item.slug, w / 2, h / 2, w * 0.325, "#efefeb");
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
