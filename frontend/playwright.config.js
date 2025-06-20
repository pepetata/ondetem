const { defineConfig } = require("@playwright/test");
const path = require("path");

module.exports = defineConfig({
  webServer: {
    command: "npm run start:test",
    port: 3000,
    cwd: path.resolve(__dirname, "../backend"),
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: "test",
      E2E: "true",
    },
  },
});
