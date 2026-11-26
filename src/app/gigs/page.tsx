import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import "../../styles/lab.css";
import "../../styles/pages.css";
import { EventShowcase } from "@/components/gigs/EventShowcase";
import { LanyardStage } from "@/components/studio/LanyardStage";
import { eventPortfolioUrl, events } from "@/content/gigs";
import { media } from "@/data/media";
import { availableMedia } from "@/lib/server/media";

export const metadata: Metadata = {
  title: "Gigs",
  description: "Event crew work and studio practice by Wong Ki Hurn.",
};

const slides = events.map(({ slug, name }) => ({ slug, name, photo: availableMedia(media.gigs[slug]) }));

export default function GigsPage() {
  return (
    <main id="main" className="page gigs">
      <section className="gigs__hero" aria-labelledby="gigs-h">
        <LanyardStage />
        <header className="gigs__intro page__head">
          <div>
            <h1 id="gigs-h" className="text-display">Gigs</h1>
            <p className="text-body page__intro">Event crew work and studio practice.</p>
          </div>
          <div className="gigs__links">
            <a className="gigs__jump" href={eventPortfolioUrl}>Event portfolio</a>
            <a className="gigs__jump" href="#events">Browse events <ArrowDown size={18} aria-hidden="true" /></a>
          </div>
        </header>
      </section>

      <EventShowcase slides={slides} />

      <section className="page__sec" aria-labelledby="studio-specs">
        <h2 id="studio-specs" className="text-h2">Practice &amp; availability</h2>
        <div className="studio-grid">
          <article className="studio-cell">
            <h3 className="text-h6">Backend &amp; Self-Hosted Infra</h3>
            <p className="text-body-sm u-muted">
              PostgreSQL row-level security, Rust gateways (C0RE), Tailscale private tunnels, and campus networking.
            </p>
          </article>
          <article className="studio-cell">
            <h3 className="text-h6">Print-Shop Web &amp; Shaders</h3>
            <p className="text-body-sm u-muted">
              Three.js GLSL pipelines, Verlet mechanics, accessible keyboard palettes, and crisp architectural grids.
            </p>
          </article>
          <article className="studio-cell">
            <h3 className="text-h6">Open for Internships &amp; Select Builds</h3>
            <p className="text-body-sm u-muted">
              Based in Subang Jaya, Malaysia.{" "}
              <Link href="/contact" className="u-link">Open a ticket at Counter 01 →</Link>
            </p>
          </article>
        </div>
      </section>

      <section className="page__sec" aria-label="Scrapbook">
        <a className="book" href="https://kihurn-book.vercel.app">
          <span className="book__k text-mono-meta">Scrapbook</span>
          <span className="book__t text-display">Open the scrapbook</span>
          <span className="book__d text-body">My old portfolio, a 3D book you can flip through. Best on desktop.</span>
        </a>
      </section>
    </main>
  );
}
