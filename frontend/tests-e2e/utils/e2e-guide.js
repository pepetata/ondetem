#!/usr/bin/env node

/**
 * E2E Test Warning and Guide
 * Provides clear guidance on running E2E tests safely
 */

const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function printBanner() {
  console.log(colors.cyan + colors.bold);
  console.log(
    "╔══════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║                  🛡️  E2E TEST SAFETY GUIDE                   ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝"
  );
  console.log(colors.reset);
}

function printWarning() {
  console.log(
    colors.red + colors.bold + "⚠️  IMPORTANT:" + colors.reset + colors.red
  );
  console.log("E2E tests will COMPLETELY RESET your database!");
  console.log("All existing data will be PERMANENTLY DELETED!");
  console.log(colors.reset);
}

function printSafeWorkflow() {
  console.log(
    colors.green + colors.bold + "✅ SAFE E2E TESTING WORKFLOW:" + colors.reset
  );
  console.log("");
  console.log(
    colors.yellow + "1. Stop all development servers:" + colors.reset
  );
  console.log('   • Stop frontend: Ctrl+C in terminal running "npm run dev"');
  console.log(
    "   • Stop backend: Ctrl+C in terminal running backend dev server"
  );
  console.log("");
  console.log(
    colors.yellow + "2. Run E2E tests with safety checks:" + colors.reset
  );
  console.log(
    "   npm run test:pw          # Run all E2E tests (with safety checks)"
  );
  console.log(
    "   npm run test:pw:ui       # Run with UI mode (with safety checks)"
  );
  console.log(
    "   npm run test:pw:html     # Run with HTML report (with safety checks)"
  );
  console.log("");
  console.log(
    colors.yellow + "3. Emergency override (USE WITH CAUTION):" + colors.reset
  );
  console.log("   npm run test:pw:force    # Skip safety checks (DANGEROUS!)");
  console.log("");
}

function printDatabaseInfo() {
  console.log(
    colors.blue + colors.bold + "🗄️  DATABASE INFORMATION:" + colors.reset
  );
  console.log("");
  console.log("Development DB: ondetemdb (your working data)");
  console.log("Test DB:       ondetemdb_test (reset by E2E tests)");
  console.log("");
  console.log("E2E tests automatically use the test database, but safety");
  console.log("checks prevent accidental execution against development data.");
  console.log("");
}

function printTips() {
  console.log(colors.magenta + colors.bold + "💡 TIPS:" + colors.reset);
  console.log("");
  console.log("• Always backup your development database before testing");
  console.log("• Use separate terminal windows for dev and testing");
  console.log("• Check which servers are running before starting E2E tests");
  console.log(
    "• In CI/CD environments, safety checks are automatically bypassed"
  );
  console.log("");
}

function main() {
  printBanner();
  printWarning();
  printSafeWorkflow();
  printDatabaseInfo();
  printTips();

  console.log(colors.cyan + "📚 For more information, see:" + colors.reset);
  console.log("   frontend/tests-e2e/README.md");
  console.log("");
}

if (require.main === module) {
  main();
}

module.exports = { main };
