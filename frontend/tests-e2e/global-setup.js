const { exec } = require("child_process");
const { promisify } = require("util");
const axios = require("axios");
const path = require("path");
const { main: runSafetyCheck } = require("./utils/safety-check");

const execAsync = promisify(exec);

async function globalSetup() {
  console.log("🚀 Starting global E2E test setup...");

  // SAFETY CHECK: Prevent running against development environment
  console.log("🔐 Running safety checks...");
  try {
    await runSafetyCheck();
  } catch (error) {
    console.error("🚨 Safety check failed - aborting E2E tests");
    throw error;
  }

  // Ensure we're in test mode
  process.env.NODE_ENV = "test";
  console.log("✅ Safety checks passed - proceeding with test setup");

  try {
    // Step 1: Initialize and clear the test database
    console.log("📚 Initializing and clearing test database...");
    const backendPath = path.join(__dirname, "../../backend");

    // Always reset the database to ensure clean state
    await execAsync("node scripts/init_test_db.js", {
      cwd: backendPath,
      env: { ...process.env, NODE_ENV: "test" },
    });
    console.log("✅ Test database initialized and cleared");

    // Additional cleanup: manually clear any remaining data
    try {
      await axios.post(
        "http://localhost:3000/api/test/cleanup",
        {},
        {
          timeout: 10000,
        }
      );
      console.log("✅ Additional database cleanup completed");
    } catch (error) {
      console.log(
        "⚠️ Additional cleanup failed (servers may not be ready yet):",
        error.message
      );
    }

    // Step 2: Wait for servers to be ready
    console.log("⏳ Waiting for servers to start...");
    await waitForServer("http://localhost:3000/api/users", 60000);
    await waitForServer("http://localhost:5173", 60000);
    console.log("✅ Both servers are ready");

    // Step 3: Seed the database with minimal test data
    console.log("🌱 Seeding database with minimal test data...");
    const frontendPath = path.join(__dirname, "..");

    try {
      await execAsync("node scripts/seed-minimal-data.js", {
        cwd: frontendPath,
        env: { ...process.env, NODE_ENV: "test" },
      });
      console.log("✅ Database seeded with minimal test data");
    } catch (error) {
      console.log("⚠️ Seeding warning:", error.message);
      // Continue even if seeding has warnings
    }

    // Step 4: Verify minimal data is available
    console.log("🔍 Verifying minimal test data...");
    const response = await axios.get("http://localhost:3000/api/ads");
    console.log(
      `✅ Found ${response.data.length} ads in database (expected: ~5 minimal ads)`
    );

    if (response.data.length === 0) {
      throw new Error("No ads found in database after seeding");
    }

    console.log("🎉 Global setup completed successfully!");
  } catch (error) {
    console.error("❌ Global setup failed:", error.message);
    throw error;
  }
}

async function waitForServer(url, timeout = 30000) {
  const startTime = Date.now();
  const interval = 1000;

  while (Date.now() - startTime < timeout) {
    try {
      await axios.get(url, { timeout: 5000 });
      return;
    } catch (error) {
      // Server not ready yet, wait and try again
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  throw new Error(`Server at ${url} did not become ready within ${timeout}ms`);
}

module.exports = globalSetup;
