import { test, expect } from "@playwright/test";

test.describe("Debug Ad Creation", () => {
  const testUser = {
    email: "testuser1@example.com",
    password: "TestPassword123!",
  };

  test("Debug login and token storage", async ({ page }) => {
    // Enable console logging
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

    // Login
    await page.goto("/login");
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button:has-text("Entrar")');
    await expect(page).toHaveURL("/");

    // Check if token is stored
    const token = await page.evaluate(() => {
      return (
        localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
      );
    });
    console.log("Stored token:", token);

    // Check Redux state
    const reduxState = await page.evaluate(() => {
      return window.__REDUX_DEVTOOLS_EXTENSION__
        ? window.store.getState()
        : "Redux state not available";
    });
    console.log("Redux state:", JSON.stringify(reduxState, null, 2));

    // Try to access ad creation page
    await page.goto("/ad");
    await page.waitForTimeout(1000);

    // Fill the form
    await page.fill('input[name="title"]', "Debug Test Ad");
    await page.fill('input[name="short"]', "Short description");
    await page.fill('textarea[name="description"]', "Full description");

    // Switch to contact tab
    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "debug@example.com");

    // Before clicking save, check token again
    const tokenBeforeSave = await page.evaluate(() => {
      return (
        localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
      );
    });
    console.log("Token before save:", tokenBeforeSave);

    // Click save and wait for network activity
    await page.click('button:has-text("Gravar")');

    // Wait and see what happens
    await page.waitForTimeout(3000);

    // Check for any error messages
    const errorElements = await page.locator('text*="Error"').all();
    for (const element of errorElements) {
      const text = await element.textContent();
      console.log("Error found:", text);
    }
  });
});
