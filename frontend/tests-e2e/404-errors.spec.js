import { test, expect } from "@playwright/test";

test.describe("404 Error Handling E2E", () => {
  // Use pre-seeded test user for authenticated routes testing
  const testUser = {
    email: "testuser1@example.com",
    password: "TestPassword123!",
  };

  test.beforeEach(async ({ page }) => {
    // Enable console logging to capture any errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log("PAGE ERROR:", msg.text());
      }
    });
    page.on("pageerror", (err) => {
      console.log("PAGE JAVASCRIPT ERROR:", err.message);
    });
  });

  test("Frontend handles non-existent routes gracefully", async ({ page }) => {
    // Test various non-existent frontend routes
    const nonExistentRoutes = [
      "/non-existent-page",
      "/invalid/route",
      "/admin", // Doesn't exist in this app
      "/dashboard", // Doesn't exist in this app
      "/some-random-path/with/multiple/segments",
    ];

    for (const route of nonExistentRoutes) {
      await page.goto(route);

      // Should show the custom 404 page
      await expect(page.getByText("404")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Página não encontrada")).toBeVisible();
      await expect(
        page.getByText(/a página que você está procurando não existe/i)
      ).toBeVisible();

      // Should have action buttons
      await expect(page.getByText("Voltar ao início")).toBeVisible();
      await expect(page.getByText("Criar anúncio")).toBeVisible();

      // Should have the basic app structure (Menu, etc.)
      await expect(page.locator("nav")).toBeVisible({ timeout: 10000 });

      console.log(`✓ Route ${route} shows user-friendly 404 page`);
    }
  });

  test("Frontend handles non-existent ad routes", async ({ page }) => {
    // Test non-existent ad routes that should show some form of error handling
    const nonExistentAdRoutes = [
      "/ad/view/non-existent-title/999999",
      "/ad/view/999999",
      "/ad/999999/view",
      "/ad/00000000-0000-0000-0000-000000000000/edit",
    ];

    // Login first for protected routes
    await page.goto("/login");
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button:has-text("Entrar")');
    await expect(page).toHaveURL("/");

    for (const route of nonExistentAdRoutes) {
      await page.goto(route);

      // Wait for the page to load
      await page.waitForTimeout(2000);

      // The app should handle this gracefully - either redirect or show an error message
      // but not crash
      const pageContent = await page.content();
      expect(pageContent).not.toContain("This site can't be reached");

      console.log(`✓ Ad route ${route} handled gracefully`);
    }
  });

  test("Backend API returns proper 404 for non-existent endpoints", async ({
    request,
  }) => {
    const baseURL = "http://localhost:3000";

    const nonExistentEndpoints = [
      "/api/non-existent",
      "/api/users/999999",
      "/api/ads/00000000-0000-0000-0000-000000000000",
      "/api/invalid-endpoint",
      "/api/users/invalid-id",
    ];

    for (const endpoint of nonExistentEndpoints) {
      const response = await request.get(`${baseURL}${endpoint}`);

      if (
        endpoint.includes("invalid-endpoint") ||
        endpoint.includes("non-existent")
      ) {
        // These should return 404 from Express unknownEndpoint middleware
        expect(response.status()).toBe(404);
        const body = await response.json();
        expect(body.error).toBe("unknown endpoint");
        expect(body.message).toContain("não foi encontrado no servidor");
      } else {
        // These should return 404 from the specific controller with user-friendly messages
        expect(response.status()).toBe(404);
        const body = await response.json();
        expect(body.error).toContain("not found");
        expect(body.message).toMatch(
          /não foi encontrado|verifique se.*está correto/i
        );
      }

      console.log(
        `✓ API endpoint ${endpoint} returned proper 404 with user message`
      );
    }
  });

  test("Backend middleware catches unknown endpoints", async ({ request }) => {
    const baseURL = "http://localhost:3000";

    // Test completely unknown API paths
    const unknownPaths = [
      "/api/completely-unknown",
      "/api/v2/users", // Version doesn't exist
      "/api/admin", // Admin routes don't exist
      "/unknown-path",
      "/static/non-existent-file.js",
    ];

    for (const path of unknownPaths) {
      const response = await request.get(`${baseURL}${path}`);

      expect(response.status()).toBe(404);
      const body = await response.json();
      expect(body.error).toBe("unknown endpoint");
      expect(body.message).toContain("não foi encontrado no servidor");

      console.log(
        `✓ Unknown path ${path} caught by middleware with user message`
      );
    }
  });

  test("Frontend shows user-friendly error for API failures", async ({
    page,
  }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button:has-text("Entrar")');
    await expect(page).toHaveURL("/");

    // Mock a network failure or 404 response by intercepting API calls
    await page.route("**/api/ads/**", (route) => {
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "Ad not found" }),
      });
    });

    // Try to access the home page which loads ads
    await page.goto("/");

    // The app should handle the API error gracefully
    // Either show an error message or handle it silently

    // Wait for any loading to complete
    await page.waitForTimeout(3000);

    // The page should still be functional
    await expect(page.locator('input[placeholder*="pesquisar"]')).toBeVisible();

    console.log("✓ API error handled gracefully in frontend");
  });

  test("Deep linking to non-existent resources shows appropriate feedback", async ({
    page,
  }) => {
    // Test direct navigation to non-existent resources
    await page.goto("/ad/view/completely-fake-title/999999");

    // Should not show a browser error page
    const pageContent = await page.content();
    expect(pageContent).not.toContain("This site can't be reached");

    // Should have basic app structure
    await expect(page.locator("nav")).toBeVisible({ timeout: 5000 });

    // Test another non-existent resource
    await page.goto("/user/999999");

    // Again, should handle gracefully
    expect(await page.content()).not.toContain("This site can't be reached");

    console.log("✓ Deep linking to non-existent resources handled gracefully");
  });

  test("404 page navigation buttons work correctly", async ({ page }) => {
    // Go to a non-existent page
    await page.goto("/non-existent-page");

    // Should show the 404 page
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("Página não encontrada")).toBeVisible();

    // Test "Voltar ao início" button
    await page.click('a:has-text("Voltar ao início")');
    await expect(page).toHaveURL("/");

    // Go back to 404 page
    await page.goto("/another-non-existent-page");
    await expect(page.getByText("404")).toBeVisible();

    // Test "Criar anúncio" button (should redirect to login if not authenticated)
    await page.click('a:has-text("Criar anúncio")');
    // Should either go to /ad (if authenticated) or /login
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(
      currentUrl.includes("/ad") || currentUrl.includes("/login")
    ).toBeTruthy();

    console.log("✓ 404 page navigation buttons work correctly");
  });
});
