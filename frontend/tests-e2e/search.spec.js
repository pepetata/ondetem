import { test, expect } from "@playwright/test";

test.describe("Search Functionality E2E", () => {
  // Use pre-seeded test user (no dynamic creation needed)
  const testUser = {
    email: "testuser1@example.com", // This user is pre-seeded
    password: "TestPassword123!", // Correct password from seed data
  };

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button:has-text("Entrar")');
    await expect(page).toHaveURL("/");
  });

  test("Home page displays search bar and category grid initially", async ({
    page,
  }) => {
    await page.goto("/");

    // Check search bar is visible
    await expect(page.locator('input[placeholder*="pesquisar"]')).toBeVisible();

    // Check that category grid is visible initially
    await expect(page.locator('[data-testid="category-grid"]')).toBeVisible();

    // Featured carousel should NOT be visible initially (only appears during search)
    await expect(page.locator(".featured-ads-section")).not.toBeVisible();

    // Check all 6 category images are present
    const categoryImages = page.locator('[data-testid="category-image"]');
    await expect(categoryImages).toHaveCount(6);

    // Verify specific category images
    await expect(page.locator('img[src*="beautyshop.png"]')).toBeVisible();
    await expect(page.locator('img[src*="bussiness.jpg"]')).toBeVisible();
    await expect(page.locator('img[src*="food.jpg"]')).toBeVisible();
    await expect(page.locator('img[src*="furniture.jpg"]')).toBeVisible();
    await expect(page.locator('img[src*="matconstrucao.jpg"]')).toBeVisible();
    await expect(page.locator('img[src*="pet.jpg"]')).toBeVisible();
  });

  test("Category image click triggers search", async ({ page }) => {
    await page.goto("/");

    // Click on beauty category (should search for "beleza")
    await page.click('img[src*="beautyshop.png"]');

    // Wait for search to be triggered
    await page.waitForTimeout(1000);

    // Check that search input has "beleza" value
    await expect(page.locator('input[placeholder*="pesquisar"]')).toHaveValue(
      "beleza"
    );

    // Category grid should be hidden during search
    await expect(
      page.locator('[data-testid="category-grid"]')
    ).not.toBeVisible();

    // Search results section should be visible
    await expect(page.locator(".search-results-section")).toBeVisible();

    // Should show "Pesquisando por: beleza" message
    await expect(page.getByText(/pesquisando por.*beleza/i)).toBeVisible();
  });

  test("Text search functionality works", async ({ page }) => {
    await page.goto("/");

    // Type in search box
    await page.fill('input[placeholder*="pesquisar"]', "móveis");

    // Wait for debounced search
    await page.waitForTimeout(1000);

    // Category grid should be hidden
    await expect(
      page.locator('[data-testid="category-grid"]')
    ).not.toBeVisible();

    // Search results should be visible
    await expect(page.locator(".search-results-section")).toBeVisible();

    // Should show search info
    await expect(page.getByText(/pesquisando por.*móveis/i)).toBeVisible();
  });

  test("Clearing search shows categories again", async ({ page }) => {
    await page.goto("/");

    // Perform search first
    await page.fill('input[placeholder*="pesquisar"]', "teste");
    await page.waitForTimeout(1000);

    // Verify search state
    await expect(
      page.locator('[data-testid="category-grid"]')
    ).not.toBeVisible();
    await expect(page.locator(".search-results-section")).toBeVisible();

    // Clear search
    await page.fill('input[placeholder*="pesquisar"]', "");
    await page.waitForTimeout(1000);

    // Categories should be visible again
    await expect(page.locator('[data-testid="category-grid"]')).toBeVisible();

    // Search results should be hidden
    await expect(page.locator(".search-results-section")).not.toBeVisible();
  });

  test("Search shows 'no results' message when appropriate", async ({
    page,
  }) => {
    await page.goto("/");

    // Search for something that definitely won't exist
    await page.fill(
      'input[placeholder*="pesquisar"]',
      "palavrachaveimpossivel12345"
    );
    await page.waitForTimeout(1000);

    // Should show no results message
    await expect(page.getByText(/não encontramos anúncios/i)).toBeVisible();

    // Categories should still be hidden
    await expect(page.locator(".category-grid")).not.toBeVisible();
  });

  test("Search results display correctly", async ({ page }) => {
    // Use pre-seeded ad instead of creating new one
    await page.goto("/");
    await page.fill('input[placeholder*="pesquisar"]', "favoritar");
    await page.waitForTimeout(1000);

    // Should find the pre-seeded ad
    await expect(page.getByText("Anúncio para Favoritar")).toBeVisible();

    // Should show search info
    await expect(page.getByText(/pesquisando por.*favoritar/i)).toBeVisible();
  });

  // Test responsive behavior
  test("Search works on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    // Search bar should still be visible on mobile
    await expect(page.locator('input[placeholder*="pesquisar"]')).toBeVisible();

    // Category grid should adapt to mobile (2 columns instead of 3)
    await expect(page.locator('[data-testid="category-grid"]')).toBeVisible();

    // Perform search
    await page.fill('input[placeholder*="pesquisar"]', "teste");
    await page.waitForTimeout(1000);

    // Categories should be hidden, search results visible
    await expect(
      page.locator('[data-testid="category-grid"]')
    ).not.toBeVisible();
    await expect(page.locator(".search-results-section")).toBeVisible();
  });
});
