import { defineConfig } from "@playwright/test";

// 3200, not 3000: another local dev server often owns 3000
const PORT = 3200;
const STUB_PORT = 3201;
const MOCK_PORT = 7081;

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true } },
  ],
  webServer: [
    {
      // always answers 500, so Home must hide its activity section and still render
      command: "node tests/e2e/github-stub.mjs",
      port: STUB_PORT,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "npm run mock:c0re",
      port: MOCK_PORT,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: `npm run dev -- -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        GITHUB_API_BASE: `http://localhost:${STUB_PORT}`,
        C0RE_URL: `http://127.0.0.1:${MOCK_PORT}`,
        C0RE_API_KEY: "mock-key",
        C0RE_MODEL: "mock",
        C0RE_HEALTH_TTL_MS: "0",
      },
    },
  ],
});
