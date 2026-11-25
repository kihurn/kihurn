export interface ExperimentSpec {
  slug: "vocal-orb" | "polka-field" | "rotary-detent" | "paper-poster";
  index: string;
  title: string;
  subtitle: string;
  engine: "THREE.JS + GLSL" | "CANVAS 2D" | "SPRING PHYSICS";
  year: string;
  summary: string;
  snippetLabel: string;
  snippet: string;
}

export const experiments: ExperimentSpec[] = [
  {
    slug: "vocal-orb",
    index: "01",
    title: "Audio-Reactive Simplex Orb",
    subtitle: "Custom GLSL vertex noise + Fresnel contour shading driven by harmonic synth or live mic.",
    engine: "THREE.JS + GLSL",
    year: "2026",
    summary:
      "A monochrome icosahedron displaced along its surface normals using multi-octave 3D simplex noise. Defaults to a procedural harmonic envelope so it animates without microphone permissions, with an optional live microphone toggle.",
    snippetLabel: "GLSL // Fresnel + Normal Displacement",
    snippet: `float n = snoise(position * uScale + vec3(0.0, uTime * 0.6, 0.0));
vec3 displaced = position + normal * (n * uAmp);
float fresnel = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 2.4);
gl_FragColor = vec4(mix(uInkMuted, uInk, fresnel), 1.0);`,
  },
  {
    slug: "polka-field",
    index: "02",
    title: "Kinetic Halftone Matrix",
    subtitle: "High-DPI halftone dot grid that bends, scales, and recovers along the cursor velocity wake.",
    engine: "CANVAS 2D",
    year: "2026",
    summary:
      "A print-shop halftone dot screen simulated with per-cell radial repulsion and spring recovery. Pointer speed widens the displacement radius while damping controls how quickly ink settles back into registration.",
    snippetLabel: "TS // Halftone Cell Spring",
    snippet: `const dist = Math.hypot(cell.x - pointer.x, cell.y - pointer.y);
const push = Math.max(0, 1 - dist / radius) * force;
cell.vx += ((cell.x - pointer.x) / (dist || 1)) * push;
cell.vx = (cell.vx + (cell.homeX - cell.x) * stiffness) * damping;
cell.x += cell.vx;`,
  },
  {
    slug: "rotary-detent",
    index: "03",
    title: "Tactile Rotary Detent",
    subtitle: "12-notch mechanical dial with velocity inertia, magnetic snap detents, and optional click synthesis.",
    engine: "SPRING PHYSICS",
    year: "2025",
    summary:
      "Pointer drag and wheel deltas feed angular velocity into a 12-detent magnetic spring model. Crossing a 30° notch fires a crisp Web Audio impulse when sound is armed.",
    snippetLabel: "TS // Magnetic Detent Snap",
    snippet: `const step = (Math.PI * 2) / 12;
const nearest = Math.round(angle / step) * step;
const torque = (nearest - angle) * stiffness;
angularVel = (angularVel + torque) * damping;
angle += angularVel;`,
  },
  {
    slug: "paper-poster",
    index: "04",
    title: "Deformable Paper Poster",
    subtitle: "Subdivided Three.js sheet reacting to pointer tilt and shear velocity with halftone grain.",
    engine: "THREE.JS + GLSL",
    year: "2026",
    summary:
      "A 32×44 subdivided plane rendered with a custom ShaderMaterial that combines cursor-centered Gaussian bow deformation, directional shear waves, and crisp typographic poster ink.",
    snippetLabel: "GLSL // Pointer Bow Deformation",
    snippet: `float d = distance(uv, uPointer);
float bow = exp(-d * d * 5.2) * uAmp;
pos.z += bow + sin(uv.y * 8.0 - uTime * 2.0) * uVel * 0.14;
gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);`,
  },
];

export function isExperimentSlug(slug: string): slug is ExperimentSpec["slug"] {
  return experiments.some((e) => e.slug === slug);
}
