import { expect, test, type Page } from "@playwright/test";
import { projects } from "../../src/content/projects";
import { getEcosystemGraph } from "../../src/lib/projects";

const hydrated = (page: Page) =>
  page.waitForFunction(() => document.documentElement.dataset.hydrated === "true");

const graph = getEcosystemGraph(projects);

test("the map has one button per node; in-progress nodes are greyed and disabled", async ({ page }) => {
  await page.goto("/lab");
  const nodes = page.locator("[data-eco-node]");
  await expect(nodes).toHaveCount(graph.nodes.length);
  for (const n of graph.nodes) {
    const node = page.locator(`[data-eco-node="${n.slug}"]`);
    await expect(node).toBeVisible();
    if (n.live) await expect(node).not.toHaveAttribute("aria-disabled", "true");
    else {
      await expect(node).toHaveAttribute("aria-disabled", "true");
      await expect(node).toHaveClass(/eco__node--idle/);
    }
  }
});

test("clicking the Otto node scrolls its entry into view", async ({ page }) => {
  await page.goto("/lab");
  await hydrated(page);
  await page.locator('[data-eco-node="otto"]').click();
  await expect(page.locator("#otto")).toBeInViewport();
});

test("on phones the map is a vertical stack", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/lab");
  const nodes = await page.locator("[data-eco-node]").all();
  expect(nodes).toHaveLength(graph.nodes.length);
  const ys: number[] = [];
  for (const n of nodes) ys.push((await n.boundingBox())!.y);
  for (let i = 1; i < ys.length; i++) expect(ys[i], `node ${i}`).toBeGreaterThan(ys[i - 1]);
});

test("the chat path is drawn out", async ({ page }) => {
  await page.goto("/lab");
  const path = page.locator("#chat-path");
  for (const step of ["Browser", "Vercel", "Tailscale Funnel", "C0RE", "Model"]) {
    await expect(path).toContainText(step);
  }
});

test("lens filter: Security shows SecureFin and hides Elysium; All restores everything", async ({ page }) => {
  await page.goto("/lab");
  await hydrated(page);
  await page.getByRole("button", { name: "Security" }).click();
  await expect(page.locator("#securefin")).toBeVisible();
  await expect(page.locator("#elysium")).toHaveCount(0);

  await page.getByRole("button", { name: "All", exact: true }).click();
  for (const p of projects.filter((x) => x.status === "done" || x.status === "internal")) {
    await expect(page.locator(`#${p.slug}`), p.slug).toBeAttached();
  }
  await expect(page.getByRole("heading", { name: "In progress" })).toBeVisible();
  for (const p of projects.filter((x) => x.status === "building" || x.status === "paused")) {
    await expect(page.locator(`#${p.slug}`), p.slug).toBeAttached();
  }
});

test("the campus network entry is INTERNAL, has no GitHub link, and offers a walkthrough", async ({ page }) => {
  await page.goto("/lab");
  const entry = page.locator("#campus-network");
  await expect(entry).toContainText("INTERNAL");
  await expect(entry.locator('a[href*="github.com"]')).toHaveCount(0);
  await expect(entry).toContainText(/walkthrough on request/i);
});

test("a case study has the six fixed sections", async ({ page }) => {
  await page.goto("/lab/elysium");
  const headings = await page.locator("main h2").allTextContents();
  expect(headings).toEqual(["Problem", "What I built", "How it works", "Result", "Stack", "Links"]);
  await expect(page.getByRole("link", { name: /op-26-beta\.vercel\.app/ })).toBeVisible();
});

test("every case study page renders", async ({ page }) => {
  for (const p of projects.filter((x) => x.caseStudy)) {
    const res = await page.goto(`/lab/${p.slug}`);
    expect(res?.status(), p.slug).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(p.name);
  }
});

test("the 3D book card links to the source repository", async ({ page }) => {
  await page.goto("/lab");
  await expect(page.getByRole("link", { name: /scrapbook the 3D book/i })).toHaveAttribute("href", "https://github.com/kihurn/Interactive-Book");
});

test("concepts have their own section and link to the concept repository", async ({ page }) => {
  await page.goto("/lab");
  const concepts = page.getByRole("region", { name: "Concepts" });
  const remy = concepts.locator("#remy");
  await expect(remy).toContainText("CONCEPT");
  await expect(remy.getByRole("link", { name: /github/i })).toHaveAttribute("href", "https://github.com/kihurn/Remy");
  await expect(page.getByRole("region", { name: "In progress" }).locator("#v4ult")).toContainText("IN DEVELOPMENT");
});

test("loading /lab never fetches face-api or the model files", async ({ page }) => {
  const seen: string[] = [];
  page.on("request", (r) => seen.push(r.url()));
  await page.goto("/lab");
  await hydrated(page);
  await page.waitForTimeout(500);
  expect(seen.filter((u) => /face-api|\/models\//i.test(u))).toEqual([]);
});
