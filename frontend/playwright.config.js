const { defineConfig } = require("@playwright/test");
const path = require("path");

module.exports = defineConfig({
  // Add global teardown here
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
  timeout: 30000, // 30 seconds per test
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: "html",
});
