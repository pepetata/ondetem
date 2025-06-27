#!/usr/bin/env node

// Standalone test of the safety check to debug the issue
const { main: runSafetyCheck } = require("./tests-e2e/utils/safety-check");

async function testSafetyCheck() {
  console.log("🧪 Testing safety check in isolation...");

  try {
    await runSafetyCheck();
    console.log("✅ Safety check passed successfully");
    return true;
  } catch (error) {
    console.error("❌ Safety check failed:", error.message);
    return false;
  }
}

testSafetyCheck()
  .then((result) => {
    console.log(`\n🎯 Result: ${result ? "PASSED" : "FAILED"}`);
    process.exit(result ? 0 : 1);
  })
  .catch((error) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
