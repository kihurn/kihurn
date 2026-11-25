import { expect, test, type Page } from "@playwright/test";

const hydrated = (page: Page) => page.waitForFunction(() => document.documentElement.dataset.hydrated === "true");

test("typing a name updates the stub", async ({ page }) => {
  await page.goto("/contact");
  await hydrated(page);
  await page.getByLabel("Your name").fill("Ada Lovelace");
  await expect(page.locator("[data-stub-name]")).toHaveText("Ada Lovelace");
  await expect(page.locator("[data-stub-status]")).toHaveText("BEING WRITTEN");
  await page.getByLabel("Freelance").check();
  await expect(page.locator("[data-stub-type]")).toHaveText("FREELANCE");
});

test("an empty message shows the field error and moves focus to it", async ({ page }) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({ status: 400, json: { field: "message", error: "Write between 10 and 2000 characters." } }),
  );
  await page.goto("/contact");
  await hydrated(page);
  await page.getByLabel("Your name").fill("Ada");
  await page.getByLabel("Your email").fill("ada@example.com");
  await page.getByRole("button", { name: "Send it" }).click();
  await expect(page.locator(".ticket").getByRole("alert")).toContainText("Write between 10 and 2000");
  await expect(page.getByLabel("Message")).toBeFocused();
});

test("a successful send shows IN QUEUE and the download button", async ({ page }) => {
  await page.route("**/api/contact", (route) => route.fulfill({ status: 200, json: { ticketNo: "KH-261124-ABCD" } }));
  await page.goto("/contact");
  await hydrated(page);
  await page.getByLabel("Your name").fill("Ada");
  await page.getByLabel("Your email").fill("ada@example.com");
  await page.getByLabel("Message").fill("Hello Ki Hurn, this is a test ticket.");
  await page.getByRole("button", { name: "Send it" }).click();
  await expect(page.locator("[data-stub-status]")).toHaveText("IN QUEUE");
  await expect(page.locator("[data-stub-no]")).toHaveText("KH-261124-ABCD");
  await expect(page.getByRole("button", { name: "Download your stub" })).toBeVisible();
});

test("a failed send shows the direct email fallback", async ({ page }) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({ status: 502, json: { error: "Couldn't send right now. Email me directly at wongkihurn2005@gmail.com." } }),
  );
  await page.goto("/contact");
  await hydrated(page);
  await page.getByLabel("Your name").fill("Ada");
  await page.getByLabel("Your email").fill("ada@example.com");
  await page.getByLabel("Message").fill("Hello Ki Hurn, this is a test ticket.");
  await page.getByRole("button", { name: "Send it" }).click();
  await expect(page.locator(".ticket").getByRole("alert")).toContainText("wongkihurn2005@gmail.com");
});

test("the honeypot is hidden from people and tab order", async ({ page }) => {
  await page.goto("/contact");
  const hp = page.locator('input[name="website"]');
  await expect(hp).toHaveAttribute("tabindex", "-1");
  await expect(hp).toHaveAttribute("autocomplete", "off");
  await expect(hp).toHaveAttribute("aria-hidden", "true");
});
