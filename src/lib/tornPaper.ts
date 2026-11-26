export type CurtainPhase = "cover" | "reveal";
type CurtainLayer = "paper" | "base";

function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const coordinate = (t: number, a: number, b: number) =>
    3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;

  return (progress: number) => {
    let low = 0;
    let high = 1;
    for (let i = 0; i < 20; i++) {
      const t = (low + high) / 2;
      if (coordinate(t, x1, x2) < progress) low = t;
      else high = t;
    }
    return coordinate((low + high) / 2, y1, y2);
  };
}

const faster = cubicBezier(.25, .88, .32, 1);
const slower = cubicBezier(.76, .04, .24, 1);

function waveProfile(phase: number) {
  return Array.from({ length: 101 }, (_, x) =>
    .55 * Math.sin(x * .065 + phase) +
    .30 * Math.cos(x * .13 - phase * .7) +
    .15 * Math.sin(x * .31 + phase * 1.4) +
    .007 * Math.sin(x * 1.6 + phase) + .004 * Math.cos(x * 2.35 - phase),
  );
}

const profiles = {
  cover: { paper: waveProfile(.65), base: waveProfile(.15) },
  reveal: { paper: waveProfile(1.1), base: waveProfile(.6) },
};

export function waveAmplitude(progress: number) {
  return progress <= 0 || progress >= 1 ? 0 : 13 * Math.sin(Math.PI * progress) ** 1.35;
}

export function curtainPath(phase: CurtainPhase, layer: CurtainLayer, progress: number) {
  const parkedEdge = phase === "cover" ? 120 : -20;
  const close = `V${parkedEdge}H0Z`;
  if (progress <= 0) return `M0 100H100${close}`;
  if (progress >= 1) return `M0 0H100${close}`;

  const leads = layer === (phase === "cover" ? "paper" : "base");
  const baseline = 100 * (1 - (leads ? faster : slower)(progress));
  const amplitude = waveAmplitude(progress);
  const profile = profiles[phase][layer];
  let path = `M0 ${(baseline + amplitude * profile[0]).toFixed(3)}`;
  for (let x = 1; x < profile.length; x++) {
    path += `L${x} ${(baseline + amplitude * profile[x]).toFixed(3)}`;
  }
  return path + close;
}
