import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "reports/playwright-report.json" }]],
  use: {
    baseURL: "http://127.0.0.1:43123",
    locale: "zh-CN",
    viewport: { width: 1440, height: 900 },
    screenshot: "off",
    trace: "off",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:43123",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
