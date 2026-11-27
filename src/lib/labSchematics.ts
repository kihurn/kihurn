export type LabViewMode = "list" | "wheel" | "grid";

export function normalizeLabMode(raw: string | null | undefined): LabViewMode {
  if (raw === "list" || raw === "flat") return "list";
  if (raw === "grid") return "grid";
  return "wheel";
}

export interface HalftoneDot {
  x: number;
  y: number;
  r: number;
  hot: boolean;
}

export function computeMiniHalftoneDots(
  width: number,
  height: number,
  pointerX: number,
  pointerY: number,
  spacing = 16,
  radius = 64,
): HalftoneDot[] {
  const dots: HalftoneDot[] = [];
  if (width <= 0 || height <= 0 || spacing <= 0) return dots;
  const cols = Math.max(2, Math.floor((width - 24) / spacing));
  const rows = Math.max(2, Math.floor((height - 24) / spacing));
  const ox = (width - (cols - 1) * spacing) * 0.5;
  const oy = (height - (rows - 1) * spacing) * 0.5;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hx = ox + c * spacing;
      const hy = oy + r * spacing;
      const dx = hx - pointerX;
      const dy = hy - pointerY;
      const dist = Math.hypot(dx, dy) || 1;
      const push = Math.max(0, 1 - dist / radius);
      const disp = push * 11;
      dots.push({
        x: hx + (dx / dist) * disp,
        y: hy + (dy / dist) * disp,
        r: 1.5 + push * 2.6,
        hot: push > 0.38,
      });
    }
  }
  return dots;
}

export function drawMiniExperimentFrame(
  ctx: CanvasRenderingContext2D,
  slug: string,
  w: number,
  h: number,
  t: number,
  px: number,
  py: number,
  dark: boolean,
  cover = false,
) {
  const bg = dark ? "#181817" : "#ebeae7";
  const fg = dark ? "#ecece9" : "#1c1c1c";
  const muted = dark ? "rgba(236,236,233,0.34)" : "rgba(28,28,28,0.34)";
  const accent = dark ? "#e06a4a" : "#b03a1e";

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = dark ? "rgba(236,236,233,0.06)" : "rgba(28,28,28,0.06)";
  ctx.lineWidth = 1;
  for (let x = 24; x < w; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 24; y < h; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const cx = w * 0.5;
  const cy = h * 0.5;

  if (slug === "vocal-orb") {
    const baseR = Math.min(w, h) * 0.28;
    const tiltX = (px / Math.max(1, w) - 0.5) * 0.6;
    const tiltY = (py / Math.max(1, h) - 0.5) * 0.6;
    for (let ring = 0; ring < 7; ring++) {
      const k = ring / 6;
      const rScale = 0.42 + k * 0.62;
      ctx.strokeStyle = ring === 6 ? fg : muted;
      ctx.lineWidth = ring === 6 ? 1.8 : 1;
      ctx.beginPath();
      const steps = 48;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const n =
          Math.sin(a * 4 + t * 1.9 + ring) * 0.11 +
          Math.cos(a * 3 - t * 1.3 - ring * 0.6) * 0.08;
        const r = baseR * rScale * (1 + n);
        const x = cx + Math.cos(a) * r + tiltX * (ring - 3) * 7;
        const y = cy + Math.sin(a) * r * 0.92 + tiltY * (ring - 3) * 7;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(cx + tiltX * 14, cy + tiltY * 14, 3.5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (slug === "polka-field") {
    const dots = computeMiniHalftoneDots(w, h, px, py, 16, Math.min(w, h) * 0.36);
    for (const d of dots) {
      const ripple = cover ? Math.sin(Math.hypot(d.x - px, d.y - py) * 0.13 - t * 3) : 0;
      ctx.fillStyle = d.hot ? accent : fg;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * (1 + ripple * 0.16), 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (slug === "rotary-detent") {
    const step = (Math.PI * 2) / 12;
    const notchFloat = ((t * 0.7) % 12 + 12) % 12;
    const snapped = Math.round(notchFloat);
    const angle = (notchFloat + Math.sin(t * 2.4) * 0.08) * step;
    const rad = Math.min(w, h) * 0.3;

    for (let i = 0; i < 12; i++) {
      const a = i * step - Math.PI / 2;
      const active = i === snapped % 12;
      ctx.strokeStyle = active ? accent : muted;
      ctx.lineWidth = active ? 2.2 : 1.1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (rad + 8), cy + Math.sin(a) * (rad + 8));
      ctx.lineTo(cx + Math.cos(a) * (rad + (active ? 19 : 14)), cy + Math.sin(a) * (rad + (active ? 19 : 14)));
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = fg;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, -rad * 0.25);
    ctx.lineTo(0, -rad + 6);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (slug === "paper-poster") {
    const cols = 10;
    const rows = 13;
    const pw = Math.min(w * 0.56, cover ? h * 0.62 : 150, 150);
    const ph = pw * 1.28;
    const left = cx - pw * 0.5;
    const top = cy - ph * 0.5;
    const nx = px / Math.max(1, w);
    const ny = py / Math.max(1, h);

    ctx.strokeStyle = fg;
    ctx.lineWidth = 1.1;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const u = c / cols;
        const v = r / rows;
        const d = Math.hypot(u - nx, v - ny);
        const bow = Math.exp(-d * d * 5.5) * 14 + Math.sin(v * 7 - t * 2) * 3;
        const x = left + u * pw + (u - 0.5) * bow * 0.35;
        const y = top + v * ph - bow;
        if (c === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      for (let r = 0; r <= rows; r++) {
        const u = c / cols;
        const v = r / rows;
        const d = Math.hypot(u - nx, v - ny);
        const bow = Math.exp(-d * d * 5.5) * 14 + Math.sin(v * 7 - t * 2) * 3;
        const x = left + u * pw + (u - 0.5) * bow * 0.35;
        const y = top + v * ph - bow;
        if (r === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    return;
  }

  drawProjectSchematic(ctx, slug, w, h, t, dark);
}

export function drawProjectSchematic(
  ctx: CanvasRenderingContext2D,
  slug: string,
  w: number,
  h: number,
  t: number,
  dark: boolean,
) {
  const fg = dark ? "#ecece9" : "#1c1c1c";
  const muted = dark ? "rgba(236,236,233,0.42)" : "rgba(28,28,28,0.42)";
  const accent = dark ? "#e06a4a" : "#b03a1e";

  const cx = w * 0.5;
  const cy = h * 0.5;
  const r = Math.min(w, h) * 0.27;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = fg;
  ctx.fillStyle = fg;
  ctx.lineWidth = 1.4;

  switch (slug) {
    case "otto": {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.12;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      for (let b = -3; b <= 3; b++) {
        const mag = (0.35 + 0.45 * Math.abs(Math.sin(t * 2.6 + b * 0.8))) * r;
        ctx.fillStyle = b === 0 ? accent : fg;
        ctx.fillRect(b * 10 - 2.5, -mag * 0.5, 5, mag);
      }
      break;
    }
    case "c0re": {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + t * 0.22;
        const sx = Math.cos(a) * r * 1.05;
        const sy = Math.sin(a) * r * 1.05;
        ctx.strokeStyle = muted;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "elysium": {
      for (let k = 1; k <= 4; k++) {
        const ringR = r * (0.25 * k) + Math.sin(t * 1.8 - k * 0.7) * 2.5;
        ctx.strokeStyle = k === 4 ? accent : fg;
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = muted;
      ctx.beginPath();
      ctx.moveTo(-r * 1.25, 0);
      ctx.lineTo(r * 1.25, 0);
      ctx.moveTo(0, -r * 1.25);
      ctx.lineTo(0, r * 1.25);
      ctx.stroke();
      break;
    }
    case "securefin": {
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.05);
      ctx.lineTo(r * 0.92, 0);
      ctx.lineTo(0, r * 1.05);
      ctx.lineTo(-r * 0.92, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = accent;
      const scanY = Math.sin(t * 2) * r * 0.55;
      ctx.beginPath();
      ctx.moveTo(-r * 0.65, scanY);
      ctx.lineTo(r * 0.65, scanY);
      ctx.stroke();
      ctx.strokeStyle = fg;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "campus-network": {
      const nodes: [number, number][] = [
        [-0.85, -0.58],
        [0, -0.82],
        [0.85, -0.58],
        [-0.55, 0.58],
        [0.55, 0.58],
      ];
      ctx.strokeStyle = muted;
      ctx.setLineDash([4, 4]);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          ctx.beginPath();
          ctx.moveTo(nodes[i][0] * r, nodes[i][1] * r);
          ctx.lineTo(nodes[j][0] * r, nodes[j][1] * r);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
      nodes.forEach(([nx, ny], idx) => {
        ctx.fillStyle = idx === 1 ? accent : fg;
        const size = 7 + Math.sin(t * 2.2 - idx) * 2;
        ctx.fillRect(nx * r - size / 2, ny * r - size / 2, size, size);
      });
      break;
    }
    case "billy": {
      const lw = r * 1.3;
      const lh = r * 1.6;
      ctx.strokeRect(-lw * 0.5, -lh * 0.5, lw, lh);
      for (let row = -3; row <= 3; row++) {
        const y = row * (r * 0.2);
        ctx.strokeStyle = row + 3 === Math.floor(t * 1.6) % 7 ? accent : muted;
        ctx.beginPath();
        ctx.moveTo(-lw * 0.36, y);
        ctx.lineTo(lw * 0.08, y);
        ctx.moveTo(lw * 0.2, y);
        ctx.lineTo(lw * 0.36, y);
        ctx.stroke();
      }
      break;
    }
    case "v4ult": {
      ctx.strokeRect(-r * 0.9, -r * 0.9, r * 1.8, r * 1.8);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + t * 0.3;
        ctx.strokeStyle = i === 0 ? accent : fg;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.58, Math.sin(a) * r * 0.58);
        ctx.lineTo(Math.cos(a) * r * 0.76, Math.sin(a) * r * 0.76);
        ctx.stroke();
      }
      break;
    }
    default: {
      for (let gx = -2; gx <= 2; gx++) {
        for (let gy = -2; gy <= 2; gy++) {
          const active = Math.abs(gx) + Math.abs(gy) <= 1;
          ctx.fillStyle = gx === 0 && gy === 0 ? accent : active ? fg : muted;
          ctx.beginPath();
          ctx.arc(gx * r * 0.34, gy * r * 0.34, active ? 4 : 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.strokeStyle = muted;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(Math.cos(t * .8) * r * 1.13, Math.sin(t * .8) * r * 1.13, 2.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}
