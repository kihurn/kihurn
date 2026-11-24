# Build brief: Wong Ki Hurn – portfolio website

You are building my personal portfolio website. Read this whole brief before you write any code. Then propose a short plan and wait for my OK before starting Phase 1.

---

## 0. Ground rules

1. **Reference, not clone.** You may use the `ai-website-cloner-template` skill on https://carterogunsola.com to *study* how it is built: page structure, the status bar, the ⌘K command palette, page transitions, motion timing, and the contact-page interaction pattern. Do **not** copy its text, images, logo, branding or source code into my site. Every page, line of copy and visual must be original and about me. When in doubt, make it different.
2. **Never invent facts.** Use only the facts in section 4 and what you read in my repos' READMEs. If something is missing (a metric, a screenshot, a date), leave a visible `TODO:` and list it for me. No made-up numbers, testimonials or features.
3. **Mobile is not a cut-down version.** Every feature must work on a 375px-wide phone with touch. Design mobile and desktop together.
4. **Performance matters.** My old site struggles on phones. Heavy things (3D, webcam models, Rive) load only on the page that needs them, only when needed, and always with a light fallback.
5. **Stop and ask me** at every point marked **ASK** below. Don't guess.

---

## 1. Repos and deployment

### 1a. Move the old site (the 3D book) to its own repo
- My current site is the "Interactive 3D Book Portfolio" deployed at `kihurn.vercel.app`. **ASK** me where its source code currently lives.
- Push its full source and history to `https://github.com/kihurn/Interactive-Book`.
- On Vercel, connect that repo as a new project named `kihurn-book`, so it lives at `kihurn-book.vercel.app`. Check it works there.
- Only after the new site (below) is ready to launch: rename the old Vercel project so the `kihurn.vercel.app` name is free, then give that name to the new site. People already have the `kihurn.vercel.app` link, so it must point to the new site. **Do not delete anything on Vercel without asking me.**

### 1b. The new site
- Repo: **`kihurn/portfolio`** (new repo). Note: `kihurn/kihurn` is my GitHub *profile README* repo. Leave it as my profile README. Update its `README.md` at the end to link to the new site.
- Deploy on Vercel at `kihurn.vercel.app`, with preview deployments for every branch.

---

## 2. Tech stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Motion (Framer Motion) for page and UI animation; native View Transitions where supported, with a fallback
- `cmdk` for the ⌘K command palette (bottom sheet on mobile)
- `next-themes` for Light / Dark / System
- **Otto mascot:** a `<Otto state="…" />` component built as an animated SVG first, with a clean state API, so a Rive file (`@rive-app/react-canvas`) can replace it later without changing anything else
- **Lanyard (Gigs page only):** `@react-three/fiber` + `@react-three/rapier`, lazy-loaded, with a static-image fallback
- **Face demo (Lab only):** `face-api.js`, lazy-loaded, runs fully in the browser
- Otto chat API: Next.js route handlers on Vercel; rate limiting with Upstash Redis
- Contact form email: Resend
- Content: typed data files (`/content/*.ts`) or MDX for case studies, so I can edit text without touching components

---

## 3. Site structure

Navigation: **Home · Work · Lab · About · Gigs · Contact**, plus Otto floating on every page and the ⌘K palette.

### Global
- **Status bar** (top, every page), short uppercase readouts:
  `KL 20:18` (live Malaysia time) · `OTTO::AWAKE` or `OTTO::NAPPING` (live, from the health check in section 5) · `STATUS::OPEN TO INTERNSHIPS` · `BUILDING::OTTO`
  On mobile, collapse to the 2 most important readouts.
- **Header:** my initials as a simple original mark (`KH`), the nav, and a ⌘K hint. Hamburger or bottom-sheet nav on mobile.
- **Footer:** nav, GitHub, LinkedIn, email, and a small "last updated" date.
- Theme switch, a "skip to content" link, full keyboard support, and `prefers-reduced-motion` respected everywhere.

### Home
1. **Hero:** Otto (large, animated) next to my name and one line: *"Wong Ki Hurn — backend, systems and networking. Computer Science @ Taylor's University."* On first visit, Otto waves and offers a 20-second tour (section 5).
2. **Selected work:** 6 cards, each with a status tag:
   1. Otto: `IN DEVELOPMENT · v1.2`
   2. Elysium: `SHIPPED`
   3. C0RE: `WORKING`
   4. SecureFin: `DEMO`
   5. Billy: `WORKING`
   6. Campus network infrastructure (Ideabase / Sunway): `INTERNAL`
3. **What's new:** a dated feed (tech items only), e.g. ImagineHack 2026, the Palo Alto EDU-210 training, new repos. Each item has a category tag (Project, Lab, Cert, Community).
4. Short call to action: "Talk to Otto" and "Send me a ticket" (Contact).

### Work (`/work`, plus `/work/[slug]` case studies)
Three tracks, filterable:
- **Software:** Otto, Elysium, C0RE, SecureFin, Billy, V4ULT (`WIP`)
- **Networking & Infrastructure:** Ideabase, Sunway internship, Homelab (section 3a)
- **Security:** SecureFin's security layer, Palo Alto firewall labs (no copied course material)

Case study template: Problem → What I built (my part, clearly separated from the team's) → How it works (diagram) → Result → Stack → Links. Internal projects get an `INTERNAL` badge, redacted or blurred screenshots, a topology/architecture diagram, and "walkthrough on request" in place of a link.

**Do not show** Archie or N3XUS yet.

### 3a. Homelab (section on the Work page, or its own case study)
A diagram of how this very site's Otto chat reaches my PC:
visitor → Vercel route handler (rate limit, auth) → secure tunnel → C0RE → local model. Explain the security choices in plain words. This is my networking showcase.

### Lab (`/lab`)
Few, live, working demos only:
1. **Face verification demo** (from SecureFin): webcam, runs fully on-device, nothing uploaded. Ask for camera permission with a clear note. Show the match distance and threshold live. Fallback: a short video if no camera.
2. **Ask Otto:** a full-page version of the Otto chat.
3. **X-ray classifier:** only if I give you an exported model. **ASK** before building. If there's no model, leave it out.
4. **The 3D book:** a card linking to `kihurn-book.vercel.app` ("best on desktop").

### About (`/about`)
IT-focused. Short intro, then a timeline (section 4), skills grouped (Languages, Web, Data, Systems & Networking, Security), and a "Currently" box (building / learning). End with one line: *"When I'm not building, I'm usually crewing events →"* linking to Gigs.

### Gigs (`/gigs`), secondary, clearly separate from the IT work
- **Crew pass lanyard:** a swinging 3D badge on a physics strap. Front: my photo, name, "CREW · ALL ACCESS". Back (on click or tap): crew roles and events worked. Drag with mouse or finger. Lazy-load. Static image if reduced motion or a low-power device.
- **Crew roles:** Internal usher, External usher, Registration, Ticket collection, Photographer, Projectionist, Runner.
- **Events:** cards with photos: WNBF Malaysia 2025, Circus Funtasia, Orientation Party 2026, Taylor's Law Society Law Ball 2025.
- Link: "Open the scrapbook" → the 3D book site.

### Contact (`/contact`): the ticket
My own twist (a nod to Elysium, my ticketing system), not a copy of anyone's letter form:
- The visitor picks a type: **Internship / Collaboration / Just a hello**, then name, email and message.
- A live ticket stub builds beside the form as they type: ticket number, date, type, status `BEING WRITTEN` → `IN QUEUE` after sending, and the line "ONE REPLY, NO SPAM".
- On send: email to me via Resend, and the visitor can download their ticket stub as an image.
- Spam protection: honeypot field, rate limit, server-side validation.
- If Otto helped fill the form, Otto must ask "Send it?" before sending (section 5, safety tiers).

---

## 4. Facts about me (the only facts you may use)

- **Name:** Wong Ki Hurn. Based in Subang Jaya, Selangor, Malaysia.
- **Contact for the site:** email `wongkihurn2005@gmail.com`, LinkedIn `linkedin.com/in/wong-ki-hurn`, GitHub `github.com/kihurn`. **Do not put my phone number on the site.**
- **Education:** Bachelor of Computer Science (Honours), Taylor's University, Apr 2025 – expected Sep 2027, CGPA 3.63, focusing on Artificial Intelligence and Cybersecurity. Diploma in IT, Taylor's College, Apr 2023 – Mar 2025, CGPA 3.92, Dean's List.
- **Work:**
  - System Engineer (part-time), Ideabase Technologies Sdn. Bhd., on-site at Sunway University, Apr 2025 – Present: campus network infrastructure, monitoring, deploying switches, access points and firewalls, troubleshooting, documentation.
  - Network Infrastructure Intern, Sunway University, Jan – Mar 2025: deployed Cisco, Huawei and Dell switches, access points and firewalls; Apache, DHCP and TFTP servers on Linux; diagnostics and pen testing with Wireshark, Nmap, Ettercap.
- **Training:** Palo Alto Networks Firewall Essentials: Configuration and Management (EDU-210), Trainocate, Oct 2026.
- **Community:** Director of Strategic Communications, Agents of Tech (Taylor's), Sep 2025 – Present: hosted and marketed ImagineHack 2026, a hackathon with 250+ participants. Senior Member, Taylor's Orientation Leaders, Jul 2025 – Present.
- **Projects** (also read each repo's README for details):
  - **Otto** (`github.com/kihurn/Otto`): Windows desktop assistant, v1.2, in development. Voice (wake word, always-on, push-to-talk), Spotify control, file search, app launching, timers, screen reading limited to Spotify and Chrome so far, safety tiers (read-only runs directly, reversible runs and reports, sensitive waits for approval), and checks that actions actually happened. Architecture: Laya (fast routing) → plain Python handlers → a "brain" model through C0RE. Phase 1 targets: ≥95% accuracy acting alone, ≥90% of requests handled, <1s typed and <2.5s spoken responses. Planned, **label as roadmap only:** a floating overlay, "control any app", and a second-brain knowledge layer (Obsidian, tasks, personal context).
  - **C0RE** (`github.com/kihurn/C0RE`): a centralized local LLM gateway and model router, in Rust. Working.
  - **Billy** (`github.com/kihurn/Billy`): an AI bill splitter, TypeScript. Working; more features planned.
  - **V4ULT** (`github.com/kihurn/V4ULT`): a self-hosted PocketBase + React personal data engine. Work in progress.
  - **Elysium** (`github.com/YusriArman/op-26`, live: `op-26-beta.vercel.app`): registration, ticketing and gate check-in for Taylor's Orientation Party 2026. Team of 3; **I built the backend solo** and did most of the frontend–backend integration. 1,800 registrations, 300 on the waitlist, ~1,200 attendees. Supabase/PostgreSQL with row-level locking, Row Level Security and SECURITY DEFINER functions; load-tested with Grafana k6. Stack: React, TypeScript, Vite, Tailwind, Supabase, Vercel.
  - **SecureFin** (`github.com/kihurn/securefin`): zero-trust finance portal, team of 5. **I built the continuous face-verification engine solo** on face-api.js: background webcam checks, a tuned distance threshold on 128-dimension descriptors, checks under 1.5s, descriptors stored, never images; locks if the user leaves, doesn't match, or a second face appears. Team built JWT auth, RBAC, rate limiting and a hash-chained ledger. Note: the face models are pretrained; don't say I trained them.
  - **Pneumonia detection:** team project; we designed and fine-tuned a custom CNN on chest X-rays, and I ran all training on my own PC. No accuracy figure yet: `TODO`.
- **Event gigs** (Gigs page only): WNBF Malaysia 2025 (event usher and crew, 2 days, 14-hour shifts), Circus Funtasia (`TODO` role and details), Orientation Party 2026, Law Ball 2025 (event volunteer), plus the 7 crew roles listed in section 3.
- **Languages:** English, Mandarin, Malay, Japanese (elementary).

---

## 5. Otto, the website agent (the centrepiece)

### Character
- **ASK** me: is Otto an otter (there's an `Otter.md` in the Otto repo)? Do I have sketches?
- Build an original animated SVG Otto with these states: `idle`, `wave`, `listening`, `thinking`, `talking`, `pointing`, `sleeping`. Expose them through `<Otto state="…" />` so a Rive file can replace the SVG later.
- Personality: friendly, short sentences, a little playful, never pretends to be human, always honest that the desktop Otto is still in development.

### Where Otto appears
- **Home hero:** big Otto.
- **Every page:** a floating bubble in the bottom-right. On desktop it opens a chat panel; on mobile, a bottom sheet. It must never cover the main content or the nav on a phone.

### Guide behaviour ("show once, then step back")
- **First visit:** Otto offers a short tour. If accepted, Otto moves to and highlights Selected Work → Otto's case study → Lab → Contact, one line each. Skip and Esc always work.
- **Later visits:** only a soft glow on the bubble.
- Store this in `localStorage` (wrapped in try/catch). No cookies, no tracking.

### How answers work (mirror the real Otto's design)
1. **Laya (instant, no model):** an intent router with scripted answers in `/content/otto-faq.ts`: about me, skills, each project, availability, how to contact, "what is Otto", "how does this chat work". It also handles site actions: "show me Elysium" → navigate and highlight.
2. **Brain (model on my PC):** only for questions Laya can't match. Reaches C0RE through the secure tunnel.
3. Every reply shows a small tag: `⚡ Laya · 8ms` or `🧠 Brain · 1.4s`.

### Safety tiers on the website
- **Read-only** (navigate, scroll, highlight, open a case study): run directly.
- **Reversible** (pre-fill the contact form): do it and say so.
- **Sensitive** (send the contact ticket): always ask "Send it?" and wait for the visitor to confirm.

### Offline mode
- `GET /api/otto/health` checks C0RE through the tunnel, with a short timeout, cached ~30s.
- When offline: Otto shows the `sleeping` state, the status bar shows `OTTO::NAPPING`, Laya answers still work, and Brain questions get: *"Ki Hurn's PC is asleep, so my big brain is offline. I can still answer the basics!"*

### Security: non-negotiable
- The website Otto must **never** connect to the desktop Otto or any of its tools: no Spotify, files, screen reading, app launching, MCP or CRM. It is a separate, tool-free chat endpoint.
- The browser never talks to my PC directly. Path: browser → `/api/otto/chat` (Vercel) → tunnel → C0RE.
- Secrets in Vercel env vars only: `OTTO_GATEWAY_URL`, `OTTO_GATEWAY_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`. Never in client code or the repo.
- Rate limit per IP (e.g. 10 messages a minute, 50 a day). Cap input at ~500 characters and output at ~300 tokens. Return friendly errors.
- System prompt: only the public facts in section 4. Nothing private, no keys, no internal notes. Assume visitors will try prompt injection; Otto stays on topic (me, my work, this site) and politely declines everything else.
- No logging of message content beyond what's needed to debug, and no personal data stored.
- **I will set up the tunnel and C0RE endpoint on my PC myself.** Write me clear step-by-step instructions (Cloudflare Tunnel or Tailscale Funnel; recommend one) and a local mock of C0RE so you can develop without my PC.

---

## 6. Design direction

- Original look. Clean, confident, slightly playful developer aesthetic. Take inspiration from the reference site's *qualities*: the status bar, crisp type, smooth motion, little details that reward curiosity. Not from its exact visuals.
- One display face and one text face, a mono for the status bar and tags. A restrained palette with one accent colour that Otto also uses.
- Motion: short and purposeful (150–400ms), page transitions, hover/tap micro-interactions. Everything respects `prefers-reduced-motion`.

---

## 7. Quality bar (check before you say a phase is done)

- Works at 375px, 768px, 1280px and 1920px widths; touch and keyboard both work.
- Lighthouse on mobile: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95.
- LCP under 2.5s on mobile; no layout shift from fonts or images.
- 3D, face-api.js and Rive never load on pages that don't use them.
- Proper metadata and Open Graph images for each page, plus `sitemap.xml` and `robots.txt`.
- No console errors. Type-check and lint clean.

---

## 8. Build order

Stop after each phase, show me the preview link, and wait for my OK.

1. **Phase 1, foundation:** repo, Next.js setup, design tokens, layout, status bar (with a mocked Otto status), nav, ⌘K palette, theme switch, footer, deploy a preview.
2. **Phase 2, content pages:** Home, Work + case studies, About, with all facts from section 4 and `TODO`s for gaps.
3. **Phase 3, Otto:** the SVG character and states, the floating bubble, the tour, Laya answers and site actions, the chat UI, a mock Brain endpoint, offline mode.
4. **Phase 4, real Brain:** `/api/otto/chat` and `/api/otto/health` with rate limiting, plus my tunnel setup instructions. I connect my PC; then we test together.
5. **Phase 5, Lab and Contact:** face demo, Ask Otto page, book link, the ticket contact form with Resend.
6. **Phase 6, Gigs:** lanyard crew pass, roles, events.
7. **Phase 7, launch:** quality checks from section 7, move the old book site (section 1a), point `kihurn.vercel.app` at the new site, update the `kihurn/kihurn` profile README.

---

## 9. What I'll give you (ask for these when you need them)

- Photos: my headshot, event photos for Gigs, screenshots or GIFs of my projects.
- Otto's character design (or confirmation to go with your SVG).
- API keys and tunnel details (set as Vercel env vars, not pasted in chat).
- Circus Funtasia details and the pneumonia model's accuracy.

Start by reading this brief, skimming my repos' READMEs and the reference site, then reply with your plan for Phase 1 and any questions.
