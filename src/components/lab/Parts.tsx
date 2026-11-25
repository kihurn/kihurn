import Link from "next/link";
import type { Project } from "@/content/types";
import { LabMiniStage } from "./LabMiniStage";

/** Ordered steps drawn as boxes joined by arrows. Reads top to bottom on a phone. */
export function Flow({ steps, label }: { steps: string[]; label: string }) {
  return (
    <ol className="flow" aria-label={label}>
      {steps.map((s, i) => (
        <li key={s} className="flow__step">
          <span className="flow__n text-mono-meta">{String(i + 1).padStart(2, "0")}</span>
          <span className="flow__text text-body">{s}</span>
        </li>
      ))}
    </ol>
  );
}

/** How a chat message reaches Ki Hurn's PC, step by step. */
export function ChatPath() {
  const steps = [
    "Browser: you type a question",
    "Vercel: checks length, rate-limits you, holds the key",
    "Tailscale Funnel: one public path, nothing else exposed",
    "C0RE: Ki Hurn's gateway, with its own key and limits",
    "Model: runs on his PC and answers",
  ];
  return (
    <section id="chat-path" className="lab-sec" aria-labelledby="chat-path-h">
      <h2 id="chat-path-h" className="lab-sec__title text-label">
        How this site&apos;s chat reaches my PC
      </h2>
      <Flow steps={steps} label="Chat path" />
      <p className="lab-sec__note text-body">
        The browser never talks to my PC directly. If the PC is asleep the status bar shows NAPPING and the suggested
        questions still answer from a script.
      </p>
    </section>
  );
}

export function BookCard() {
  return (
    <a className="book" href="https://kihurn-book.vercel.app">
      <span className="book__k text-mono-meta">Scrapbook</span>
      <span className="book__t text-display">The 3D book</span>
      <span className="book__d text-body">My old portfolio, a book you can flip through. Best on desktop.</span>
      <span className="book__go text-nav" aria-hidden="true">
        Open ↗
      </span>
    </a>
  );
}

/** Procedural monochrome architecture diagram replacing TODO screenshot placeholders. Internal work adds a classified overlay bar. */
export function ShotSlot({
  internal,
  slug = "c0re",
  name = "Architecture schematic",
}: {
  internal: boolean;
  slug?: string;
  name?: string;
}) {
  return (
    <div
      className={`shot${internal ? " shot--blur" : ""}`}
      role="img"
      aria-label={internal ? `${name} classified topology diagram` : `${name} architectural schematic`}
    >
      <LabMiniStage slug={slug} interactive={false} className="shot__canvas" />
      <span className="shot__t text-mono-meta">
        {internal ? "TOPOLOGY::REDACTED // INTERNAL" : `SCHEMATIC::${slug.toUpperCase()}`}
      </span>
    </div>
  );
}

export function ProjectLinks({ p }: { p: Project }) {
  const internal = p.status === "internal";
  return (
    <ul className="plinks">
      {p.repo ? (
        <li>
          <a href={`https://github.com/${p.repo}`} target="_blank" rel="noopener noreferrer">
            GitHub: {p.repo}
          </a>
        </li>
      ) : internal ? null : (
        <li className="text-meta">GitHub: TODO: no public repo link yet</li>
      )}
      {p.live ? (
        <li>
          <a href={p.live} target="_blank" rel="noopener noreferrer">
            {p.live.replace(/^https?:\/\//, "")}
          </a>
        </li>
      ) : null}
      {internal ? <li className="text-body">Walkthrough on request.</li> : null}
      {p.caseStudy ? (
        <li>
          <Link href={`/lab/${p.slug}`}>Read the case study →</Link>
        </li>
      ) : null}
    </ul>
  );
}
