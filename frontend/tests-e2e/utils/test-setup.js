#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");

console.log("🔧 Setting up test environment...");

try {
  // Change to backend directory
  const backendDir = path.join(__dirname, "..", "..", "..", "backend");

  console.log("📂 Navigating to backend directory...");
  process.chdir(backendDir);

  // Run database initialization for test environment
  console.log("🗄️ Initializing test database...");
  const isWindows = process.platform === "win32";
  const nodeCommand = "node scripts/init_test_db.js";

  execSync(nodeCommand, {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "test" },
  });

  console.log("✅ Test environment setup completed!");
  console.log("");
  console.log("🧪 You can now run tests with:");
  console.log("   npm run test:pw");
  console.log("");
  console.log("🧹 To clean up test data:");
  console.log("   npm run test:cleanup");
} catch (error) {
  console.error("❌ Test setup failed:", error.message);
  process.exit(1);
}
