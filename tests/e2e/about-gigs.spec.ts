import { expect, test, type Page } from "@playwright/test";
import { eventPortfolioUrl } from "../../src/content/gigs";

const hydrated = (page: Page) =>
  page.waitForFunction(() => document.documentElement.dataset.hydrated === "true");

test.describe("About", () => {
  test("timeline names the school, the employer and the university", async ({ page }) => {
    await page.goto("/about");
    const timeline = page.locator("[data-timeline]");
    await expect(timeline).toContainText("Taylor's University");
    await expect(timeline).toContainText("Ideabase Technologies");
    await expect(timeline).toContainText("Sunway University");
  });

  test("skills are grouped under the five headings", async ({ page }) => {
    await page.goto("/about");
    for (const h of ["Languages", "Web", "Data", "Systems & Networking", "Security"]) {
      await expect(page.getByRole("heading", { name: h, exact: true }), h).toBeVisible();
    }
  });

  test("the last line links to Gigs", async ({ page }) => {
    await page.goto("/about");
    const link = page.getByRole("link", { name: /crewing events/i });
    await expect(link).toHaveAttribute("href", "/gigs");
  });

  test("never shows a phone number", async ({ page }) => {
    await page.goto("/about");
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/\+?6?01\d[- ]?\d{3,4}[- ]?\d{4}/);
  });
});

test.describe("Gigs", () => {
  test("the portrait crew pass flips to the event portfolio QR code", async ({ page, isMobile }) => {
    await page.goto("/gigs");
    await hydrated(page);
    const pass = page.getByRole("button", { name: /crew pass/i });
    await expect(pass.locator(".lanyard__front")).toContainText("Wong Ki Hurn");
    await expect(pass.locator(".lanyard__front")).toContainText("CS, Systems & Event Production");
    await expect(pass.locator(".lanyard__photo")).toHaveCount(0);
    await expect.poll(() => pass.evaluate((element) => (element as HTMLElement).offsetWidth)).toBe(264);
    await expect(pass).toHaveAttribute("aria-pressed", "false");
    await page.waitForFunction(() => {
      const pass = document.querySelector(".lanyard__badge")?.getBoundingClientRect();
      return !document.documentElement.dataset.preloader && pass && pass.top > 100 && pass.bottom < innerHeight;
    });
    if (isMobile) await pass.tap({ force: true });
    else await pass.click({ force: true });
    await expect(pass).toHaveAttribute("aria-pressed", "true");
    const qr = page.getByRole("img", { name: "QR code for the event portfolio" });
    await expect(qr).toHaveAttribute("src", "/images/event-portfolio-qr.png");
    await expect(page.getByRole("link", { name: "Event portfolio", exact: true })).toHaveAttribute("href", eventPortfolioUrl);
    const ratio = await page.locator("[data-pass-back]").evaluate((face) => (face as HTMLElement).offsetHeight / (face as HTMLElement).offsetWidth);
    expect(ratio).toBeCloseTo(390 / 264);
  });

  test("the crew pass flips with the keyboard", async ({ page }) => {
    await page.goto("/gigs");
    await hydrated(page);
    const pass = page.getByRole("button", { name: /crew pass/i });
    await pass.focus();
    await page.keyboard.press("Enter");
    await expect(pass).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Enter");
    await expect(pass).toHaveAttribute("aria-pressed", "false");
  });

  test("under reduced motion the flip is instant", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/gigs");
    await hydrated(page);
    const d = await page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector("[data-pass-inner]")!);
      return [cs.transitionDuration, cs.animationDuration];
    });
    for (const v of d) expect(v.split(",").every((x) => parseFloat(x) === 0)).toBe(true);
  });

  test("clicking or tapping sends the front Polaroid to the back and loops the stack", async ({ page, isMobile }) => {
    await page.goto("/gigs");
    await hydrated(page);
    const cards = page.locator("[data-event]");
    await expect(cards).toHaveCount(5);
    const stack = page.getByRole("button", { name: /next photo/i });
    await expect(stack).toHaveAccessibleName(/WNBF Malaysia 2025/);
    if (isMobile) await stack.tap();
    else await stack.click();
    await expect(stack).toHaveAccessibleName(/Circus Funtasia/);
    await expect(cards.filter({ hasText: "WNBF Malaysia 2025" })).toHaveAttribute("data-stack-position", "4");
    await expect(page.getByText("Event Crew & Production", { exact: true })).toHaveCount(0);
    for (let i = 0; i < 2; i++) await page.getByRole("button", { name: "Next event" }).click();
    const lawBall = cards.filter({ hasText: "Law Ball 2025" });
    await expect(lawBall).toHaveAttribute("data-stack-position", "0");
    await expect.poll(() => lawBall.evaluate((card) => {
      const photo = card.querySelector(".event__photo")!.getBoundingClientRect();
      const caption = card.querySelector(".event__caption")!.getBoundingClientRect();
      return caption.top >= photo.bottom - 1 && caption.bottom <= card.getBoundingClientRect().bottom + 1;
    })).toBe(true);
    await page.getByRole("button", { name: "Next event" }).click();
    await expect(stack).toHaveAccessibleName(/ImagineHack 2026/);
    await page.getByRole("button", { name: "Next event" }).click();
    await expect(stack).toHaveAccessibleName(/WNBF Malaysia 2025/);
    await expect.poll(() => cards.locator("img").evaluateAll((images) => images.filter((element) => {
      const image = element as HTMLImageElement;
      return image.naturalWidth > 0 && decodeURIComponent(image.currentSrc).includes("/images/gigs/");
    }).length)).toBe(5);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("the former Studio route leads to the combined Gigs page", async ({ page }) => {
    await page.goto("/studio");
    await expect(page).toHaveURL(/\/gigs$/);
    await expect(page.getByRole("heading", { name: "Practice & availability" })).toBeVisible();
  });

  test("the scrapbook link goes to the book repository", async ({ page }) => {
    await page.goto("/gigs");
    await expect(page.getByRole("link", { name: /open the scrapbook/i })).toHaveAttribute("href", "https://github.com/kihurn/Interactive-Book");
  });
});
