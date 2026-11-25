export function HalftonePortrait({
  variant = "stamp",
  className = "",
}: {
  variant?: "stamp" | "badge";
  className?: string;
}) {
  const dots: Array<{ x: number; y: number; r: number; o: number }> = [];
  const cols = variant === "stamp" ? 18 : 20;
  const rows = variant === "stamp" ? 22 : 15;
  const w = 200;
  const h = variant === "stamp" ? 240 : 150;
  const sx = w / (cols + 1);
  const sy = h / (rows + 1);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = (col + 1) * sx;
      const y = (row + 1) * sy;
      const nx = x / w - 0.5;
      const ny = y / h - 0.44;
      const head = Math.hypot(nx * 1.15, (ny + 0.09) * 0.95);
      const shoulders = Math.hypot(nx * 0.62, Math.max(0, 0.36 - ny) * 1.4);
      const inHead = head < 0.25;
      const inShoulders = ny > 0.14 && shoulders < 0.34;
      const ring = Math.abs(Math.hypot(nx, ny) - 0.36) < 0.032;
      const wave = 0.5 + 0.5 * Math.sin(col * 0.55 + row * 0.35);

      let radius = 0.8 + wave * 0.7;
      let opacity = 0.22 + wave * 0.14;
      if (inHead || inShoulders) {
        radius = 1.9 + wave * 1.25;
        opacity = 0.78 + wave * 0.18;
      } else if (ring) {
        radius = 1.5;
        opacity = 0.58;
      }
      dots.push({
        x: Number(x.toFixed(1)),
        y: Number(y.toFixed(1)),
        r: Number(radius.toFixed(2)),
        o: Number(opacity.toFixed(2)),
      });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      role="img"
      aria-label="Monochrome halftone emblem of Wong Ki Hurn"
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <rect width={w} height={h} fill={variant === "stamp" ? "#dcdbd7" : "#181817"} />
      <g
        stroke={variant === "stamp" ? "#1e1e1e" : "#eaeae7"}
        strokeOpacity="0.45"
        strokeWidth="1"
        fill="none"
      >
        <path d={`M10 18V10H18 M${w - 18} 10H${w - 10}V18 M10 ${h - 18}V${h - 10}H18 M${w - 18} ${h - 10}H${w - 10}V${h - 18}`} />
        <circle cx={w * 0.5} cy={h * 0.44} r={variant === "stamp" ? 66 : 46} strokeDasharray="2 3" />
      </g>

      <g fill={variant === "stamp" ? "#1c1c1c" : "#ecece9"}>
        {dots.map((d, idx) => (
          <circle key={idx} cx={d.x} cy={d.y} r={d.r} fillOpacity={d.o} />
        ))}
      </g>

      <g
        stroke={variant === "stamp" ? "#b03a1e" : "#e06a4a"}
        strokeWidth="1.2"
        strokeOpacity="0.82"
        fill="none"
      >
        <line x1={w * 0.5} y1="14" x2={w * 0.5} y2="26" />
        <line x1={w * 0.5} y1={h - 26} x2={w * 0.5} y2={h - 14} />
        <circle cx={w * 0.5} cy={h * 0.44} r="3.2" fill={variant === "stamp" ? "#b03a1e" : "#e06a4a"} />
      </g>

      <text
        x={w - 14}
        y={h - 14}
        textAnchor="end"
        fontFamily="monospace"
        fontSize="8.5"
        letterSpacing="1.2"
        fill={variant === "stamp" ? "#1e1e1e" : "#ecece9"}
        fillOpacity="0.65"
      >
        KH::001
      </text>
    </svg>
  );
}
