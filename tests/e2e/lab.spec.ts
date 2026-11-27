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

test("the wheel advances through a single stationary spine and a single live cover", async ({ page, isMobile }) => {
  await page.goto("/lab?autostart=1");
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
  const track = page.getByRole("region", { name: "Book spine wheel" });
  const spine = page.locator(".shelf-spine");
  await expect(spine).toHaveCount(1);
  const initial = await spine.boundingBox();
  await expect(page.locator(".shelf__preview canvas")).toHaveCount(1);
  await track.focus();
  await page.keyboard.press("ArrowDown");
  await expect(spine).toHaveAccessibleName(`Open spine: ${experiments[1].title}`);
  await expect.poll(() => track.evaluate((el) => el.scrollTop)).toBe(60);
  expect(await spine.boundingBox()).toEqual(initial);

  const box = (await spine.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  if (isMobile) {
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let step = 1; step <= 8; step++) {
      await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - step * 12.5 }] });
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y - 100, { steps: 8 });
    await page.mouse.up();
  }
  await expect.poll(() => track.evaluate((el) => el.scrollTop)).toBeGreaterThan(120);
  await expect.poll(() => track.evaluate((el) => el.scrollTop % 60)).toBe(0);
  expect(await spine.boundingBox()).toEqual(initial);

  await spine.click();
  await expect(page.locator("dialog[open]")).toBeVisible();
});

test("grid covers use a consistent artwork, title, and footer slot without canvases", async ({ page, isMobile }) => {
  await page.goto("/lab?autostart=1");
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
  if (!isMobile) await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: /^grid$/i }).click();
  const grid = page.locator(".shelf__grid");
  await expect(grid.locator("canvas")).toHaveCount(0);
  const columns = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(isMobile ? 1 : 4);
  const slots = await grid.locator(".shelf-cover").evaluateAll((covers, count) => covers.slice(0, count).map((cover) => {
    const art = cover.querySelector(".shelf-cover__art")!.getBoundingClientRect();
    const title = cover.querySelector(".shelf-cover__title")!.getBoundingClientRect();
    const foot = cover.querySelector(".shelf-cover__foot")!.getBoundingClientRect();
    return { art: art.height, title: title.height, footer: foot.top };
  }), columns);
  expect(slots[0].art).toBe(135);
  for (const slot of slots) {
    expect(slot.art).toBe(slots[0].art);
    expect(slot.title).toBe(slots[0].title);
    expect(slot.footer).toBeCloseTo(slots[0].footer, 1);
  }
  const rowGap = await grid.locator(".shelf-cover").evaluateAll((covers, count) =>
    covers[count].getBoundingClientRect().top - covers[0].getBoundingClientRect().bottom, columns);
  expect(rowGap).toBeGreaterThanOrEqual(24);
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
