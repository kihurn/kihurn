import { describe, expect, it } from "vitest";
import type { Project } from "@/content/types";
import {
  filterByLens,
  getBuilding,
  getEcosystemGraph,
  getFeatured,
  getRecentlyDone,
} from "@/lib/projects";

function p(over: Partial<Project> & { slug: string }): Project {
  return {
    name: over.slug,
    summary: "",
    status: "done",
    lenses: [],
    stack: [],
    myPart: "",
    uses: [],
    ecosystem: false,
    showOnHome: false,
    featured: false,
    caseStudy: false,
    ...over,
  };
}

const fixture: Project[] = [
  p({ slug: "otto", status: "building", showOnHome: true, ecosystem: true, uses: ["c0re"], lenses: ["ai"] }),
  p({ slug: "c0re", status: "building", ecosystem: true, lenses: ["ai", "networking"] }),
  p({ slug: "billy", status: "done", ecosystem: true, finishedOn: "2025-11", uses: ["c0re", "ghost"], lenses: ["ai", "fullstack"] }),
  p({ slug: "v4ult", status: "building", showOnHome: true, lenses: ["fullstack"] }),
  p({ slug: "elysium", status: "done", finishedOn: "2026-08", featured: true, lenses: ["fullstack"] }),
  p({ slug: "securefin", status: "done", finishedOn: "TODO", featured: true, lenses: ["security", "ai"] }),
  p({ slug: "pneumonia", status: "done", lenses: ["ai"] }), // finishedOn undefined
  p({ slug: "campus", status: "internal", lenses: ["networking"] }),
  p({ slug: "paused-thing", status: "paused" }),
];

describe("getBuilding", () => {
  it("returns building projects flagged for home, in content order", () => {
    expect(getBuilding(fixture).map((x) => x.slug)).toEqual(["otto", "v4ult"]);
  });
});

describe("getRecentlyDone", () => {
  it("orders by finishedOn desc with TODO and missing last, at most n", () => {
    expect(getRecentlyDone(fixture, 10).map((x) => x.slug)).toEqual([
      "elysium", // 2026-08
      "billy", // 2025-11
      "securefin", // TODO
      "pneumonia", // undefined
    ]);
    expect(getRecentlyDone(fixture).length).toBe(3);
    expect(getRecentlyDone(fixture, 1).map((x) => x.slug)).toEqual(["elysium"]);
  });

  it("does not throw on a project with finishedOn undefined", () => {
    expect(() => getRecentlyDone([p({ slug: "x", finishedOn: undefined })])).not.toThrow();
  });
});

describe("getFeatured", () => {
  it("returns featured projects in content order", () => {
    expect(getFeatured(fixture).map((x) => x.slug)).toEqual(["elysium", "securefin"]);
  });
});

describe("filterByLens", () => {
  it('"all" returns everything', () => {
    expect(filterByLens(fixture, "all").length).toBe(fixture.length);
  });

  it("returns only projects carrying that lens", () => {
    const ai = filterByLens(fixture, "ai");
    expect(ai.length).toBeGreaterThan(0);
    expect(ai.every((x) => x.lenses.includes("ai"))).toBe(true);
    expect(filterByLens(fixture, "security").map((x) => x.slug)).toEqual(["securefin"]);
  });
});

describe("getEcosystemGraph", () => {
  const g = getEcosystemGraph(fixture);

  it("has live nodes for ecosystem projects", () => {
    for (const slug of ["otto", "c0re", "billy"]) {
      expect(g.nodes.find((n) => n.slug === slug)?.live).toBe(true);
    }
  });

  it("adds in-progress (building/paused) non-ecosystem projects as greyed nodes", () => {
    expect(g.nodes.find((n) => n.slug === "v4ult")?.live).toBe(false);
    expect(g.nodes.find((n) => n.slug === "paused-thing")?.live).toBe(false);
    expect(g.nodes.find((n) => n.slug === "elysium")).toBeUndefined();
    expect(g.nodes.find((n) => n.slug === "campus")).toBeUndefined();
  });

  it("includes the site chat pseudo-node", () => {
    expect(g.nodes.find((n) => n.slug === "site-chat")).toEqual({
      slug: "site-chat",
      name: "This site's chat",
      live: true,
    });
  });

  it("drops an edge whose target is not a node", () => {
    expect(g.edges).not.toContainEqual({ from: "billy", to: "ghost" });
    expect(g.edges).toContainEqual({ from: "billy", to: "c0re" });
    expect(g.edges).toContainEqual({ from: "otto", to: "c0re" });
  });

  it("always includes site-chat -> c0re", () => {
    expect(g.edges).toContainEqual({ from: "site-chat", to: "c0re" });
    const lonely = getEcosystemGraph([p({ slug: "x" })]);
    expect(lonely.edges).toContainEqual({ from: "site-chat", to: "c0re" });
  });
});

import { projects } from "@/content/projects";

describe("real project content", () => {
  it("every uses target exists", () => {
    const slugs = new Set(projects.map((x) => x.slug));
    for (const x of projects) for (const u of x.uses) expect(slugs.has(u), `${x.slug} uses ${u}`).toBe(true);
  });

  it("every repo is owner/name", () => {
    for (const x of projects) if (x.repo) expect(x.repo).toMatch(/^[\w.-]+\/[\w.-]+$/);
  });

  it("never mentions Archie or N3XUS", () => {
    expect(JSON.stringify(projects)).not.toMatch(/archie|n3xus/i);
  });

  it("never claims Ki Hurn trained the face models", () => {
    const sf = projects.find((x) => x.slug === "securefin")!;
    expect(`${sf.summary} ${sf.myPart}`).not.toMatch(/\btrained\b(?! on| it)/i);
    expect(sf.myPart).toMatch(/pretrained/i);
  });

  it("keeps Otto's roadmap labelled as roadmap", () => {
    const otto = projects.find((x) => x.slug === "otto")!;
    expect(otto.summary).toMatch(/Roadmap, not built yet/);
  });

  it("the first building project on the home page is Otto", () => {
    expect(getBuilding(projects)[0].slug).toBe("otto");
  });
});
