import { expect, test } from "@playwright/test";
import { experiments } from "../../src/content/experiments";
import { projects } from "../../src/content/projects";

test("one filter applies across the spine wheel, grid, and list", async ({ page }) => {
  await page.goto("/lab?autostart=1");
  await expect(page.locator("[data-spine]")).toHaveCount(projects.length + experiments.length);
  await page.getByRole("button", { name: "Security", exact: true }).click();
  const count = projects.filter((project) => project.lenses.includes("security")).length;
  await expect(page.locator("[data-spine]")).toHaveCount(count);
  await expect(page.getByRole("button", { name: "Open book: SecureFin" })).toBeVisible();
  await page.getByRole("button", { name: /^grid$/i }).click();
  await expect(page.getByRole("button", { name: /^Open book:/ })).toHaveCount(count);
  await page.getByRole("button", { name: /^list$/i }).click();
  await expect(page.locator(".shelf-row")).toHaveCount(count);
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await expect(page.locator(".shelf-row")).toHaveCount(experiments.length);
});

test("wheel opens a spread, turns the page, and closes with Escape", async ({ page }) => {
  await page.goto("/lab?autostart=1");
  const wheel = page.getByRole("region", { name: "Book spine wheel" });
  await wheel.focus();
  await page.keyboard.press("Enter");
  const book = page.locator("dialog[open]");
  await expect(book.getByRole("heading", { level: 2 })).toHaveText(experiments[0].title);
  await expect(book.getByRole("link", { name: "Open Live Stage" })).toHaveAttribute("href", `/lab/${experiments[0].slug}`);
  await book.getByRole("button", { name: "Next" }).click();
  await expect(book.getByRole("heading", { level: 2 })).toHaveText(experiments[1].title);
  await page.keyboard.press("Escape");
  await expect(book).toHaveCount(0);
});

test("project book deep links retain case-study details, source, and live links", async ({ page }) => {
  await page.goto("/lab?autostart=1#elysium");
  const book = page.locator("dialog[open]");
  await expect(book.getByRole("heading", { name: "Elysium" })).toBeVisible();
  await expect(book.getByRole("heading", { name: "Architecture" })).toBeVisible();
  await expect(book.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", /github\.com/);
  await expect(book.getByRole("link", { name: "Live Service" })).toHaveAttribute("href", /vercel\.app/);
  await expect(book.getByRole("link", { name: "Read case study" })).toHaveAttribute("href", "/lab/elysium");
});

test("the internal book omits external source links", async ({ page }) => {
  await page.goto("/lab?autostart=1#campus-network");
  const book = page.locator("dialog[open]");
  await expect(book).toContainText("INTERNAL");
  await expect(book.getByRole("link", { name: "GitHub" })).toHaveCount(0);
  await expect(book).toContainText(/walkthrough on request/i);
});

test("the Systems inspector opens the selected Lab book", async ({ page }) => {
  await page.goto("/systems?autostart=1");
  await expect(page.getByRole("heading", { name: "AI ecosystem" })).toBeVisible();
  for (const step of ["Browser", "Vercel", "Tailscale Funnel", "C0RE Rust gateway", "Local Ollama GPU"]) {
    await expect(page.locator("#chat-path")).toContainText(step);
  }
  await page.locator('[data-eco-node="lenz"]').click();
  const inspector = page.getByLabel("Node inspector");
  await expect(inspector.getByRole("heading", { name: "Lenz" })).toBeVisible();
  await expect(inspector.getByRole("link", { name: "Open Lab book" })).toHaveAttribute("href", "/lab#lenz");
  await inspector.getByRole("link", { name: "Open Lab book" }).click();
  await expect(page.locator("dialog[open]").getByRole("heading", { name: "Lenz" })).toBeVisible();
});

test("case-study and fullscreen experiment routes still render", async ({ page }) => {
  for (const item of [...projects.filter((p) => p.caseStudy), ...experiments]) {
    const response = await page.goto(`/lab/${item.slug}?autostart=1`);
    expect(response?.status(), item.slug).toBe(200);
  }
});

test("the shelf does not load face recognition", async ({ page }) => {
  const seen: string[] = [];
  page.on("request", (request) => seen.push(request.url()));
  await page.goto("/lab?autostart=1");
  await expect(page.getByRole("heading", { name: "Lab", exact: true })).toBeVisible();
  expect(seen.filter((url) => /face-api|\/models\//i.test(url))).toEqual([]);
});
