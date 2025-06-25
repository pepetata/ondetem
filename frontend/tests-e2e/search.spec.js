import { test, expect } from "@playwright/test";

test.describe("Search Functionality E2E", () => {
  let testUserId;
  const testUser = {
    email: "searchtest@example.com",
    password: "testpassword123",
    fullName: "Search Test User",
    nickname: "SearchTest",
  };

  // Test ad data for search
  const testAd = {
    title: "Produto de Teste para Busca",
    short: "Descrição breve do produto",
    description:
      "Descrição completa do produto para teste de busca com palavras chave específicas beleza móveis construção",
    zipcode: "01001000",
    phone1: "11999999999",
    email: "searchtest@example.com",
  };

  test.beforeAll(async ({ request }) => {
    console.log(`Creating search test user: ${testUser.email}`);
    const res = await request.post("http://localhost:3000/api/users", {
      data: testUser,
    });

    if (res.ok()) {
      const userData = await res.json();
      testUserId = userData.id;
      console.log(`✅ Created search test user with ID: ${testUserId}`);
    } else {
      console.log(`⚠️ Search user creation response: ${res.status()}`);
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
          console.log(`✅ Cleaned up search test user: ${testUserId}`);
        }
      } catch (error) {
        console.log(`⚠️ Could not cleanup search test user: ${error.message}`);
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

  test("Home page displays search bar and category grid initially", async ({
    page,
  }) => {
    await page.goto("/");

    // Check search bar is visible
    await expect(page.locator('input[placeholder*="pesquisar"]')).toBeVisible();

    // Check that category grid is visible initially
    await expect(page.locator('[data-testid="category-grid"]')).toBeVisible();

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

    // Create a test ad first
    await page.goto("/ad");
    await page.fill('input[name="title"]', testAd.title);
    await page.fill('input[name="short"]', testAd.short);
    await page.fill('textarea[name="description"]', testAd.description);

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', testAd.zipcode);
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', testAd.phone1);
    await page.fill('input[name="email"]', testAd.email);
    await page.click('button:has-text("Gravar")');
    await expect(page.getByText(/anúncio criado com sucesso/i)).toBeVisible();

    // Go back to home
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
    await expect(page.getByText(/nenhum anúncio encontrado/i)).toBeVisible();

    // Categories should still be hidden
    await expect(page.locator(".category-grid")).not.toBeVisible();
  });

  test("Search results display correctly", async ({ page }) => {
    // First create a searchable ad
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Produto Especial de Teste");
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Produto especial para testes de busca"
    );

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "test@example.com");
    await page.click('button:has-text("Gravar")');
    await expect(page.getByText(/anúncio criado com sucesso/i)).toBeVisible();

    // Go to home and search
    await page.goto("/");
    await page.fill('input[placeholder*="pesquisar"]', "especial");
    await page.waitForTimeout(1000);

    // Should find the ad
    await expect(page.getByText("Produto Especial de Teste")).toBeVisible();

    // Should show search info
    await expect(page.getByText(/pesquisando por.*especial/i)).toBeVisible();
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
