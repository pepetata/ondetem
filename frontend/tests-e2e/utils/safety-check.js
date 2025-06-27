#!/usr/bin/env node

/**
 * E2E Test Safety Guard
 * Prevents accidental execution of E2E tests against development environment
 */

const path = require("path");
const fs = require("fs");

// Check if development servers are running
async function checkForRunningDevServers() {
  const { exec } = require("child_process");
  const { promisify } = require("util");
  const execAsync = promisify(exec);

  try {
    // Check for processes using development ports
    const results = await Promise.allSettled([
      checkPort(5173, "Frontend Dev Server (npm run dev)"),
      checkPort(3000, "Backend Dev Server"),
    ]);

    return results.some(
      (result) => result.status === "fulfilled" && result.value
    );
  } catch (error) {
    return false;
  }
}

async function checkPort(port, serviceName) {
  const { exec } = require("child_process");
  const { promisify } = require("util");
  const execAsync = promisify(exec);

  try {
    if (process.platform === "win32") {
      // Only check for LISTENING connections, not TIME_WAIT or other states
      const { stdout } = await execAsync(
        `netstat -ano | findstr :${port} | findstr LISTENING`
      );

      if (stdout.trim()) {
        // Check if this is a Playwright-managed test server
        if (isPlaywrightTestServer(port)) {
          console.log(
            `✅ ${serviceName} (Playwright test server) is running on port ${port}`
          );
          return false; // Allow Playwright test servers
        }

        console.log(`⚠️  ${serviceName} is running on port ${port}`);
        return true;
      }
    } else {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      if (stdout.trim()) {
        console.log(`⚠️  ${serviceName} is running on port ${port}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

function checkEnvironmentVariables() {
  const backendEnvPath = path.join(__dirname, "../../backend/.env");
  const isProduction = process.env.NODE_ENV === "production";
  const isCi = process.env.CI === "true";

  // In CI or production, allow tests to run
  if (isProduction || isCi) {
    return true;
  }

  // Check if backend .env exists and contains development settings
  if (fs.existsSync(backendEnvPath)) {
    const envContent = fs.readFileSync(backendEnvPath, "utf8");
    if (
      envContent.includes("NODE_ENV=development") ||
      (envContent.includes("ondetemdb") &&
        !envContent.includes("ondetemdb_test"))
    ) {
      console.log(
        "⚠️  Backend appears to be configured for development environment"
      );
      return false;
    }
  }

  return true;
}

// Helper function to detect if a port is being used by Playwright test servers
function isPlaywrightTestServer(port) {
  // Check if we're in a Playwright execution context
  if (
    process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.CI ||
    process.env.E2E === "true"
  ) {
    return true;
  }

  // Check if NODE_ENV is explicitly set to test
  if (process.env.NODE_ENV === "test") {
    return true;
  }

  return false;
}

async function main() {
  console.log("🔍 E2E Test Safety Check...");

  // Check 1: Force test environment
  if (process.env.NODE_ENV !== "test") {
    console.log("🔒 Setting NODE_ENV=test for E2E tests");
    process.env.NODE_ENV = "test";
  }

  // Check 2: Look for running development servers
  const hasRunningDevServers = await checkForRunningDevServers();

  // Check 3: Environment configuration
  const envSafe = checkEnvironmentVariables();

  // Check 4: Explicit confirmation for safety
  if (hasRunningDevServers || !envSafe) {
    console.log(
      "\n🚨 SAFETY WARNING: Potential development environment detected!"
    );
    console.log("\n❌ E2E tests will:");
    console.log("   • Reset the database completely");
    console.log("   • Delete all existing data");
    console.log("   • Replace with test data only");
    console.log("\n💡 To run E2E tests safely:");
    console.log("   1. Stop all development servers (npm run dev)");
    console.log("   2. Use dedicated test environment");
    console.log("   3. Or run: npm run test:pw:force (with caution)");

    // In CI, proceed anyway
    if (process.env.CI === "true") {
      console.log("\n🤖 CI environment detected - proceeding with tests");
      return true;
    }

    // Check for force flag
    if (process.argv.includes("--force") || process.env.E2E_FORCE === "true") {
      console.log("\n⚠️  Force flag detected - proceeding despite warnings");
      return true;
    }

    console.log("\n🛑 Aborting E2E tests for safety");
    process.exit(1);
  }

  console.log("✅ Environment appears safe for E2E testing");
  return true;
}

// Export for use in other scripts
module.exports = { main, checkForRunningDevServers, checkEnvironmentVariables };

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Safety check failed:", error);
    process.exit(1);
  });
}
