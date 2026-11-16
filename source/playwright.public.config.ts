import { defineConfig } from "@playwright/test";

const baseURL = process.env.PUBLIC_BASE_URL;
if (!baseURL) throw new Error("PUBLIC_BASE_URL is required");

export default defineConfig({
  testDir: "e2e",
  testMatch: "touch.spec.ts",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    locale: "zh-CN",
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  },
});
