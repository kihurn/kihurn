import { expect, test } from "@playwright/test";
import { faq } from "../../src/content/faq";
import { projects } from "../../src/content/projects";
import { getFeatured } from "../../src/lib/projects";

const featuredCount = getFeatured(projects).length;
const pad = (n: number) => String(n).padStart(2, "0");
const counter = (i: number) => `Nº${pad(i)}/${pad(featuredCount)}`;
const hydrated = (page: import("@playwright/test").Page) =>
  page.waitForFunction(() => document.documentElement.dataset.hydrated === "true");

test("hero: h1, labelled chat input and three chips", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Wong Ki Hurn");
  await expect(page.getByLabel("Ask me anything about Ki Hurn")).toBeVisible();
  await expect(page.locator("[data-chip]")).toHaveCount(3);
});

test("clicking the availability chip shows that FAQ answer", async ({ page }) => {
  await page.goto("/");
  await hydrated(page);
  const entry = faq.find((e) => e.id === "availability")!;
  await page.getByRole("button", { name: entry.question }).click();
  await expect(page.locator("[data-chat-log]")).toContainText(entry.answer.slice(0, 40));
});

test("typed text that matches nothing gets the coming-soon reply", async ({ page }) => {
  await page.goto("/");
  await hydrated(page);
  const input = page.getByLabel("Ask me anything about Ki Hurn");
  await input.fill("asdf qwerty");
  await input.press("Enter");
  await expect(page.locator("[data-chat-log]")).toContainText("The full chat is coming soon");
});

test("the Now list has four rows", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-now] li")).toHaveCount(4);
});

test("featured carousel: counter, arrows and swipe", async ({ page, isMobile }) => {
  await page.goto("/");
  await hydrated(page);
  const region = page.getByRole("region", { name: "Featured projects" });
  await region.scrollIntoViewIfNeeded();
  const nr = region.locator("[data-fc-counter]");
  await expect(nr).toHaveText(counter(1));

  if (isMobile) {
    const track = region.locator("[data-fc-track]");
    const box = (await track.boundingBox())!;
    // a real touch drag: start, several moves, end
    const cdp = await page.context().newCDPSession(page);
    const y = box.y + box.height / 2;
    const x0 = box.x + box.width * 0.85;
    const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number) =>
      cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
    await touch("touchStart", x0);
    for (let i = 1; i <= 12; i++) await touch("touchMove", x0 - (box.width * 0.7 * i) / 12);
    await touch("touchEnd", x0);
  } else {
    await region.focus();
    await page.keyboard.press("ArrowRight");
  }
  await expect(nr).toHaveText(counter(2));
});

test("the page does not scroll-jack the wheel", async ({ page }) => {
  await page.goto("/");
  const region = page.getByRole("region", { name: "Featured projects" });
  await region.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  const box = (await region.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, 200);
  await page.mouse.wheel(0, 200);
  await expect.poll(async () => (await page.evaluate(() => window.scrollY)) - before).toBeGreaterThanOrEqual(150);
  await expect.poll(async () => (await page.evaluate(() => window.scrollY)) - before).toBeLessThanOrEqual(260);
});

test("call-to-action links", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "See all work" })).toHaveAttribute("href", "/lab");
  await expect(page.getByRole("link", { name: "Send me a ticket" })).toHaveAttribute("href", "/contact");
});

test("GitHub failing (stub returns 500): page renders, activity section is absent", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent activity" })).toHaveCount(0);
});
