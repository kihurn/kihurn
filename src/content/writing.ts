export type WritingTag = "web" | "design" | "motion" | "tools";

export interface ArticleSection {
  id: string;
  heading: string;
  paragraphs: string[];
  code?: { label: string; snippet: string };
}

export interface Article {
  slug: string;
  title: string;
  summary: string;
  date: string; // YYYY-MM-DD
  year: "2026" | "2025";
  readTime: string;
  tags: WritingTag[];
  sections: ArticleSection[];
}

export const articles: Article[] = [
  {
    slug: "c0re-rust-gateway-for-ollama",
    title: "Putting a Rust Rate-Limiting Gateway in Front of Local Ollama",
    summary:
      "How C0RE exposes my home GPU to Otto, Billy, and this portfolio over Tailscale with per-project keys, model allow-lists, and zero prompt logging.",
    date: "2026-10-18",
    year: "2026",
    readTime: "5 min",
    tags: ["tools", "web"],
    sections: [
      {
        id: "why-not-expose-ollama",
        heading: "Why not expose Ollama directly?",
        paragraphs: [
          "Ollama binds to localhost by default for a good reason: it has no built-in authentication, no per-caller rate limit, and no model allow-list. Putting it straight on a public tunnel means anyone who finds the endpoint can run any pulled weights on your GPU.",
          "I wanted Otto on Windows, Billy on Vercel, and the portfolio chat route to share one local GPU without duplicating guardrails inside every client.",
        ],
      },
      {
        id: "key-scoped-routing",
        heading: "Per-project keys and model allow-lists",
        paragraphs: [
          "C0RE sits in front of Ollama inside a Rust service reachable only over Tailscale or a locked tunnel. Each consumer sends a bearer token mapped to a tiny policy struct: allowed models, max tokens, and sliding-window request budget.",
          "When the portfolio asks for a chat reply, C0RE verifies the token, clamps num_predict, and forwards the payload to Ollama. Usage telemetry records who, when, and latency—never prompts or responses.",
        ],
        code: {
          label: "Rust policy check (simplified)",
          snippet: `if !policy.models.contains(&req.model) {\n  return Err(GatewayError::ModelForbidden);\n}\nlimiter.check(&policy.project_id).await?;`,
        },
      },
      {
        id: "graceful-sleep",
        heading: "Designing for a sleeping PC",
        paragraphs: [
          "Because the GPU lives in a desktop that sleeps at night, every caller treats offline as a normal state rather than an exception. Health checks cache for 30 seconds and the portfolio falls back cleanly to curated FAQ chips.",
        ],
      },
    ],
  },
  {
    slug: "row-level-locking-under-1800-registrations",
    title: "Row-Level Locking Under 1,800 Event Registrations",
    summary:
      "Keeping ticket capacity exact during Taylor's Orientation Party 2026 check-in rush using PostgreSQL FOR UPDATE, RLS, and Grafana k6.",
    date: "2026-08-29",
    year: "2026",
    readTime: "6 min",
    tags: ["web", "tools"],
    sections: [
      {
        id: "the-race-condition",
        heading: "The double-booking race condition",
        paragraphs: [
          "Naive ticket counters read remaining capacity in application code, check > 0, and issue an insert. Under a launch spike, ten concurrent requests read the same remaining slot and oversell the cap.",
          "For Elysium, 1,800 students hit registration with 300 moving onto a waitlist and 1,200 scanning in at the gate. Capacity had to be atomic inside PostgreSQL.",
        ],
      },
      {
        id: "definer-and-for-update",
        heading: "SECURITY DEFINER + FOR UPDATE",
        paragraphs: [
          "Instead of letting client code mutate counts directly, registration flows through a SECURITY DEFINER RPC function that locks the event tier row with SELECT ... FOR UPDATE, computes the remaining quota, and atomically assigns either confirmed or waitlisted.",
          "Row Level Security stays strict on every table while the stored function acts as the single narrow gatekeeper.",
        ],
        code: {
          label: "PostgreSQL atomic claim",
          snippet: `SELECT capacity, claimed INTO v_cap, v_claimed\nFROM event_tiers WHERE id = p_tier FOR UPDATE;\nIF v_claimed < v_cap THEN\n  UPDATE event_tiers SET claimed = claimed + 1 WHERE id = p_tier;\nEND IF;`,
        },
      },
      {
        id: "load-testing-k6",
        heading: "Proving it with Grafana k6",
        paragraphs: [
          "Before launch night, we hammered the endpoint with k6 virtual users racing for the last 50 seats. Zero oversold tickets, deterministic waitlist ordering, and predictable tail latency.",
        ],
      },
    ],
  },
  {
    slug: "depth-parallax-shaders-without-stalling",
    title: "Depth-Parallax Cards in Three.js Without Stalling Software WebGL",
    summary:
      "Building damped two-wheel carousel physics, custom GLSL relief displacement, and frame-paced rendering that stays responsive even on CPU rasterizers.",
    date: "2026-11-12",
    year: "2026",
    readTime: "4 min",
    tags: ["motion", "design"],
    sections: [
      {
        id: "two-wheels-physics",
        heading: "Two linked wheels, one damped position",
        paragraphs: [
          "The showcase pairs large rectangular project plates on the left arc with compact badge plates rotating counter-wise on the right arc. Both derive from a single unwrapped floating-point cursor position damped toward a snap target.",
          "Decoupling the simulation ref from React state ensures dragging or flicking runs at full refresh rate without triggering component reconciliations.",
        ],
      },
      {
        id: "depth-displacement-shader",
        heading: "Procedural depth maps and pointer velocity",
        paragraphs: [
          "Each plane uses a custom ShaderMaterial that samples a luminance-derived relief map alongside pointer velocity uniforms. Subtle UV parallax and vertex curvature give flat cards physical press stock weight as they pass through center.",
        ],
        code: {
          label: "GLSL UV parallax offset",
          snippet: `float depth = texture2D(uDepth, vUv).r;\nvec2 parallax = uPointer * (depth - 0.5) * 0.032;\nvec4 col = texture2D(uMap, clamp(vUv + parallax, 0.0, 1.0));`,
        },
      },
      {
        id: "software-gl-discipline",
        heading: "Respecting software WebGL",
        paragraphs: [
          "Headless environments and low-power VMs fall back to SwiftShader or llvmpipe. Detecting software renderers from the GL_RENDERER string lets us drop pixel ratio to 1 and pace draws cleanly without altering layout or geometry.",
        ],
      },
    ],
  },
  {
    slug: "print-shop-hud-monochrome-grammar",
    title: "Designing a Print-Shop Telemetry HUD in Two Tones",
    summary:
      "Why #D6D6D5 paper stock, #1E1E1E charcoal ink, 1px hairline grids, and double-colon telemetry labels replaced decorative gradients and shadows.",
    date: "2025-12-04",
    year: "2025",
    readTime: "4 min",
    tags: ["design", "motion"],
    sections: [
      {
        id: "two-tone-discipline",
        heading: "Two tones, crisp hairlines",
        paragraphs: [
          "Removing saturated accents and heavy box shadows forces hierarchy to come from scale, tabular numerals, and hairline 1px dividers. Light mode reads like warm uncoated paper stock (#D6D6D5); dark mode flips to charcoal ink (#1E1E1E).",
          "Border opacity at 16% and muted text at 58% remain consistent across both polarity flips so neither theme feels like an afterthought.",
        ],
      },
      {
        id: "double-colon-microcopy",
        heading: "Double-colon archival grammar",
        paragraphs: [
          "Prefixes like LOC::, FPS::, LCP::, BOOKING::OPEN, and JOB::N°00 borrow from press job tickets and serial telemetry logs. They communicate state densely in 10px monospace without cluttering the editorial display typography below.",
        ],
      },
    ],
  },
];
