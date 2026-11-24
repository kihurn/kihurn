import { expect, test, type Page } from "@playwright/test";
import { faq } from "../../src/content/faq";

const MOCK = "http://127.0.0.1:7081";
const hydrated = (page: Page) => page.waitForFunction(() => document.documentElement.dataset.hydrated === "true");

test.describe.configure({ mode: "serial" });
test.afterEach(async () => {
  await fetch(`${MOCK}/__up`);
});

test("a typed question gets a model reply with a c0re tag", async ({ page }) => {
  await page.goto("/");
  await hydrated(page);
  const input = page.getByLabel("Ask me anything about Ki Hurn");
  await input.fill("What is C0RE written in?");
  await input.press("Enter");
  const log = page.locator("[data-chat-log]");
  await expect(log).toContainText("(mock)");
  await expect(log).toContainText(/c0re · \d+\.\ds/);
});

test("the counter follows the input", async ({ page }) => {
  await page.goto("/");
  await hydrated(page);
  await page.getByLabel("Ask me anything about Ki Hurn").fill("hello");
  await expect(page.locator(".chat__count")).toHaveText("5/500");
});

test("model offline: note shows, chips still answer, status bar says NAPPING", async ({ page }) => {
  await fetch(`${MOCK}/__down`);
  await page.goto("/");
  await hydrated(page);
  await expect(page.locator('[data-readout="chat"]')).toContainText("NAPPING", { timeout: 12_000 });
  const input = page.getByLabel("Ask me anything about Ki Hurn");
  await input.fill("something free-form");
  await input.press("Enter");
  await expect(page.locator("[data-chat-log]")).toContainText("asleep", { timeout: 12_000 });
  const entry = faq.find((e) => e.id === "availability")!;
  await page.getByRole("button", { name: entry.question }).click();
  await expect(page.locator("[data-chat-log]")).toContainText(entry.answer.slice(0, 40));
});

test("status bar says ONLINE when the model is up", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-readout="chat"]')).toContainText("ONLINE", { timeout: 12_000 });
});
