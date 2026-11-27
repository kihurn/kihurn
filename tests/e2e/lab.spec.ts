import { expect, test } from "@playwright/test";
import { experiments } from "../../src/content/experiments";
import { projects } from "../../src/content/projects";

test("one filter applies across the available shelf views", async ({ page, isMobile }) => {
  await page.goto("/lab?autostart=1");
  await expect(page.locator("[data-spine]")).toHaveCount(projects.length + experiments.length);
  await page.getByRole("button", { name: "Security", exact: true }).click();
  const count = projects.filter((project) => project.lenses.includes("security")).length;
  await expect(page.locator("[data-spine]")).toHaveCount(count);
  await expect(page.getByRole("button", { name: "Open book: SecureFin" })).toBeVisible();
  const grid = page.getByRole("button", { name: /^grid$/i });
  if (isMobile) {
    await expect(grid).toHaveCount(0);
  } else {
    await grid.click();
    await expect(page.getByRole("button", { name: /^Open book:/ })).toHaveCount(count);
  }
  await page.getByRole("button", { name: /^list$/i }).click();
  await expect(page.locator(".shelf-row")).toHaveCount(count);
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await expect(page.locator(".shelf-row")).toHaveCount(experiments.length);
});

test("wheel opens a spread, turns the page, and closes with Escape", async ({ page }) => {
  await page.goto("/lab?autostart=1");
  const wheel = page.getByRole("region", { name: "Book spine wheel" });
  await expect(wheel.locator("[aria-current=true]")).toBeVisible();
  await wheel.focus();
  await page.keyboard.press("Enter");
  const book = page.locator("dialog[open]");
  await expect(page.locator(".shelf")).toHaveAttribute("data-book-phase", "departing");
  expect(await book.count()).toBe(0);
  await expect(book.getByRole("heading", { level: 2 })).toHaveText(experiments[0].title);
  await expect(book.getByRole("link", { name: "Open Live Stage" })).toHaveAttribute("href", `/lab/${experiments[0].slug}`);
  await book.getByRole("button", { name: "Next" }).click();
  await expect(book.getByRole("heading", { level: 2 })).toHaveText(experiments[1].title);
  await page.keyboard.press("Escape");
  await expect(book).toHaveAttribute("data-closing", "true");
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
  await page.getByRole("button", { name: "Previous spine" }).click();
  const last = track.locator("[data-spine]").last();
  await expect(last).toHaveAttribute("aria-current", "true");
  await expect(page.locator(".shelf__preview button")).toHaveAccessibleName(await spine.getAttribute("aria-label").then((name) => name!.replace("Open spine", "Open book")));
  await page.getByRole("button", { name: "Next spine" }).click();
  await expect(track.locator("[data-spine]").first()).toHaveAttribute("aria-current", "true");
  await track.focus();
  await page.keyboard.press("ArrowDown");
  await expect(spine).toHaveAccessibleName(`Open spine: ${experiments[1].title}`);
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
  await expect(spine).not.toHaveAccessibleName(`Open spine: ${experiments[1].title}`);
  expect(await spine.boundingBox()).toEqual(initial);

  await spine.click();
  await expect(page.locator("dialog[open]")).toBeVisible();
});

test("Grid and List scroll the document and Wheel locks to the viewport", async ({ page, isMobile }) => {
  await page.goto("/lab?autostart=1");
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBe(0);
  for (const mode of isMobile ? ["list"] : ["grid", "list"]) {
    await page.getByRole("button", { name: new RegExp(`^${mode}$`, "i") }).click();
    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  }
  await page.getByRole("button", { name: /^wheel$/i }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test("Grid and List open directly into the hinged spread", async ({ page, isMobile }) => {
  await page.goto("/lab?autostart=1");
  await expect(page.locator("[data-spine][aria-current=true]")).toBeVisible();
  for (const mode of isMobile ? ["list"] : ["grid", "list"]) {
    await page.getByRole("button", { name: new RegExp(`^${mode}$`, "i") }).click();
    const entry = mode === "grid" ? page.getByRole("button", { name: `Open book: ${experiments[0].title}` }) : page.locator(".shelf-row").first();
    await entry.click();
    await expect(page.locator(".shelf")).toHaveAttribute("data-book-phase", "open");
    const spread = page.locator("dialog[open]");
    await expect(spread.locator(".shelf-spread__hinge")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(spread).toHaveCount(0);
  }
});

test("Wheel and Grid hinge just the front cover on fine pointers", async ({ page, isMobile }) => {
  await page.goto("/lab?autostart=1");
  await expect(page.locator("[data-spine][aria-current=true]")).toBeVisible();
  for (const mode of isMobile ? ["wheel"] : ["wheel", "grid"]) {
    if (mode === "grid") await page.getByRole("button", { name: /^grid$/i }).click();
    const cover = page.getByRole("button", { name: `Open book: ${experiments[0].title}` });
    const scene = cover.locator(".shelf-cover__scene");
    const front = cover.locator(".shelf-cover__front");
    const inner = cover.locator(".shelf-cover__page");
    await expect(front).toBeVisible();
    await expect(inner.locator(".shelf-cover__folio")).toHaveText("P.01");
    await expect(inner).toContainText("2026");
    await expect(inner.locator(".shelf-cover__excerpt")).toContainText(mode === "wheel" ? "icosahedron" : "GLSL");
    await expect(inner.locator(".shelf-cover__cue")).toHaveCount(0);
    await cover.hover();
    if (isMobile) {
      await expect(inner).toBeHidden();
      await expect(front).toHaveCSS("transform", "none");
      await expect(scene).toHaveCSS("animation-name", "none");
    } else {
      await expect.poll(() => front.evaluate((node) => {
        const transform = getComputedStyle(node).transform;
        return transform === "none" ? 0 : Math.round(new DOMMatrixReadOnly(transform).m13 * 1000);
      })).toBe(mode === "wheel" ? 375 : 469);
      await expect(scene).toHaveCSS("perspective", "1200px");
      await expect(cover).toHaveCSS("transform", "none");
      await expect.poll(() => cover.evaluate((node) => {
        const front = node.querySelector(".shelf-cover__front")!.getBoundingClientRect();
        const folio = node.querySelector(".shelf-cover__folio")!.getBoundingClientRect();
        return folio.left >= front.right;
      })).toBe(true);
      if (mode === "wheel") {
        await expect(scene).toHaveCSS("animation-name", "shelf-preview-idle");
        await expect(scene).not.toHaveCSS("transform", "none");
      }
    }
    await cover.click();
    const spread = page.locator("dialog[open]");
    await expect(spread.getByRole("heading", { level: 2 })).toHaveText(experiments[0].title);
    await page.keyboard.press("Escape");
    await expect(spread).toHaveCount(0);
  }
});

test("List combines the moving hairline and soft spotlight on hover-capable devices", async ({ page, isMobile }) => {
  await page.goto("/lab?autostart=1");
  await expect(page.locator("[data-spine][aria-current=true]")).toBeVisible();
  await page.getByRole("button", { name: /^list$/i }).click();
  const list = page.locator(".shelf__list");
  const row = list.locator(".shelf-row").nth(1);
  const sibling = list.locator(".shelf-row").first();
  await row.hover();
  await expect(row).toHaveCSS("opacity", "1");
  await expect(row.locator("svg")).toHaveCount(1);
  if (isMobile) {
    await expect(sibling).toHaveCSS("opacity", "1");
  } else {
    const lineOpacity = () => list.evaluate((node) => getComputedStyle(node, "::before").opacity);
    await expect.poll(lineOpacity).toBe("1");
    await expect(sibling).toHaveCSS("opacity", "0.64");
    await sibling.hover();
    await expect.poll(() => list.evaluate((node) => getComputedStyle(node, "::before").transform)).toBe("matrix(1, 0, 0, 1, 0, 0)");
    await expect(sibling).toHaveCSS("opacity", "1");
    await expect(row).toHaveCSS("transform", "none");
    await page.mouse.move(2, 2);
    await expect.poll(lineOpacity).toBe("0");
    await expect(row).toHaveCSS("opacity", "1");
  }
});

test("List sorting respects the category filter and open-book navigation", async ({ page }) => {
  await page.goto("/lab?autostart=1");
  await expect(page.locator("[data-spine][aria-current=true]")).toBeVisible();
  await page.getByRole("button", { name: /^list$/i }).click();
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  const sort = page.getByRole("combobox", { name: "Sort projects" });
  const titles = page.locator(".shelf-row strong");
  await expect(titles).toHaveText(experiments.map((book) => book.title));
  await sort.selectOption("newest");
  await expect(titles).toHaveText(experiments.toSorted((a, b) => Number(b.year) - Number(a.year)).map((book) => book.title));
  await sort.selectOption("title-asc");
  const ascending = experiments.map((book) => book.title).toSorted((a, b) => a.localeCompare(b, "en"));
  await expect(titles).toHaveText(ascending);
  await sort.selectOption("title-desc");
  const descending = ascending.toReversed();
  await expect(titles).toHaveText(descending);
  await page.locator(".shelf-row").first().click();
  const book = page.locator("dialog[open]");
  await expect(book.getByRole("heading", { level: 2 })).toHaveText(descending[0]);
  await book.getByRole("button", { name: "Next" }).click();
  await expect(book.getByRole("heading", { level: 2 })).toHaveText(descending[1]);
});

test("grid covers use a consistent artwork, title, and footer slot without canvases", async ({ page, isMobile }) => {
  test.skip(isMobile, "Grid is a desktop view");
  await page.goto("/lab?autostart=1");
  await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: /^grid$/i }).click();
  const grid = page.locator(".shelf__grid");
  await expect(grid.locator("canvas")).toHaveCount(0);
  const columns = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(4);
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

test("a saved Grid view falls back to List on narrow screens", async ({ page, isMobile }) => {
  await page.addInitScript(() => localStorage.setItem("lab-mode", "grid"));
  await page.goto("/lab?autostart=1");
  if (!isMobile) {
    await expect(page.locator(".shelf")).toHaveAttribute("data-mode", "grid");
    await page.setViewportSize({ width: 767, height: 800 });
  }
  await expect(page.getByRole("button", { name: /^grid$/i })).toHaveCount(0);
  await expect(page.locator(".shelf")).toHaveAttribute("data-mode", "list");
  await page.getByRole("button", { name: /^wheel$/i }).click();
  await expect(page.locator(".shelf")).toHaveAttribute("data-mode", "wheel");
});

test("the open book contains the full case study, diagrams, and project links", async ({ page, isMobile }) => {
  await page.goto("/lab?autostart=1#elysium");
  const book = page.locator("dialog[open]");
  await expect(book.getByRole("heading", { name: "Elysium" })).toBeVisible();
  for (const name of ["Problem", "My role", "The team", "Architecture", "Result"]) {
    await expect(book.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(book.getByRole("list", { name: "How Elysium works" }).getByRole("listitem")).toHaveCount(4);
  await expect(book).toContainText("1,800 registrations");
  await expect(book.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", /github\.com/);
  await expect(book.getByRole("link", { name: "Live Service" })).toHaveAttribute("href", /vercel\.app/);
  await expect(book.getByRole("link", { name: "Read case study" })).toHaveCount(0);
  const columns = await book.locator(".shelf-spread__pages").evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(isMobile ? 1 : 2);
  expect((await book.boundingBox())!.width).toBeGreaterThan(isMobile ? 320 : 1056);
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

test("old case-study routes open their books and Live Stages still render", async ({ page }) => {
  for (const project of projects.filter((p) => p.caseStudy)) {
    await page.goto(`/lab/${project.slug}`);
    await expect(page).toHaveURL(new RegExp(`/lab#${project.slug}$`));
    await expect(page.locator("dialog[open]").getByRole("heading", { name: project.name, exact: true })).toBeVisible();
  }
  for (const item of experiments) {
    const response = await page.goto(`/lab/${item.slug}?autostart=1`);
    expect(response?.status(), item.slug).toBe(200);
  }
});

test("primary navigation shows Gigs without a Studio entry", async ({ page, isMobile }) => {
  await page.goto("/lab?autostart=1");
  if (isMobile) await page.getByRole("button", { name: "Menu", exact: true }).click();
  const nav = page.getByRole("navigation", { name: isMobile ? "Mobile" : "Primary", exact: true });
  await expect(nav.getByRole("link", { name: "Gigs", exact: true })).toHaveAttribute("href", "/gigs");
  await expect(nav.getByRole("link", { name: "Studio", exact: true })).toHaveCount(0);
});

test("the shelf does not load face recognition", async ({ page }) => {
  const seen: string[] = [];
  page.on("request", (request) => seen.push(request.url()));
  await page.goto("/lab?autostart=1");
  await expect(page.getByRole("heading", { name: "Lab", exact: true })).toBeVisible();
  expect(seen.filter((url) => /face-api|\/models\//i.test(url))).toEqual([]);
});
