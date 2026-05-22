import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT || "3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${port}`;
const webServerCommand = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND || `npm run dev -- --port ${port}`;
const reuseExistingServer = !process.env.CI && process.env.E2E_ISOLATED_DATABASE !== "true";

export default defineConfig({
  expect: {
    timeout: 10000,
  },
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  testDir: "./tests/e2e",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: webServerCommand,
    reuseExistingServer,
    timeout: 120000,
    url: baseURL,
  },
});
