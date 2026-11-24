import { describe, expect, it } from "vitest";
import { projects } from "@/content/projects";
import { getEcosystemGraph } from "@/lib/projects";
import { layoutGraph } from "@/lib/ecosystemLayout";

describe("layoutGraph", () => {
  const { nodes, edges } = getEcosystemGraph(projects);
  const placed = layoutGraph(nodes, edges);
  const col = (slug: string) => placed.find((n) => n.slug === slug)!.col;

  it("places every node exactly once", () => {
    expect(placed.map((n) => n.slug).sort()).toEqual(nodes.map((n) => n.slug).sort());
  });

  it("puts users on the left, hubs in the middle, unlinked nodes on the right", () => {
    expect(col("otto")).toBe(0);
    expect(col("billy")).toBe(0);
    expect(col("site-chat")).toBe(0);
    expect(col("c0re")).toBe(1);
    expect(col("v4ult")).toBe(2);
  });

  it("keeps every position inside the box", () => {
    for (const n of placed) {
      expect(n.x).toBeGreaterThan(0);
      expect(n.x).toBeLessThan(100);
      expect(n.y).toBeGreaterThan(0);
      expect(n.y).toBeLessThan(100);
    }
  });

  it("lists DOM order left to right so phones read top to bottom", () => {
    const cols = placed.map((n) => n.col);
    expect(cols).toEqual([...cols].sort((a, b) => a - b));
  });
});
