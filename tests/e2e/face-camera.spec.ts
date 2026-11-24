import { expect, test, type Page } from "@playwright/test";

const hydrated = (page: Page) => page.waitForFunction(() => document.documentElement.dataset.hydrated === "true");

test.use({
  permissions: ["camera"],
  launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
});

test("models load only after Start camera, and the live verdict appears", async ({ page }) => {
  const models: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/models/")) models.push(r.url());
  });
  await page.goto("/lab/securefin");
  await hydrated(page);
  await page.getByRole("button", { name: "Try it" }).click();
  expect(models).toEqual([]);
  await page.getByRole("button", { name: "Start camera" }).click();
  // the fake feed has no face in it
  await expect(page.locator("[data-face-verdict]")).toHaveText("No face in view.", { timeout: 60_000 });
  expect(models.length).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("button", { name: "Try it" })).toBeVisible();
});
