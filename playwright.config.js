import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:8081/SecurityDemoDashBoard/",
    headless: false,
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    port: 8081,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
