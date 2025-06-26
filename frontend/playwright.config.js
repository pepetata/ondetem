const { defineConfig } = require("@playwright/test");
const path = require("path");

module.exports = defineConfig({
  // Add global setup and teardown
  globalSetup: require.resolve("./tests-e2e/global-setup.js"),
  globalTeardown: require.resolve("./tests-e2e/global-teardown.js"),

  webServer: [
    {
      command: "npm run dev",
      port: 5173,
      cwd: __dirname,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run start:test",
      port: 3000,
      cwd: path.join(__dirname, "../backend"),
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        E2E: "true",
      },
    },
  ],
  use: {
    baseURL: "http://localhost:5173",
  },

  // Optional: Add some additional settings
  testDir: "./tests-e2e",
  timeout: 30000, // 30 seconds per test - reduced from 60s
  fullyParallel: false, // Disable parallel for better stability
  retries: process.env.CI ? 2 : 0, // No retries in dev for faster feedback
  workers: 1, // Single worker for better stability and isolation
  reporter: process.env.CI
    ? [["json", { outputFile: "test-results.json" }], ["github"]]
    : "html",
});
