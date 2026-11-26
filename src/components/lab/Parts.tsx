import Link from "next/link";
import type { Project } from "@/content/types";
import { LabMiniStage } from "./LabMiniStage";
import { OptionalPhoto } from "@/components/media/OptionalPhoto";

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

export function ChatPath() {
  const steps = [
    "Browser: you type a question",
    "Vercel: validates the request, rate-limits traffic and holds the key",
    "Tailscale Funnel: forwards the public request to the gateway",
    "C0RE Rust gateway: checks the project key and applies model and usage limits",
    "Local Ollama GPU: runs the model on my PC and returns the answer",
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

export function ShotSlot({
  internal,
  slug = "c0re",
  name = "Architecture schematic",
  photo,
}: {
  internal: boolean;
  slug?: string;
  name?: string;
  photo?: string;
}) {
  return (
    <OptionalPhoto src={internal ? undefined : photo} alt={`${name} screenshot`} width={640} height={400} className="project-photo shot">
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
    </OptionalPhoto>
  );
}

export function ProjectLinks({ p }: { p: Project }) {
  const internal = p.status === "internal";
  if (!p.repo && !p.live && !internal && !p.caseStudy) return null;

  return (
    <ul className="plinks">
      {p.repo ? (
        <li>
          <a href={`https://github.com/${p.repo}`} target="_blank" rel="noopener noreferrer">
            GitHub: {p.repo}
          </a>
        </li>
      ) : null}
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
