import { test, expect } from "@playwright/test";

test.describe("Feature Integration E2E", () => {
  let testUserId;
  const testUser = {
    email: "integrationtest@example.com",
    password: "testpassword123",
    fullName: "Integration Test User",
    nickname: "IntegrationTest",
  };

  test.beforeAll(async ({ request }) => {
    console.log(`Creating integration test user: ${testUser.email}`);
    const res = await request.post("http://localhost:3000/api/users", {
      data: testUser,
    });

    if (res.ok()) {
      const userData = await res.json();
      testUserId = userData.id;
      console.log(`✅ Created integration test user with ID: ${testUserId}`);
    } else {
      console.log(`⚠️ Integration user creation response: ${res.status()}`);
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
          console.log(`✅ Cleaned up integration test user: ${testUserId}`);
        }
      } catch (error) {
        console.log(
          `⚠️ Could not cleanup integration test user: ${error.message}`
        );
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

  test("Complete user journey: search, view ad, favorite, comment", async ({
    page,
  }) => {
    // Create a test ad first
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Produto Completo para Teste");
    await page.fill(
      'input[name="short"]',
      "Produto para jornada completa do usuário"
    );
    await page.fill(
      'textarea[name="description"]',
      "Descrição detalhada do produto para teste de jornada completa incluindo palavras como beleza móveis construção"
    );

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "complete@example.com");
    await page.click('button:has-text("Gravar")');
    await expect(page.getByText(/anúncio criado com sucesso/i)).toBeVisible();

    // Step 1: Start from home page
    await page.goto("/");
    await expect(page.locator(".category-grid")).toBeVisible();

    // Step 2: Use category-based search
    await page.click('img[src*="beautyshop.png"]');
    await page.waitForTimeout(600);

    // Should trigger search for "beleza"
    await expect(page.locator('input[placeholder*="pesquisar"]')).toHaveValue(
      "beleza"
    );
    await expect(page.locator(".search-results-section")).toBeVisible();

    // Step 3: Refine search with text input
    await page.fill('input[placeholder*="pesquisar"]', "completo");
    await page.waitForTimeout(600);

    // Should find our test ad
    await expect(page.getByText("Produto Completo para Teste")).toBeVisible();

    // Step 4: Add to favorites from search results
    const favoriteButton = page.locator(".favorite-btn").first();
    await favoriteButton.click();
    await expect(page.getByText(/adicionado aos favoritos/i)).toBeVisible();
    await expect(favoriteButton).toHaveClass(/favorited/);

    // Step 5: Click to view ad details
    await page.getByText("Produto Completo para Teste").click();
    await expect(page).toHaveURL(/\/ad\/view\//);

    // Step 6: Verify favorite status persists in detail view
    const detailFavoriteButton = page.locator(".favorite-btn");
    await expect(detailFavoriteButton).toHaveClass(/favorited/);

    // Step 7: Add a comment
    const commentInput = page.locator(
      'textarea[placeholder*="comentário"], textarea[name="comment"], input[placeholder*="comentário"]'
    );
    await commentInput.fill(
      "Excelente produto! Muito interessante para este teste completo."
    );

    const submitButton = page
      .locator(
        'button:has-text("Enviar"), button:has-text("Comentar"), button[type="submit"]'
      )
      .first();
    await submitButton.click();

    // Should see the comment
    await expect(
      page.getByText(
        "Excelente produto! Muito interessante para este teste completo."
      )
    ).toBeVisible();
    await expect(page.getByText("IntegrationTest")).toBeVisible();

    // Step 8: Remove from favorites
    await detailFavoriteButton.click();
    await expect(page.getByText(/removido dos favoritos/i)).toBeVisible();
    await expect(detailFavoriteButton).not.toHaveClass(/favorited/);

    // Step 9: Go back to home to verify state
    await page.goto("/");

    // Should return to category view
    await expect(page.locator(".category-grid")).toBeVisible();
    await expect(page.locator(".search-results-section")).not.toBeVisible();
    await expect(page.locator('input[placeholder*="pesquisar"]')).toHaveValue(
      ""
    );
  });

  test("Search with multiple categories and verify favorites persist", async ({
    page,
  }) => {
    // Create ads in different categories
    const adsToCreate = [
      {
        title: "Produto de Beleza Premium",
        description: "Produto de beleza alta qualidade para cuidados especiais",
        email: "beauty@example.com",
      },
      {
        title: "Móvel Moderno Design",
        description: "Móveis modernos para decoração contemporânea",
        email: "furniture@example.com",
      },
      {
        title: "Material de Construção",
        description: "Materiais de construção para obras residenciais",
        email: "construction@example.com",
      },
    ];

    for (const ad of adsToCreate) {
      await page.goto("/ad");
      await page.fill('input[name="title"]', ad.title);
      await page.fill('input[name="short"]', "Breve descrição");
      await page.fill('textarea[name="description"]', ad.description);

      await page.click('button[role="tab"]:has-text("Contato")');
      await page.fill('input[name="zipcode"]', "01001000");
      await page.locator('input[name="zipcode"]').blur();
      await page.fill('input[name="phone1"]', "11999999999");
      await page.fill('input[name="email"]', ad.email);
      await page.click('button:has-text("Gravar")');
      await expect(page.getByText(/anúncio criado com sucesso/i)).toBeVisible();
    }

    // Test different category searches and favorites
    await page.goto("/");

    // Search beauty category
    await page.click('img[src*="beautyshop.png"]');
    await page.waitForTimeout(600);

    // Should find beauty product
    await expect(page.getByText("Produto de Beleza Premium")).toBeVisible();

    // Add to favorites
    let favoriteButton = page.locator(".favorite-btn").first();
    await favoriteButton.click();
    await expect(page.getByText(/adicionado aos favoritos/i)).toBeVisible();

    // Search furniture category
    await page.goto("/");
    await page.click('img[src*="furniture.jpg"]');
    await page.waitForTimeout(600);

    // Should find furniture product
    await expect(page.getByText("Móvel Moderno Design")).toBeVisible();

    // Add to favorites
    favoriteButton = page.locator(".favorite-btn").first();
    await favoriteButton.click();
    await expect(page.getByText(/adicionado aos favoritos/i)).toBeVisible();

    // Go back to beauty search and verify favorite status persists
    await page.goto("/");
    await page.click('img[src*="beautyshop.png"]');
    await page.waitForTimeout(600);

    favoriteButton = page.locator(".favorite-btn").first();
    await expect(favoriteButton).toHaveClass(/favorited/);
  });

  test("Anonymous user experience with login prompts", async ({ page }) => {
    // Create an ad as authenticated user first
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Produto para Usuário Anônimo");
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Produto para teste de usuário anônimo"
    );

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "anonymous@example.com");
    await page.click('button:has-text("Gravar")');

    // Logout to become anonymous user
    await page.locator('[data-testid="user-menu"]').click();

    // Test search functionality as anonymous user
    await page.goto("/");
    await expect(page.locator(".category-grid")).toBeVisible();

    // Category search should work
    await page.click('img[src*="beautyshop.png"]');
    await page.waitForTimeout(600);
    await expect(page.locator(".search-results-section")).toBeVisible();

    // Text search should work
    await page.fill('input[placeholder*="pesquisar"]', "anônimo");
    await page.waitForTimeout(600);
    await expect(page.getByText("Produto para Usuário Anônimo")).toBeVisible();

    // Try to favorite - should show login prompt
    const favoriteButton = page.locator(".favorite-btn").first();
    await favoriteButton.click();
    await expect(page.getByText(/fazer login para continuar/i)).toBeVisible();

    // Click to view ad details
    await page.getByText("Produto para Usuário Anônimo").click();
    await expect(page).toHaveURL(/\/ad\/view\//);

    // Comments should show login requirement
    await expect(
      page
        .getByText(/faça login para comentar/i)
        .or(page.locator("textarea[disabled], input[disabled]"))
    ).toBeVisible();

    // Favorite button in detail should also show login prompt
    const detailFavoriteButton = page.locator(".favorite-btn");
    await detailFavoriteButton.click();
    await expect(page.getByText(/fazer login para continuar/i)).toBeVisible();
  });

  test("Responsive behavior across all features", async ({ page }) => {
    // Create a test ad
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Produto Responsivo");
    await page.fill('input[name="short"]', "Teste responsivo");
    await page.fill(
      'textarea[name="description"]',
      "Produto para teste de responsividade em todas as funcionalidades"
    );

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "responsive@example.com");
    await page.click('button:has-text("Gravar")');

    // Test on different screen sizes
    const viewports = [
      { width: 375, height: 667, name: "mobile" },
      { width: 768, height: 1024, name: "tablet" },
      { width: 1200, height: 800, name: "desktop" },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/");

      // Home page should work on all screen sizes
      await expect(page.locator(".category-grid")).toBeVisible();
      await expect(
        page.locator('input[placeholder*="pesquisar"]')
      ).toBeVisible();

      // Search should work
      await page.fill('input[placeholder*="pesquisar"]', "responsivo");
      await page.waitForTimeout(600);

      await expect(page.locator(".search-results-section")).toBeVisible();
      await expect(page.getByText("Produto Responsivo")).toBeVisible();

      // Favorites should work
      const favoriteButton = page.locator(".favorite-btn").first();
      await favoriteButton.click();
      await expect(page.getByText(/adicionado aos favoritos/i)).toBeVisible();

      // Ad detail view should work
      await page.getByText("Produto Responsivo").click();
      await expect(page).toHaveURL(/\/ad\/view\//);

      // Comments should work on all screen sizes
      const commentInput = page.locator(
        'textarea[placeholder*="comentário"], textarea[name="comment"], input[placeholder*="comentário"]'
      );
      await expect(commentInput).toBeVisible();

      await commentInput.fill(`Comentário no ${viewport.name}`);
      const submitButton = page
        .locator(
          'button:has-text("Enviar"), button:has-text("Comentar"), button[type="submit"]'
        )
        .first();
      await submitButton.click();

      await expect(
        page.getByText(`Comentário no ${viewport.name}`)
      ).toBeVisible();

      // Go back to home for next iteration
      await page.goto("/");
    }
  });

  test("Performance and debouncing work correctly", async ({ page }) => {
    await page.goto("/");

    // Type rapidly in search box to test debouncing
    const searchInput = page.locator('input[placeholder*="pesquisar"]');

    // Type multiple characters quickly
    await searchInput.type("test");
    await searchInput.type("ando");
    await searchInput.type("rapido");

    // Wait for debounce to settle
    await page.waitForTimeout(700);

    // Should have final search term
    await expect(searchInput).toHaveValue("testandorapido");
    await expect(page.locator(".search-results-section")).toBeVisible();

    // Clear and verify return to initial state
    await searchInput.clear();
    await page.waitForTimeout(700);

    await expect(page.locator(".category-grid")).toBeVisible();
    await expect(page.locator(".search-results-section")).not.toBeVisible();
  });

  test("Error handling and edge cases", async ({ page }) => {
    await page.goto("/");

    // Test search with special characters
    await page.fill('input[placeholder*="pesquisar"]', "!@#$%^&*()");
    await page.waitForTimeout(600);

    // Should handle gracefully
    await expect(page.locator(".search-results-section")).toBeVisible();

    // Test very long search term
    const longSearchTerm = "a".repeat(200);
    await page.fill('input[placeholder*="pesquisar"]', longSearchTerm);
    await page.waitForTimeout(600);

    // Should handle gracefully
    await expect(page.locator(".search-results-section")).toBeVisible();

    // Test empty spaces
    await page.fill('input[placeholder*="pesquisar"]', "   ");
    await page.waitForTimeout(600);

    // Should treat as empty and show categories
    await expect(page.locator(".category-grid")).toBeVisible();

    // Test search that will definitely return no results
    await page.fill(
      'input[placeholder*="pesquisar"]',
      "xyzabcdefghijklmnopqrstuvwxyz123456789"
    );
    await page.waitForTimeout(600);

    // Should show no results message
    await expect(page.getByText(/nenhum anúncio encontrado/i)).toBeVisible();
  });
});
