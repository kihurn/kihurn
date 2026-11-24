"use client";

import type { GraphEdge, GraphNode } from "@/lib/projects";
import { layoutGraph } from "@/lib/ecosystemLayout";

function scrollToId(id: string) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

/**
 * The AI ecosystem map. Live nodes link to their entry; in-progress nodes are greyed and
 * inert. Edges are drawn only where a README confirms the link. On phones the same nodes
 * stack vertically and each one says what it uses.
 */
export function EcosystemMap({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const placed = layoutGraph(nodes, edges);
  const byslug = new Map(placed.map((n) => [n.slug, n]));
  const name = (slug: string) => byslug.get(slug)?.name ?? slug;

  return (
    <div className="eco" data-eco>
      <svg className="eco__edges" aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <marker id="eco-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill="currentColor" />
          </marker>
        </defs>
        {edges.map((e) => {
          const a = byslug.get(e.from);
          const b = byslug.get(e.to);
          if (!a || !b) return null;
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={`${a.x + 11}%`}
              y1={`${a.y}%`}
              x2={`${b.x - 11}%`}
              y2={`${b.y}%`}
              stroke="currentColor"
              strokeWidth="1.5"
              markerEnd="url(#eco-arrow)"
            />
          );
        })}
      </svg>

      {placed.map((n) => {
        const idle = !n.live;
        return (
          <button
            key={n.slug}
            type="button"
            data-eco-node={n.slug}
            className={`eco__node${idle ? " eco__node--idle" : ""}`}
            style={{ "--x": `${n.x}%`, "--y": `${n.y}%` } as React.CSSProperties}
            aria-disabled={idle || undefined}
            onClick={() => {
              if (idle) return;
              scrollToId(n.slug === "site-chat" ? "chat-path" : n.slug);
            }}
          >
            <span className="eco__name">{n.name}</span>
            <span className="eco__state text-meta">{idle ? "in progress" : "live"}</span>
            {n.uses.length > 0 ? (
              <span className="eco__uses text-meta">uses {n.uses.map(name).join(", ")}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
