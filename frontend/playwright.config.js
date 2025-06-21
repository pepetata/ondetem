const { defineConfig } = require("@playwright/test");
const path = require("path");

module.exports = defineConfig({
  webServer: {
    command: "npm run dev",
    port: 5173,
    cwd: __dirname,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:5173",
  },
});
