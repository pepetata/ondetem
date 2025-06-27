/**
 * Backend Database Safety Check
 * Ensures E2E tests only run against test database
 */

const path = require("path");
const fs = require("fs");

function checkDatabaseEnvironment() {
  const envPath = path.join(__dirname, "../.env");
  const envTestPath = path.join(__dirname, "../.env.test");

  // Force test environment
  if (process.env.NODE_ENV !== "test") {
    console.log("🔒 Backend: Setting NODE_ENV=test");
    process.env.NODE_ENV = "test";
  }

  // Check for test database configuration
  if (fs.existsSync(envTestPath)) {
    console.log("✅ Backend: Found .env.test file");
    return true;
  }

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");

    // Check if production database is configured
    if (envContent.includes("DATABASE_URL") && !envContent.includes("test")) {
      console.error("🚨 Backend: Production database detected in .env");
      console.error("📋 Create .env.test with test database configuration");
      return false;
    }

    // Check for development database without test suffix
    if (
      envContent.includes("DB_NAME=ondetemdb") &&
      !envContent.includes("DB_NAME=ondetemdb_test")
    ) {
      console.error("🚨 Backend: Development database detected");
      console.error("📋 E2E tests require test database (ondetemdb_test)");
      return false;
    }
  }

  return true;
}

function validateEnvironment() {
  console.log("🔍 Backend: Checking database configuration...");

  if (!checkDatabaseEnvironment()) {
    console.error("💥 Backend: Database environment check failed");
    process.exit(1);
  }

  console.log("✅ Backend: Database environment is safe for testing");
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateEnvironment();
}

module.exports = { checkDatabaseEnvironment, validateEnvironment };
