import { expect, test, type Page } from "@playwright/test";
import { faq } from "../../src/content/faq";
import { projects } from "../../src/content/projects";

const N = projects.length;
const hydrated = (page: Page) => page.waitForFunction(() => document.documentElement.dataset.hydrated === "true");
const position = (page: Page) => page.locator("[data-wheels] [aria-live]");

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

test("the Now list has four rows", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-now] li")).toHaveCount(4);
});

test("project wheel: opens on the first project, turns with the arrow keys or a swipe", async ({ page, isMobile }) => {
  await page.goto("/");
  await hydrated(page);
  const stage = page.locator("[data-wheels]");
  await expect(stage).toBeVisible();
  await expect(position(page)).toHaveText(new RegExp(`1 of ${N}$`));

  if (isMobile) {
    const box = (await stage.boundingBox())!;
    const cdp = await page.context().newCDPSession(page);
    const y = box.y + box.height / 2;
    const x0 = box.x + box.width * 0.85;
    const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number) =>
      cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
    await touch("touchStart", x0);
    for (let i = 1; i <= 12; i++) await touch("touchMove", x0 - (box.width * 0.7 * i) / 12);
    await touch("touchEnd", x0);
  } else {
    await page.keyboard.press("ArrowRight");
  }
  await expect(position(page)).toHaveText(new RegExp(`2 of ${N}$`));
});

test("the centre link opens the project's entry", async ({ page }) => {
  await page.goto("/");
  await hydrated(page);
  const link = page.locator("[data-wheels-center] a");
  await expect(link).toHaveAttribute("href", /^\/lab/);
});

test("the page does not scroll-jack the wheel", async ({ page }) => {
  await page.goto("/");
  await hydrated(page);
  const stage = page.locator("[data-wheels]");
  const box = (await stage.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 200);
  await expect.poll(async () => (await page.evaluate(() => window.scrollY)) - before).toBeGreaterThanOrEqual(150);
  await expect.poll(async () => (await page.evaluate(() => window.scrollY)) - before).toBeLessThanOrEqual(260);
  await expect(position(page)).toHaveText(new RegExp(`1 of ${N}$`));
});

test("call-to-action links", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "See all work" })).toHaveAttribute("href", "/lab");
  await expect(page.getByRole("link", { name: "Send me a ticket" })).toHaveAttribute("href", "/contact");
});

test("GitHub failing (stub returns 500): page renders, activity section is absent", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeAttached();
  await expect(page.getByRole("heading", { name: "Recent activity" })).toHaveCount(0);
});
