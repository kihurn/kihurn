"use client";

import { useState } from "react";
import type { Lens, Project } from "@/content/types";
import { filterByLens } from "@/lib/projects";
import { ProjectLinks, ShotSlot } from "./Parts";

const LENSES: { id: Lens | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "networking", label: "Networking" },
  { id: "fullstack", label: "Full stack" },
  { id: "ai", label: "AI" },
  { id: "security", label: "Security" },
];

function Entry({ p, photo }: { p: Project; photo?: string }) {
  const internal = p.status === "internal";
  return (
    <article id={p.slug} className="pentry">
      <header className="pentry__head">
        <h3 className="pentry__name text-display">{p.name}</h3>
        <ul className="pentry__tags">
          {(p.tags ?? []).map((t) => (
            <li key={t} className="chip text-meta">
              {t}
            </li>
          ))}
          {p.lenses.map((l) => (
            <li key={l} className="chip text-meta chip--pill">
              {LENSES.find((x) => x.id === l)?.label ?? l}
            </li>
          ))}
        </ul>
      </header>
      <ShotSlot internal={internal} slug={p.slug} name={p.name} photo={photo} />
      <p className="pentry__summary text-body">{p.summary}</p>
      {p.myPart || p.teamPart ? (
        <dl className="pentry__parts">
          {p.myPart ? (
            <div>
              <dt className="text-label">My part</dt>
              <dd className="text-body">{p.myPart}</dd>
            </div>
          ) : null}
          {p.teamPart ? (
            <div>
              <dt className="text-label">The team</dt>
              <dd className="text-body">{p.teamPart}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {p.stack.length > 0 ? (
        <ul className="pentry__stack" aria-label="Stack">
          {p.stack.map((s) => (
            <li key={s} className="chip text-meta">
              {s}
            </li>
          ))}
        </ul>
      ) : null}
      <ProjectLinks p={p} />
    </article>
  );
}

export function LabBrowser({ projects, photos }: { projects: Project[]; photos: Record<string, string | undefined> }) {
  const [lens, setLens] = useState<Lens | "all">("all");
  const shown = filterByLens(projects, lens);
  const sections = [
    { id: "finished-h", title: "Finished", entries: shown.filter((p) => p.status === "done" || p.status === "internal") },
    { id: "progress-h", title: "In progress", entries: shown.filter((p) => p.status === "building" || p.status === "paused") },
    { id: "concepts-h", title: "Concepts", entries: shown.filter((p) => p.status === "concept") },
  ];

  return (
    <div className="labb">
      <div className="lens" role="group" aria-label="Filter by lens">
        {LENSES.map((l) => (
          <button
            key={l.id}
            type="button"
            className="lens__btn chip text-meta"
            aria-pressed={lens === l.id}
            onClick={() => setLens(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>

      {sections.filter((section) => section.entries.length > 0).map(({ id, title, entries }) => (
        <section key={id} className="lab-sec" aria-labelledby={id}>
          <h2 id={id} className="lab-sec__title text-label">
            {title}
          </h2>
          <div className="entries">
            {entries.map((p) => (
              <Entry key={p.slug} p={p} photo={photos[p.slug]} />
            ))}
          </div>
        </section>
      ))}

      {shown.length === 0 ? <p className="text-body">Nothing under this lens yet.</p> : null}
    </div>
  );
}
