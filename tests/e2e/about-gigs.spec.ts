import { expect, test, type Page } from "@playwright/test";

const hydrated = (page: Page) =>
  page.waitForFunction(() => document.documentElement.dataset.hydrated === "true");

const ROLES = ["Internal usher", "External usher", "Registration", "Ticket collection", "Photographer", "Projectionist", "Runner"];

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
  test("the crew pass flips on click or tap and lists all seven roles", async ({ page, isMobile }) => {
    await page.goto("/gigs");
    await hydrated(page);
    const pass = page.getByRole("button", { name: /crew pass/i });
    await expect(pass).toContainText("CREW · ALL ACCESS");
    await expect(pass).toHaveAttribute("aria-pressed", "false");
    if (isMobile) await pass.tap();
    else await pass.click();
    await expect(pass).toHaveAttribute("aria-pressed", "true");
    for (const r of ROLES) await expect(page.locator("[data-pass-back]").getByText(r, { exact: true })).toBeVisible();
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

  test("four event cards use finished copy and a two-column desktop grid", async ({ page, isMobile }) => {
    await page.goto("/gigs");
    const cards = page.locator("[data-event]");
    await expect(cards).toHaveCount(4);
    await expect(cards.filter({ hasText: "WNBF Malaysia 2025" })).toHaveCount(1);
    await expect(cards.filter({ hasText: "Orientation Party 2026" })).toHaveCount(1);
    await expect(cards.filter({ hasText: "Law Ball 2025" })).toHaveCount(1);
    await expect(cards.filter({ hasText: "Circus Funtasia" })).toContainText("Event Crew & Production");
    await expect(page.locator(".events")).not.toContainText("TODO:");
    const columns = await page.locator(".events").evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns.split(" ").length,
    );
    expect(columns).toBe(isMobile ? 1 : 2);
  });

  test("the scrapbook link goes to the book site", async ({ page }) => {
    await page.goto("/gigs");
    await expect(page.getByRole("link", { name: /open the scrapbook/i })).toHaveAttribute("href", "https://kihurn-book.vercel.app");
  });
});
