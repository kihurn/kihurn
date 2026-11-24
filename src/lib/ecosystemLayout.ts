import type { GraphEdge, GraphNode } from "@/lib/projects";

export interface PlacedNode extends GraphNode {
  col: 0 | 1 | 2;
  /** centre position in percent of the map box */
  x: number;
  y: number;
  /** slugs this node points at */
  uses: string[];
}

const COL_X = [16, 50, 84] as const;

/**
 * Three columns: things that use something (left), the hubs they use (middle),
 * and everything with no link yet (right). DOM order follows the same order, so
 * on a phone the map reads as a vertical stack.
 */
export function layoutGraph(nodes: GraphNode[], edges: GraphEdge[]): PlacedNode[] {
  const targets = new Set(edges.map((e) => e.to));
  const sources = new Set(edges.map((e) => e.from));
  const colOf = (n: GraphNode): 0 | 1 | 2 => {
    if (targets.has(n.slug)) return 1;
    if (sources.has(n.slug)) return 0;
    return 2;
  };
  const cols: GraphNode[][] = [[], [], []];
  for (const n of nodes) cols[colOf(n)].push(n);

  const placed: PlacedNode[] = [];
  cols.forEach((list, c) => {
    list.forEach((n, i) => {
      placed.push({
        ...n,
        col: c as 0 | 1 | 2,
        x: COL_X[c],
        y: ((i + 1) / (list.length + 1)) * 100,
        uses: edges.filter((e) => e.from === n.slug).map((e) => e.to),
      });
    });
  });
  return placed;
}
