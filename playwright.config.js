import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 12_000,
  expect: { timeout: 5_000 },
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: "http://127.0.0.1:4173/",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium-desktop",
      grepInvert: /@mobile/,
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "chromium-mobile",
      grep: /@mobile/,
      use: { ...devices["Pixel 7"] }
    }
  ],
  webServer: {
    command: "VITE_E2E_BYPASS_AUTH=1 npm run build && npm run preview -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
