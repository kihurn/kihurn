import { expect, test } from "@playwright/test";

const LABELS = ["Home", "Lab", "About", "Gigs", "Contact"];

test("wordmark reads KIHURN.", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header .wordmark")).toHaveText("KIHURN.");
});

test("the five nav links resolve", async ({ page }) => {
  await page.goto("/");
  const links = page.locator("footer nav a");
  await expect(links).toHaveCount(5);
  await expect(links).toHaveText(LABELS);
  const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
  for (const href of hrefs) {
    const res = await page.goto(href);
    expect(res?.status(), href).toBeLessThan(400);
    await expect(page.locator("main h1")).toBeVisible();
  }
  const headerLinks = page.locator("header .navpill__link");
  await expect(headerLinks).toHaveCount(5);
});

test("command palette opens as a dialog", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page.locator("[data-cmd-open]").first()).toBeAttached();
  // let the client script attach its listeners
  await page.waitForFunction(() => document.querySelector("[data-roll][data-rolled]") !== null);
  if (isMobile) {
    await page.getByRole("button", { name: "Search" }).click();
  } else {
    await page.keyboard.press("Control+k");
  }
  await expect(page.getByRole("dialog", { name: "Command menu" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Command menu" })).toBeHidden();
});

test("no horizontal scroll on phones", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  for (const path of ["/", "/lab", "/about", "/gigs", "/contact"]) {
    await page.goto(path);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(sw, path).toBeLessThanOrEqual(375);
  }
});

test("status bar shows 2 readouts on mobile and 4 on desktop", async ({ page, isMobile }) => {
  await page.goto("/");
  const visible = page.locator("[data-statusbar] [data-readout]:visible");
  await expect(visible).toHaveCount(isMobile ? 2 : 4);
});

test("reduced motion: palette opens with no transition", async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForFunction(() => document.querySelector("[data-roll][data-rolled]") !== null);
  if (isMobile) await page.getByRole("button", { name: "Search" }).click();
  else await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Command menu" })).toBeVisible();
  const durations = await page.evaluate(() =>
    [".cmd", ".cmd__panel", ".overlay"].map((s) => {
      const el = document.querySelector(s)!;
      const cs = getComputedStyle(el);
      return [cs.transitionDuration, cs.animationDuration];
    }),
  );
  for (const [t, a] of durations) {
    expect(t.split(",").every((d) => parseFloat(d) === 0)).toBe(true);
    expect(a.split(",").every((d) => parseFloat(d) === 0)).toBe(true);
  }
});

test("first Tab lands on the skip link", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});

test("nav pill sits exactly on the current page's link", async ({ page, isMobile }) => {
  test.skip(isMobile, "the pill nav is desktop only");
  for (const [path, label] of [["/about", "About"], ["/lab", "Lab"], ["/", "Home"]] as const) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const link = page.locator(".navpill__link", { hasText: label });
    // wait out the 0.4s slide
    await expect
      .poll(async () => {
        const [p, l] = await Promise.all([
          page.locator("[data-nav-pill]").boundingBox(),
          link.boundingBox(),
        ]);
        if (!p || !l) return 99;
        return Math.max(Math.abs(p.x - l.x), Math.abs(p.y - l.y), Math.abs(p.width - l.width), Math.abs(p.height - l.height));
      })
      .toBeLessThanOrEqual(1);
  }
});
