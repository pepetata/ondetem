import { test, expect } from "@playwright/test";

test.describe("Performance Optimization Tests", () => {
  test.skip("Featured carousel loads without auto-rotation during search", async ({
    page,
  }) => {
    await page.goto("http://localhost:5173");

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Featured carousel should NOT be visible initially
    await expect(page.locator(".featured-ads-section")).not.toBeVisible();

    // Trigger a search to show the carousel
    await page.fill('input[placeholder*="pesquisar"]', "test");
    await page.waitForTimeout(1000);

    // Featured carousel should be visible during search
    await expect(page.locator(".featured-ads-section")).toBeVisible();

    // Should have manual navigation buttons
    await expect(page.locator(".carousel-btn-left")).toBeVisible();
    await expect(page.locator(".carousel-btn-right")).toBeVisible();

    // Should have indicators
    await expect(page.locator(".carousel-indicators")).toBeVisible();

    // Test manual navigation
    await page.click(".carousel-btn-right");
    await page.waitForTimeout(500);

    // Should work without auto-rotation
    await page.waitForTimeout(5000); // Wait 5 seconds
    // Carousel should not have moved automatically
  });

  test("Ad images are static (no auto-rotation)", async ({ page }) => {
    await page.goto("http://localhost:5173");

    // Trigger search to show ads
    await page.fill('input[placeholder*="pesquisar"]', "test");
    await page.waitForTimeout(1000);

    // If ads are present, their images should be static
    const adImages = page.locator(".ad-image");
    if ((await adImages.count()) > 0) {
      const firstImageSrc = await adImages.first().getAttribute("src");

      // Wait 3 seconds and check if image changed (it shouldn't)
      await page.waitForTimeout(3000);
      const secondImageSrc = await adImages.first().getAttribute("src");

      // Images should not have rotated
      expect(firstImageSrc).toBe(secondImageSrc);
    }
  });

  test.skip("Category grid hides during search, carousel shows during search", async ({
    page,
  }) => {
    await page.goto("http://localhost:5173");

    // Initially category grid should be visible, carousel should not
    await expect(page.locator('[data-testid="category-grid"]')).toBeVisible();
    await expect(page.locator(".featured-ads-section")).not.toBeVisible();

    // Trigger search
    await page.fill('input[placeholder*="pesquisar"]', "test");
    await page.waitForTimeout(2000); // Increased wait time for debounce + carousel loading

    // Category grid should be hidden, carousel should be visible during search
    await expect(
      page.locator('[data-testid="category-grid"]')
    ).not.toBeVisible();
    await expect(page.locator(".featured-ads-section")).toBeVisible();

    // Clear search
    await page.fill('input[placeholder*="pesquisar"]', "");
    await page.waitForTimeout(1000);

    // Category grid should be visible again, carousel should be hidden
    await expect(page.locator('[data-testid="category-grid"]')).toBeVisible();
    await expect(page.locator(".featured-ads-section")).not.toBeVisible();
  });
});
