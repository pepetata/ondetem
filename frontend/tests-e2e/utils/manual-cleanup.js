const { request } = require("@playwright/test");
const TestCleanup = require("./cleanup.js");

async function manualCleanup() {
  console.log("🧹 Running manual test data cleanup...");

  const cleanup = new TestCleanup();
  await cleanup.cleanupViaAPI();

  console.log("✅ Manual cleanup completed");
}

// Run if called directly
if (require.main === module) {
  manualCleanup().catch(console.error);
}

module.exports = manualCleanup;
