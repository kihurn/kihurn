"use client";

import Link from "next/link";
import { useState } from "react";
import type { Project } from "@/content/types";
import type { GraphEdge, GraphNode } from "@/lib/projects";
import { projectTag } from "@/lib/projects";
import { layoutGraph } from "@/lib/ecosystemLayout";

const related = ["v4ult", "lenz", "portfolio"];
const notes: Record<string, string> = {
  c0re: "The Rust gateway sits in front of Ollama. Each client gets its own key, model allow-list and rate limits. The gateway logs usage without recording prompts or answers.",
  "site-chat": "Vercel validates and rate-limits the request, then forwards it through Tailscale Funnel. C0RE checks the project key before passing it to Ollama on my PC.",
  v4ult: "A related project in development. The dashed line marks its place in the ecosystem.",
  lenz: "A related local-model project. The dashed line marks its place in the ecosystem.",
  portfolio: "The portfolio hosts the chat interface. The solid route through the chat node shows how requests reach C0RE.",
};

export function EcosystemMap({ nodes, edges, projects }: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  projects: Project[];
}) {
  const [selected, setSelected] = useState("c0re");
  const [hovered, setHovered] = useState<string | null>(null);
  const placed = layoutGraph(nodes, edges);
  const bySlug = new Map(placed.map((node) => [node.slug, node]));
  const connections = [
    ...edges.map((edge) => ({ ...edge, related: false })),
    ...related.filter((slug) => bySlug.has(slug)).map((to) => ({ from: "c0re", to, related: true })),
  ];
  const current = bySlug.get(selected);
  const project = projects.find((item) => item.slug === selected);
  const highlighted = hovered ?? selected;
  const neighbors = connections.flatMap(({ from, to }) => from === selected ? [to] : to === selected ? [from] : []);

  return (
    <div className="systems__graph">
      <div className="eco" data-eco>
        <svg className="eco__edges" aria-hidden="true" preserveAspectRatio="none">
          {connections.map(({ from, to, related }) => {
            const a = bySlug.get(from);
            const b = bySlug.get(to);
            if (!a || !b) return null;
            return <line key={`${from}-${to}`} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`}
              className="systems__edge" data-connected={from === highlighted || to === highlighted} data-related={related} />;
          })}
        </svg>
        {placed.map((node) => (
          <button key={node.slug} type="button" data-eco-node={node.slug}
            className={`eco__node${node.live ? "" : " eco__node--idle"}`}
            style={{ "--x": `${node.x}%`, "--y": `${node.y}%` } as React.CSSProperties}
            aria-pressed={selected === node.slug}
            onPointerEnter={() => setHovered(node.slug)}
            onPointerLeave={() => setHovered(null)}
            onFocus={() => setHovered(node.slug)}
            onBlur={() => setHovered(null)}
            onClick={() => setSelected(node.slug)}
          >
            <span className="eco__name">{node.name}</span>
            <span className="eco__state text-meta">{projects.find((item) => item.slug === node.slug)?.tags?.[0] ?? (node.live ? "LIVE" : "IN DEVELOPMENT")}</span>
          </button>
        ))}
      </div>
      {current && <aside className="systems__inspector" aria-label="Node inspector" aria-live="polite">
        <span className="text-mono-meta u-muted">{project ? projectTag(project) : "LIVE"}</span>
        <h3>{current.name}</h3>
        <p>{notes[selected] ?? project?.summary}</p>
        <ul className="pentry__stack" aria-label="Technology stack">
          {(project?.stack ?? ["Browser", "Vercel", "Tailscale Funnel", "Ollama"]).map((tech) => <li className="chip text-meta" key={tech}>{tech}</li>)}
        </ul>
        {neighbors.length > 0 && <p className="text-body-sm u-muted">{neighbors.map((slug) => bySlug.get(slug)?.name).filter(Boolean).join(" · ")}</p>}
        {project ? <Link href={`/lab#${project.slug}`}>Open Lab book →</Link> : <a href="#chat-path">Read the request flow ↓</a>}
      </aside>}
      <p className="systems__legend text-mono-meta"><span>Solid · Request or model dependency</span><span>Dashed · Related project</span></p>
    </div>
  );
}
