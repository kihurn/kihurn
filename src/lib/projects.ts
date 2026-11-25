import type { Lens, Project } from "@/content/types";

export interface GraphNode {
  slug: string;
  name: string;
  live: boolean;
}
export interface GraphEdge {
  from: string;
  to: string;
}

export function getBuilding(ps: Project[]): Project[] {
  return ps.filter((p) => p.status === "building" && p.showOnHome);
}

function doneKey(p: Project): string {
  return p.finishedOn && /^\d{4}-\d{2}/.test(p.finishedOn) ? p.finishedOn : "";
}

export function getRecentlyDone(ps: Project[], n = 3): Project[] {
  return ps
    .filter((p) => p.status === "done")
    .map((p, i) => ({ p, i }))
    .sort((a, b) => {
      const ka = doneKey(a.p);
      const kb = doneKey(b.p);
      if (ka === kb) return a.i - b.i;
      return ka < kb ? 1 : -1;
    })
    .map((x) => x.p)
    .slice(0, n);
}

export function getFeatured(ps: Project[]): Project[] {
  return ps.filter((p) => p.featured);
}

export function filterByLens(ps: Project[], lens: Lens | "all"): Project[] {
  return lens === "all" ? ps : ps.filter((p) => p.lenses.includes(lens));
}

export const SITE_CHAT: GraphNode = { slug: "site-chat", name: "This site's chat", live: true };

export function getEcosystemGraph(ps: Project[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  for (const p of ps) {
    if (p.ecosystem) nodes.push({ slug: p.slug, name: p.name, live: true });
    else if (p.status === "building" || p.status === "paused") nodes.push({ slug: p.slug, name: p.name, live: false });
  }
  nodes.push(SITE_CHAT);

  const slugs = new Set(nodes.map((n) => n.slug));
  const edges: GraphEdge[] = [];
  for (const p of ps) {
    if (!slugs.has(p.slug)) continue;
    for (const to of p.uses) if (slugs.has(to)) edges.push({ from: p.slug, to });
  }
  edges.push({ from: SITE_CHAT.slug, to: "c0re" });
  return { nodes, edges };
}

export function getActivityRepos(ps: Project[]): string[] {
  return ps
    .filter((p) => (p.showOnHome || p.ecosystem) && p.repo && p.repo !== "kihurn/kihurn")
    .map((p) => p.repo as string);
}

export const LENS_LABEL: Record<Lens, string> = {
  networking: "NETWORKING",
  fullstack: "FULL STACK",
  ai: "AI",
  security: "SECURITY",
};

export function wheelOrder(ps: Project[]): Project[] {
  return [...ps.filter((p) => p.featured), ...ps.filter((p) => !p.featured)];
}

export const projectHref = (p: Project) => (p.caseStudy ? `/lab/${p.slug}` : `/lab#${p.slug}`);
export const projectTag = (p: Project) => (p.tags?.[0] ?? p.status).toUpperCase();
