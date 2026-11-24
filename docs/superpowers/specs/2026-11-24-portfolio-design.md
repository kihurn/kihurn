# Portfolio v2 — design

**Owner:** Wong Ki Hurn (`kihurn`) · **Date:** 2026-11-24 · **Status:** draft for approval

This replaces the original brief (copied alongside as `2026-11-24-original-brief.md`; its section 4 is the
fact source) wherever the two disagree. Anything marked
**[builder's call]** was decided by the planner, not by Ki Hurn, and may be changed.

> This file sits uncommitted in `kihurn/kihurn` only because the new repo does not exist yet. Committing
> here would redeploy the live site and touch the profile repo. Move it into `kihurn/portfolio/docs/` on day one.

---

## 1. Why, and for whom

- An internship is coming up. Ki Hurn wants a site that can land **any tech role**: networking, full stack,
  AI engineering or cybersecurity. Freelance web dev is a "for fun" extra, not a service line.
- It is also for Ki Hurn: a place to see at a glance what he is building and has finished.
- The current site (the 3D book) struggles on phones.

**Success:** a recruiter on a phone sees within seconds what he does now, what he has shipped (with real
numbers and links) and how to reach him; the site stays current without much effort.

### Goals
- Fast, mobile-first site with the reference site's look and interaction quality.
- Home as a **live status page** (what he's building, working on, recently finished).
- **Lab** as the full showcase of work, led by an interactive **AI ecosystem map**.
- A chatbot that answers questions about Ki Hurn, backed by his C0RE gateway.

### Non-goals (this version)
- No Otto mascot, character, floating agent, guided tour, or Laya/brain routing. The website chat is **not**
  the desktop Otto and never touches its tools. A floating agent may come later.
- No Rive, no 3D lanyard, no X-ray classifier, no Writing or Studio sections.
- Freelancing gets no page of its own.

### Anti-goals (failure even if it "works")
- Any invented fact, metric, testimonial or feature. Gaps show as visible `TODO:` and are listed for Ki Hurn.
- Carter Ogunsola's text, photos, logo, or licensed fonts in the repo or on a public URL.
- Any change to `kihurn/kihurn`'s `README.md` or its koi workflow.
- Chat secrets reaching the browser or the repo.
- A home page that looks broken when Ki Hurn's PC is off.
- Heavy code (face-api.js, any 3D) loading on pages that don't use it.

---

## 2. Design approach: clone first, then make it his

Ki Hurn did not like three original directions and asked to start from an **as-exact-as-possible copy of
https://carterogunsola.com**, then change it into his own design afterwards.

**Approaches considered**
1. *Original design from scratch* — rejected by Ki Hurn after seeing three mockups.
2. *Clone the reference exactly, with placeholders, then restyle* — **chosen.**
3. *Loose inspiration only* — weaker match to what he asked for.

**How:**
1. Use `JCodesMore/ai-website-cloner-template` (Next.js 16, React 19, Tailwind v4, shadcn/ui; Node 24+;
   `/clone-website <url>`; needs browser access to the site) to clone the reference into a **separate local
   folder, `reference-clone/`, outside both repos. Never pushed, never deployed.** It is the pixel reference.
2. In the clone, replace Carter's text, photos, logo and project media with **placeholders** (Ki Hurn's
   instruction). Any fonts the cloner pulls that are not free/open-licensed are swapped for the closest free
   equivalents before any of the code moves into `kihurn/portfolio`. **[builder's call: which fonts]**
3. Build `kihurn/portfolio` from the clone's layout system, components, spacing, type scale and motion,
   filled with Ki Hurn's content and decisions below.
4. **"Make it mine" pass** (led by Ki Hurn) happens **while the site is live** (Ki Hurn's decision). The
   restyle does not gate launch. What does gate any deploy, preview or production: no Carter text, photos,
   logo or licensed fonts anywhere in the build.

### What the reference has (observed 2026-11-24)
- Dark, softly noise-textured background; light/dark toggle; very crisp sans display type; mono for readouts.
- **Status bar** (top, mono, tiny caps): time, FPS, ONLINE count, LCP, PRESENCE, booking quarter.
- **Header:** monogram logo left; pill nav (About · Lab · Writing · Studio · Contact) + `⌘K` button centre;
  bell (notifications) and sun/moon theme switch right.
- **Home:** scroll-driven project carousel (`Nº01/17`), project title with letter-scramble transition, tag
  chips, "View project", tilted floating thumbnails drifting around the edges.
- **Live presence:** other visitors' cursors with animal-style names, and a toast ("N people joined · N online").
- **Lab:** grid of motion experiments with category tags and `NEW` badges; List / Wheel / Grid view switch.
- **Contact:** a typed letter on paper ("Dear …", RE :: checkboxes, FROM ::, VIA ::, message lines) with a
  paper-clipped **receipt stub** beside it (fields incl. STATUS `BEING WRITTEN`, a barcode, "KEEP THIS HALF").
- Full-page loader on first visit.

Ki Hurn's original contact "ticket" idea is very close to this receipt pattern; the "make it mine" pass should
push it toward Elysium's ticketing look.

---

## 3. Site structure

Nav: **Home · Lab · About · Gigs · Contact** + `⌘K`. Reference "Writing" and "Studio" are dropped.

### Global chrome (from the reference's layout)
- **Status bar** readouts: `KL 20:18` (live Malaysia time) · `CHAT::ONLINE` / `CHAT::NAPPING` (from the
  health check) · `OPEN TO INTERNSHIPS` · `BUILDING::<first "building" project from content>`. On phones,
  show only the first two. **[builder's call: exact labels]**
- **Logo:** the text wordmark **`KIHURN.`** (Ki Hurn's choice for now), in the reference logo's position and
  size, replacing Carter's monogram everywhere (header, favicon text, contact letterhead, ticket stub).
- Header, `⌘K` palette (`cmdk`; bottom sheet on mobile), Light/Dark/System theme (`next-themes`), footer
  (nav, GitHub, LinkedIn, email, "last updated"), skip link, full keyboard support, `prefers-reduced-motion`.
- **Dropped (Ki Hurn):** live cursors, "N people joined / N online" toast, any presence or visitor counting.
- **Dropped:** the full-page loader. It only hides loading behind an animation and delays first paint, which
  hurts LCP. **[builder's call, with Ki Hurn's agreement in principle]**
- **Bell:** kept; opens a small panel of the latest `news.ts` items (What's new). **[builder's call]**
- FPS / LCP readouts from the reference status bar are not carried over. **[builder's call]**

### Home: status page
```
STATUS BAR
Wong Ki Hurn
Backend, systems & networking · CS @ Taylor's
[ Ask me anything about Ki Hurn…                ↵ ]   + 3 suggested-question chips
NOW            hand-written lines (building / working / studying / learning)
BUILDING       projects with status "building" (from content)
─ scroll ─
FEATURED       the reference's project carousel: Nº01/N counter, scramble-text titles, tag chips,
               "View project" → Lab entry. Projects with `featured: true`. Swipe on touch, arrow keys on
               desktop; no scroll-jacking of the page. **[builder's call: interaction details]**
RECENTLY DONE  last 2–3 projects with status "done"
RECENT ACTIVITY  public GitHub activity, allow-listed repos only, refreshed ~hourly
→ See all work      → Send me a ticket
```

### Lab: all the work
1. **AI ecosystem map** at the top: Otto, C0RE, Billy as live nodes; other projects as greyed "in progress"
   nodes. Edges drawn **only** where a README confirms the link (Otto → C0RE is confirmed; the website chat →
   C0RE is true by design; Billy → C0RE must be checked in Billy's README before drawing). Clicking a node
   scrolls to its entry. On phones it becomes a vertical stack with connectors. Includes the chat path:
   browser → Vercel (rate limit, key) → Tailscale Funnel (one path) → C0RE → model.
2. **Lens filter:** All · Networking · Full stack · AI · Security. Projects carry every lens that fits.
3. **Entries:** all finished projects in full (status tag, stack, Ki Hurn's part vs the team's, GitHub / live
   links); then an **In progress** group. `internal` projects (Ideabase, Sunway) get an `INTERNAL` badge, a
   written description and a diagram instead of links ("walkthrough on request").
4. **SecureFin "try it"** panel: the on-device face-verification demo (face-api.js loaded only when the panel
   opens; camera-permission note; live distance vs threshold; short video fallback without a camera).
5. Card linking to the 3D book at `kihurn-book.vercel.app` ("best on desktop").

Whether entries also get full case-study pages (`/lab/[slug]`) is **[builder's call]**; default: yes for
Elysium, SecureFin and the campus network, short entries for the rest.

### About
Short IT-focused intro, timeline (education, work, training, community), skills grouped (Languages, Web,
Data, Systems & Networking, Security), languages spoken, and a closing line linking to Gigs.

### Gigs (secondary)
A **flat crew-pass card** (photo, name, "CREW · ALL ACCESS"; flips on click/tap to show roles and events),
the 7 crew roles, event cards with photos, and "Open the scrapbook" → book site. The 3D physics lanyard is
deferred to a later version.

### Contact: the ticket
Types: **Internship / Freelance project / Collaboration / Just a hello**, then name, email, message. A stub
builds live beside the form (ticket number, date, type, status `BEING WRITTEN` → `IN QUEUE`, "ONE REPLY, NO
SPAM"). On send: email via Resend; visitor can download the stub as an image. Honeypot, rate limit,
server-side validation. **[builder's call]** Without a verified domain, Resend can only deliver to the
account owner's address, so the Resend account uses `wongkihurn2005@gmail.com` and the visitor gets **no
confirmation email**; the downloadable stub is their receipt. Visitor emails can be added later by verifying a
domain. Starts from the reference's letter + receipt layout; restyled in the "make it mine" pass.

---

## 4. Content model

Typed files in `/content`, editable without touching components.

- `projects.ts`: one entry per project:
  `{ slug, name, repo?, live?, status: "building" | "paused" | "done" | "internal", lenses[], stack[],
  myPart, teamPart?, uses[] (for the map), showOnHome, featured, finishedOn?, summary }`
- `now.ts`: the hand-written Now lines.
- `faq.ts`: short scripted answers used by the chat's suggested chips and as the offline fallback.
- `timeline.ts`, `skills.ts`, `gigs.ts`, `news.ts` as needed.
- GitHub activity: server-side fetch of public events for repos in `projects.ts`, cached ~1 hour
  (ISR/revalidate). Koi commits never show because `kihurn/kihurn` is not allow-listed. Private repos can't appear.

**Facts:** only section 4 of the original brief and the repos' READMEs. Known gaps → `TODO:` (finish dates,
Circus Funtasia role, pneumonia model accuracy, screenshots, headshot, event photos).

---

## 5. Chat

A plain chatbot about Ki Hurn. Not Otto, no Laya, no tools.

- `POST /api/chat` (Vercel route handler) → C0RE's Ollama-style `POST /api/chat` (as Otto's `core/brain.py`
  calls it: `Authorization: Bearer <key>`, body `{model, messages, stream:false, options}`, reply in
  `message.content`; C0RE listens on `127.0.0.1:7080`), with a **dedicated private
  "website" key** stored only in Vercel env vars, limited to one model.
- System prompt built only from public facts. Stays on topic (Ki Hurn, his work, this site), declines
  everything else, and resists prompt injection.
- Limits: ~500 characters in, ~300 tokens out; per-IP 10/minute and 50/day via Upstash Redis; friendly errors.
- No logging of message content beyond what debugging needs; no personal data stored.
- `GET /api/chat/health`: calls a **cheap C0RE path** (its health or model-list endpoint, also exposed via
  Funnel; never a real completion) with a short timeout, cached ~30s. **[builder's call: which path, after
  checking C0RE's README]** Drives the status bar and the
  chat's online/offline state.
- **Offline:** clear "Ki Hurn's PC is asleep" note; suggested chips still answer from `faq.ts`.
- Local development uses a **mock C0RE** (a tiny local server with the same API).

### Connection: Tailscale Funnel (chosen)
C0RE is reachable today only from Ki Hurn's PC and tailnet devices.
- **Chosen:** Tailscale Funnel exposing **only** the chat-completions path at the PC's `*.ts.net` HTTPS URL;
  the rest of C0RE stays tailnet-only. Optional hardening: a shared-secret header only Vercel sends.
- Rejected: Cloudflare Tunnel + Access (strongest, but needs a domain; `kihurn.me` is free for only one
  year); Vercel joining the tailnet (fiddly, slow cold starts).
- Deliverable: step-by-step Funnel setup guide for Ki Hurn (he sets it up on his PC himself).
- Env vars: `C0RE_URL`, `C0RE_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`.

---

## 6. Stack

Next.js (App Router) + TypeScript + Tailwind v4 (matching the cloner's output) · Motion · native View
Transitions with fallback · `cmdk` · `next-themes` · face-api.js (Lab panel only, lazy) · Upstash Redis ·
Resend · Vercel. Dropped from the brief: Rive, `@react-three/*`.

---

## 7. Repos and deployment

Current state: the 3D book's source lives in **`kihurn/kihurn`** (this folder) alongside the profile
`README.md`, `koi/` and the daily koi workflow, and `kihurn.vercel.app` deploys from it. Ki Hurn knows
changes here affect the live site.

1. Push this repo's full history to `kihurn/Interactive-Book`; connect it on Vercel as `kihurn-book` →
   `kihurn-book.vercel.app`; verify. (The koi workflow there should be disabled so it does not double-run.)
2. New repo `kihurn/portfolio` with preview deploys per branch.
3. Launch (allowed as soon as phase 2 is approved; restyling continues live **[builder's call on timing]**): rename the old Vercel project so `kihurn.vercel.app` is free, assign it to the new site.
   **Nothing is deleted on Vercel without asking.**
4. After launch, `kihurn/kihurn` goes back to being a profile repo. `README.md` and the koi workflow are
   **never** touched. Whether the book's app files are removed from it is asked at that time.
5. Optional: point `kihurn.me` at the new site as a CV-friendly alias while it lasts. Not a launch step.

---

## 8. Build order

Stop after each phase, share the preview link, wait for Ki Hurn's OK.

0. **Reference clone:** set up the cloner, clone carterogunsola.com into `reference-clone/` (local only), swap in placeholders.
1. **Foundation:** `kihurn/portfolio`, tokens, layout, status bar (mocked chat status), header, nav, `⌘K`, theme, footer, preview deploy.
2. **Content pages:** Home (status), Lab (map, lenses, entries), About, Gigs; content files; GitHub activity.
3. **Launch:** quality bar for what exists, book move (section 7), domain swap. Chat shows offline/FAQ mode until phase 4.
4. **Chat:** `/api/chat`, health, rate limits, FAQ fallback, mock C0RE, Funnel guide. Ki Hurn connects his PC; test together.
5. **Contact + SecureFin demo:** ticket form with Resend; face-verification panel.
6. **Make it mine (ongoing, live):** Ki Hurn-led visual changes away from the reference.

## 9. Quality bar
Works at 375 / 768 / 1280 / 1920 px with touch and keyboard. Lighthouse mobile: Performance ≥ 90,
Accessibility ≥ 95, SEO ≥ 95. LCP < 2.5s on mobile; no layout shift. face-api.js never loads outside its panel.
Metadata + OG images per page, `sitemap.xml`, `robots.txt`. No console errors; type-check and lint clean.

## 10. Ki Hurn's hands-on steps (blocking where they appear)
The builder cannot create accounts or keys. Mark these as blocking in the plan:
- Create GitHub repos `kihurn/portfolio` and `kihurn/Interactive-Book` (or grant the builder push rights).
- Vercel: connect projects, enable preview protection, add env vars, do the domain rename (phase 6).
- Create Upstash Redis and Resend accounts; put keys straight into Vercel env vars (never in chat or the repo).
- Mint the C0RE "website" key; set up Tailscale Funnel from the guide.
- Allow the reference site in the browser for the clone; provide headshot, event photos, project screenshots.
- READMEs: Otto is local at `C:\Users\User\Projects\Otto`; C0RE and Billy READMEs come from GitHub (ask if private).

## 11. Decisions from review (2026-11-24)
- Live now, restyle while live.
- Loader dropped; carousel kept as Home's Featured section below the hero/status.
- No live cursors, no online count. Bell kept for What's new.
- Logo is the text "KIHURN." for now.
