import { defineConfig, devices } from "@playwright/test";

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
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --port 3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    url: "http://localhost:3000",
  },
});
