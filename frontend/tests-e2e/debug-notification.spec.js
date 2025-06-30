import { test, expect } from "@playwright/test";

test.describe("Debug Notifications", () => {
  test("Debug ad creation notifications", async ({ page }) => {
    // Enable console logging
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    page.on("pageerror", (error) => console.log("PAGE ERROR:", error.message));

    // Login
    await page.goto("/login");
    await page.fill('input[name="email"]', "testuser1@example.com");
    await page.fill('input[name="password"]', "TestPassword123!");
    await page.click('button:has-text("Entrar")');
    await expect(page).toHaveURL("/");

    // Navigate to create ad
    await page.goto("/ad");

    // Fill form
    await page.fill('input[name="title"]', "Debug Notification Test");
    await page.fill('input[name="short"]', "Debug short");
    await page.fill('textarea[name="description"]', "Debug description");

    // Switch to contact tab and fill required fields
    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "debug@example.com");

    // Check all notifications before clicking
    console.log("Before click - checking for existing notifications...");
    const notificationsBefore = await page.locator(".notification").count();
    console.log(`Found ${notificationsBefore} notifications before click`);

    // Click save and wait
    await page.click('button:has-text("Gravar")');

    // Wait a bit for any animations/state updates
    await page.waitForTimeout(3000);

    // Check what notifications exist
    const notificationsAfter = await page.locator(".notification").count();
    console.log(`Found ${notificationsAfter} notifications after click`);

    // Check for any elements containing "sucesso"
    const successElements = await page.locator('*:has-text("sucesso")').count();
    console.log(`Found ${successElements} elements containing "sucesso"`);

    // Check for any elements containing "criado"
    const criadoElements = await page.locator('*:has-text("criado")').count();
    console.log(`Found ${criadoElements} elements containing "criado"`);

    // Check all text on page containing "Anúncio"
    const anuncioElements = await page.locator('*:has-text("Anúncio")').count();
    console.log(`Found ${anuncioElements} elements containing "Anúncio"`);

    // Wait for URL change
    await page.waitForTimeout(2000);
    console.log(`Current URL: ${page.url()}`);

    // Take screenshot for debugging
    await page.screenshot({ path: "debug-notifications.png" });
  });
});
