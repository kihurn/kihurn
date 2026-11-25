import type { Metadata } from "next";
import Link from "next/link";
import "../../styles/pages.css";
import { LanyardStage } from "@/components/studio/LanyardStage";

export const metadata: Metadata = {
  title: "Studio",
  description: "Interactive Verlet physics studio pass, capabilities sheet, and desk specifications for Wong Ki Hurn.",
};

export default function StudioPage() {
  return (
    <main id="main" className="page">
      <header className="page__head">
        <p className="text-mono-meta u-muted">STUDIO::WORKBENCH · EST::2005</p>
        <h1 className="text-display">Studio</h1>
        <p className="page__intro text-body">
          A physics-driven identity pass for the studio desk. Grab and fling the badge on its Verlet lanyard, or click to
          flip between front credentials and technical manifest.
        </p>
      </header>

      <LanyardStage />

      <section className="page__sec" aria-labelledby="studio-specs">
        <h2 id="studio-specs" className="page__title text-label">
          Practice &amp; availability
        </h2>
        <div className="studio-grid">
          <article className="studio-cell">
            <span className="text-mono-sm u-muted">01 // SYSTEMS</span>
            <h3 className="text-h6">Backend &amp; Self-Hosted Infra</h3>
            <p className="text-body-sm u-muted">
              PostgreSQL row-level security, Rust gateways (C0RE), Tailscale private tunnels, and campus networking.
            </p>
          </article>
          <article className="studio-cell">
            <span className="text-mono-sm u-muted">02 // INTERACTION</span>
            <h3 className="text-h6">Print-Shop Web &amp; Shaders</h3>
            <p className="text-body-sm u-muted">
              Three.js GLSL pipelines, Verlet mechanics, accessible keyboard palettes, and crisp architectural grids.
            </p>
          </article>
          <article className="studio-cell">
            <span className="text-mono-sm u-muted">03 // INTAKE</span>
            <h3 className="text-h6">Open for Internships &amp; Select Builds</h3>
            <p className="text-body-sm u-muted">
              Based in Subang Jaya, Malaysia.{" "}
              <Link href="/contact" className="u-link">
                Open a ticket at Counter 01 →
              </Link>
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
