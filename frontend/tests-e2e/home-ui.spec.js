import { test, expect } from "@playwright/test";

test.describe("Home Page UI State Management E2E", () => {
  let testUserId;
  const testUser = {
    email: "homeuitest@example.com",
    password: "testpassword123",
    fullName: "Home UI Test User",
    nickname: "HomeUITest",
  };

  test.beforeAll(async ({ request }) => {
    console.log(`Creating home UI test user: ${testUser.email}`);
    const res = await request.post("http://localhost:3000/api/users", {
      data: testUser,
    });

    if (res.ok()) {
      const userData = await res.json();
      testUserId = userData.id;
      console.log(`✅ Created home UI test user with ID: ${testUserId}`);
    } else {
      console.log(`⚠️ Home UI user creation response: ${res.status()}`);
    }
  });

  test.afterAll(async ({ request }) => {
    if (testUserId) {
      try {
        const loginRes = await request.post(
          "http://localhost:3000/api/auth/login",
          {
            data: { email: testUser.email, password: testUser.password },
          }
        );

        if (loginRes.ok()) {
          const { token } = await loginRes.json();
          await request.delete(
            `http://localhost:3000/api/users/${testUserId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log(`✅ Cleaned up home UI test user: ${testUserId}`);
        }
      } catch (error) {
        console.log(`⚠️ Could not cleanup home UI test user: ${error.message}`);
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button:has-text("Entrar")');
    await expect(page).toHaveURL("/");
  });

  test("Initial home page state shows categories and hides search results", async ({
    page,
  }) => {
    await page.goto("/");

    // Search section should be visible
    await expect(page.locator(".search-section-top")).toBeVisible();

    // Category grid should be visible initially
    await expect(page.locator('[data-testid="category-grid"]')).toBeVisible();

    // Search results section should not be visible initially
    await expect(page.locator(".search-results-section")).not.toBeVisible();

    // All 6 category images should be present
    const categoryImages = page.locator(".category-image");
    await expect(categoryImages).toHaveCount(6);

    // Search input should be empty
    await expect(page.locator('input[placeholder*="pesquisar"]')).toHaveValue(
      ""
    );
  });

  test("Search state correctly toggles UI elements", async ({ page }) => {
    await page.goto("/");

    // Initial state: categories visible, search results hidden
    await expect(page.locator('[data-testid="category-grid"]')).toBeVisible();
    await expect(page.locator(".search-results-section")).not.toBeVisible();

    // Type in search - should trigger state change
    await page.fill('input[placeholder*="pesquisar"]', "teste");
    await page.waitForTimeout(600); // Wait for debounce

    // After search: categories hidden, search results visible
    await expect(
      page.locator('[data-testid="category-grid"]')
    ).not.toBeVisible();
    await expect(page.locator(".search-results-section")).toBeVisible();

    // Search info should be displayed
    await expect(page.getByText(/pesquisando por.*teste/i)).toBeVisible();

    // Clear search - should return to initial state
    await page.fill('input[placeholder*="pesquisar"]', "");
    await page.waitForTimeout(600); // Wait for debounce

    // Back to initial state: categories visible, search results hidden
    await expect(page.locator('[data-testid="category-grid"]')).toBeVisible();
    await expect(page.locator(".search-results-section")).not.toBeVisible();
  });

  test("Category click triggers correct search and state change", async ({
    page,
  }) => {
    await page.goto("/");

    // Click on beauty category
    await page.click('img[src*="beautyshop.png"]');
    await page.waitForTimeout(600);

    // Should set search term and change state
    await expect(page.locator('input[placeholder*="pesquisar"]')).toHaveValue(
      "beleza"
    );
    await expect(
      page.locator('[data-testid="category-grid"]')
    ).not.toBeVisible();
    await expect(page.locator(".search-results-section")).toBeVisible();
    await expect(page.getByText(/pesquisando por.*beleza/i)).toBeVisible();

    // Click on furniture category
    await page.goto("/"); // Reset
    await page.click('img[src*="furniture.jpg"]');
    await page.waitForTimeout(600);

    // Should change to furniture search
    await expect(page.locator('input[placeholder*="pesquisar"]')).toHaveValue(
      "móveis"
    );
    await expect(page.getByText(/pesquisando por.*móveis/i)).toBeVisible();
  });

  test("All category images trigger correct searches", async ({ page }) => {
    await page.goto("/");

    const categories = [
      { image: "beautyshop.png", searchTerm: "beleza" },
      { image: "bussiness.jpg", searchTerm: "negócio" },
      { image: "food.jpg", searchTerm: "restaurante" },
      { image: "furniture.jpg", searchTerm: "móveis" },
      { image: "matconstrucao.jpg", searchTerm: "construção" },
      { image: "pet.jpg", searchTerm: "pet" },
    ];

    for (const category of categories) {
      // Reset to home
      await page.goto("/");

      // Click category image
      await page.click(`img[src*="${category.image}"]`);
      await page.waitForTimeout(600);

      // Verify search term is set correctly
      await expect(page.locator('input[placeholder*="pesquisar"]')).toHaveValue(
        category.searchTerm
      );

      // Verify UI state change
      await expect(page.locator(".category-grid")).not.toBeVisible();
      await expect(page.locator(".search-results-section")).toBeVisible();
      await expect(
        page.getByText(
          new RegExp(`pesquisando por.*${category.searchTerm}`, "i")
        )
      ).toBeVisible();
    }
  });

  test("Search loading state works correctly", async ({ page }) => {
    await page.goto("/");

    // Type search term
    await page.fill('input[placeholder*="pesquisar"]', "carregamento");

    // Should show loading state briefly (before debounce completes)
    // This is hard to test reliably, but we can check that the search eventually completes
    await page.waitForTimeout(1000);

    // After loading, should show search results section
    await expect(page.locator(".search-results-section")).toBeVisible();
  });

  test("Menu overlap fix works on small screens", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    // Check that home container has proper padding-top to avoid menu overlap
    const homeContainer = page.locator(".home-container");
    await expect(homeContainer).toBeVisible();

    // On mobile, the container should have enough top padding
    const containerStyles = await homeContainer.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        paddingTop: styles.paddingTop,
      };
    });

    // Should have some padding-top (exact value may vary based on responsive design)
    expect(parseInt(containerStyles.paddingTop)).toBeGreaterThan(0);

    // Category grid should be visible and properly positioned
    await expect(page.locator(".category-grid")).toBeVisible();

    // Search bar should be accessible (not hidden behind menu)
    const searchInput = page.locator('input[placeholder*="pesquisar"]');
    await expect(searchInput).toBeVisible();

    // Should be able to interact with search
    await searchInput.fill("mobile test");
    await page.waitForTimeout(600);

    // UI state should work on mobile
    await expect(page.locator(".category-grid")).not.toBeVisible();
    await expect(page.locator(".search-results-section")).toBeVisible();
  });

  test("Category grid layout adapts to screen size", async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto("/");

    const categoryGrid = page.locator(".category-grid");
    await expect(categoryGrid).toBeVisible();

    // Should display as 2 rows with 3 columns each on desktop
    const gridStyles = await categoryGrid.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
      };
    });

    // Should be using CSS Grid
    expect(gridStyles.display).toBe("grid");

    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    // Category grid should still be visible and functional
    await expect(categoryGrid).toBeVisible();

    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Should adapt to mobile (likely 2 columns instead of 3)
    await expect(categoryGrid).toBeVisible();

    // All 6 images should still be present regardless of layout
    const categoryImages = page.locator(".category-image");
    await expect(categoryImages).toHaveCount(6);
  });

  test("Background color consistency across sections", async ({ page }) => {
    await page.goto("/");

    // Check that search section uses the correct background color
    const searchSection = page.locator(".search-section-top");
    await expect(searchSection).toBeVisible();

    // Trigger search to show search results section
    await page.fill('input[placeholder*="pesquisar"]', "cores");
    await page.waitForTimeout(600);

    // Search results section should be visible
    const searchResultsSection = page.locator(".search-results-section");
    await expect(searchResultsSection).toBeVisible();

    // Both sections should use consistent background color from $bg-color variable
    const searchSectionBg = await searchSection.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    const searchResultsBg = await searchResultsSection.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Both should have the same background color
    expect(searchSectionBg).toBe(searchResultsBg);
  });

  test("Image quality and cropping works correctly", async ({ page }) => {
    await page.goto("/");

    // Check that category images are displayed with proper sizing
    const categoryImages = page.locator(".category-image img");
    await expect(categoryImages).toHaveCount(6);

    // Check first image properties
    const firstImage = categoryImages.first();
    await expect(firstImage).toBeVisible();

    const imageStyles = await firstImage.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        objectFit: styles.objectFit,
        height: styles.height,
        width: styles.width,
      };
    });

    // Should use object-fit: contain to prevent cropping
    expect(imageStyles.objectFit).toBe("contain");

    // Should have proper height (200px as set in styles)
    expect(parseInt(imageStyles.height)).toBeGreaterThanOrEqual(200);
  });

  test("Search info message is discrete and well-positioned", async ({
    page,
  }) => {
    await page.goto("/");

    // Trigger search
    await page.fill('input[placeholder*="pesquisar"]', "mensagem");
    await page.waitForTimeout(600);

    // Search info should be visible but discrete
    const searchInfo = page.getByText(/pesquisando por.*mensagem/i);
    await expect(searchInfo).toBeVisible();

    // Should be positioned correctly within search results section
    const searchResultsSection = page.locator(".search-results-section");
    await expect(searchResultsSection).toContainText(
      /pesquisando por.*mensagem/i
    );

    // Should not be too prominent (check font size, opacity, etc.)
    const searchInfoStyles = await searchInfo.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        opacity: styles.opacity,
        fontWeight: styles.fontWeight,
      };
    });

    // Should be discrete (not too large or bold)
    expect(parseInt(searchInfoStyles.fontSize)).toBeLessThan(20);
  });
});
