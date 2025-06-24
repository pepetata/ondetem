const { chromium } = require("@playwright/test");
const TestCleanup = require("./utils/cleanup.js");

async function globalTeardown() {
  console.log("🧹 Running global test cleanup...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login to get access
    console.log("🔑 Attempting to login for cleanup...");
    await page.goto("http://localhost:5173/login", { timeout: 10000 });

    await page.fill('input[name="email"]', "testuser@example.com");
    await page.fill('input[name="password"]', "testpassword123");
    await page.click('button:has-text("Entrar")');

    // Wait for navigation with a longer timeout and better error handling
    try {
      await page.waitForURL("/", { timeout: 15000 });
      console.log("✅ Login successful, proceeding with UI cleanup...");

      // Run cleanup
      const cleanup = new TestCleanup();
      await cleanup.cleanupAllTestData(page);

      console.log("✅ Global cleanup completed");
    } catch (navError) {
      console.warn(
        "⚠️ Navigation timeout after login, falling back to API cleanup..."
      );
      // Fallback to API cleanup if UI cleanup failed
      const cleanup = new TestCleanup();
      await cleanup.cleanupViaAPI();
    }
  } catch (error) {
    console.error("❌ Global cleanup failed:", error.message);
    // Fallback to API cleanup as last resort
    try {
      console.log("🔄 Attempting API cleanup as fallback...");
      const cleanup = new TestCleanup();
      await cleanup.cleanupViaAPI();
    } catch (apiError) {
      console.error("❌ Even API cleanup failed:", apiError.message);
    }
  } finally {
    await browser.close();
  }
}

module.exports = globalTeardown;
