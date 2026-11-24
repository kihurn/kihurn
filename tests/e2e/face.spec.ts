import { expect, test, type Page } from "@playwright/test";

const hydrated = (page: Page) => page.waitForFunction(() => document.documentElement.dataset.hydrated === "true");

test("no model files are requested until Try it and Start camera are used", async ({ page }) => {
  const models: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/models/")) models.push(r.url());
  });
  await page.goto("/lab/securefin");
  await hydrated(page);
  await page.getByRole("button", { name: "Try it" }).click();
  await expect(page.getByText("Runs entirely on your device")).toBeVisible();
  await page.waitForTimeout(500);
  expect(models).toEqual([]);
});

test("a denied camera shows the permission message", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () => Promise.reject(Object.assign(new Error("denied"), { name: "NotAllowedError" })),
      },
    });
  });
  await page.goto("/lab/securefin");
  await hydrated(page);
  await page.getByRole("button", { name: "Try it" }).click();
  await page.getByRole("button", { name: "Start camera" }).click();
  await expect(page.locator("[data-face-error]")).toHaveText("Camera permission was denied.");
});

test("no camera API: shows No camera found. and the fallback video", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
  });
  await page.goto("/lab/securefin");
  await hydrated(page);
  await page.getByRole("button", { name: "Try it" }).click();
  await page.getByRole("button", { name: "Start camera" }).click();
  await expect(page.locator("[data-face-error]")).toHaveText("No camera found.");
  await expect(page.locator("[data-face-fallback]")).toBeAttached();
});

test("the demo is only on the SecureFin entry", async ({ page }) => {
  await page.goto("/lab/elysium");
  await expect(page.getByRole("button", { name: "Try it" })).toHaveCount(0);
});
