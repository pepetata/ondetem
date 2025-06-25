import { test, expect } from "@playwright/test";

test.describe("Favorites Functionality E2E", () => {
  let testUserId;
  const testUser = {
    email: "favoritestest@example.com",
    password: "testpassword123",
    fullName: "Favorites Test User",
    nickname: "FavoritesTest",
  };

  test.beforeAll(async ({ request }) => {
    console.log(`Creating favorites test user: ${testUser.email}`);
    const res = await request.post("http://localhost:3000/api/users", {
      data: testUser,
    });

    if (res.ok()) {
      const userData = await res.json();
      testUserId = userData.id;
      console.log(`✅ Created favorites test user with ID: ${testUserId}`);
    } else {
      console.log(`⚠️ Favorites user creation response: ${res.status()}`);
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
          console.log(`✅ Cleaned up favorites test user: ${testUserId}`);
        }
      } catch (error) {
        console.log(
          `⚠️ Could not cleanup favorites test user: ${error.message}`
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

  test("User can add ad to favorites from ad list", async ({ page }) => {
    // First create an ad to favorite
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Anúncio para Favoritar");
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Descrição do anúncio para teste de favoritos"
    );

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "favorites@example.com");
    await page.click('button:has-text("Gravar")');
    await expect(page.getByText(/anúncio criado com sucesso/i)).toBeVisible();

    // Go to home and search for the ad
    await page.goto("/");
    await page.fill('input[placeholder*="pesquisar"]', "favoritar");
    await page.waitForTimeout(1000);

    // Should see the ad in search results
    await expect(page.getByText("Anúncio para Favoritar")).toBeVisible();

    // Find and click the favorite button (heart icon)
    const favoriteButton = page.locator(".favorite-btn").first();
    await expect(favoriteButton).toBeVisible();

    // Initially should not be favorited (empty heart)
    await expect(favoriteButton).toHaveClass(/favorite-btn/);

    // Click to add to favorites
    await favoriteButton.click();

    // Should see success notification
    await expect(page.getByText(/adicionado aos favoritos/i)).toBeVisible();

    // Button should now show as favorited (filled heart)
    await expect(favoriteButton).toHaveClass(/favorite-btn.*favorited/);
  });

  test("User can remove ad from favorites", async ({ page }) => {
    // First create and favorite an ad
    await page.goto("/ad");
    await page.fill(
      'input[name="title"]',
      "Anúncio para Remover dos Favoritos"
    );
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Descrição do anúncio para teste de remoção de favoritos"
    );

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "removefavorites@example.com");
    await page.click('button:has-text("Gravar")');
    await expect(page.getByText(/anúncio criado com sucesso/i)).toBeVisible();

    // Go to home, search, and add to favorites
    await page.goto("/");
    await page.fill('input[placeholder*="pesquisar"]', "remover");
    await page.waitForTimeout(1000);

    const favoriteButton = page.locator(".favorite-btn").first();
    await favoriteButton.click();
    await expect(page.getByText(/adicionado aos favoritos/i)).toBeVisible();

    // Now remove from favorites
    await favoriteButton.click();

    // Should see removal notification
    await expect(page.getByText(/removido dos favoritos/i)).toBeVisible();

    // Button should show as not favorited again
    await expect(favoriteButton).not.toHaveClass(/favorited/);
  });

  test("Favorite button shows login modal for non-authenticated users", async ({
    page,
  }) => {
    // Logout first
    await page.goto("/");
    await page.locator('[data-testid="user-menu"]').click();

    // Create an ad as another user to test favorites
    await page.goto("/login");
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button:has-text("Entrar")');

    await page.goto("/ad");
    await page.fill('input[name="title"]', "Anúncio para Teste de Login");
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill('textarea[name="description"]', "Descrição do anúncio");

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "logintest@example.com");
    await page.click('button:has-text("Gravar")');

    // Logout
    await page.locator('[data-testid="user-menu"]').click();

    // Now as anonymous user, try to favorite
    await page.goto("/");
    await page.fill('input[placeholder*="pesquisar"]', "login");
    await page.waitForTimeout(1000);

    const favoriteButton = page.locator(".favorite-btn").first();
    await favoriteButton.click();

    // Should show login modal
    await expect(page.getByText(/fazer login para continuar/i)).toBeVisible();

    // Modal should have login button
    await expect(
      page.getByRole("button", { name: /fazer login/i })
    ).toBeVisible();
  });

  test("Favorite animation works when adding to favorites", async ({
    page,
  }) => {
    // Create an ad to favorite
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Anúncio para Testar Animação");
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Descrição do anúncio para teste de animação"
    );

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "animation@example.com");
    await page.click('button:has-text("Gravar")');

    // Go to home and search
    await page.goto("/");
    await page.fill('input[placeholder*="pesquisar"]', "animação");
    await page.waitForTimeout(1000);

    const favoriteButton = page.locator(".favorite-btn").first();

    // Click to add to favorites
    await favoriteButton.click();

    // Check for animation class (heart should animate)
    await expect(favoriteButton).toHaveClass(/animating/);

    // Wait for animation to complete
    await page.waitForTimeout(1000);

    // Animation class should be removed
    await expect(favoriteButton).not.toHaveClass(/animating/);
  });

  test("Favorites work from ad detail view", async ({ page }) => {
    // Create an ad
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Anúncio para Ver Detalhes");
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Descrição completa do anúncio para visualização"
    );

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "details@example.com");
    await page.click('button:has-text("Gravar")');

    // Go to home, search, and click on ad to view details
    await page.goto("/");
    await page.fill('input[placeholder*="pesquisar"]', "detalhes");
    await page.waitForTimeout(1000);

    // Click on the ad to view details
    await page.getByText("Anúncio para Ver Detalhes").click();

    // Should be on ad detail page
    await expect(page).toHaveURL(/\/ad\/view\//);

    // Find favorite button on detail page
    const favoriteButton = page.locator(".favorite-btn");
    await expect(favoriteButton).toBeVisible();

    // Add to favorites from detail page
    await favoriteButton.click();

    // Should see success notification
    await expect(page.getByText(/adicionado aos favoritos/i)).toBeVisible();

    // Button should show as favorited
    await expect(favoriteButton).toHaveClass(/favorited/);
  });

  test("Favorite status persists across page reloads", async ({ page }) => {
    // Create and favorite an ad
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Anúncio para Persistência");
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Descrição do anúncio para teste de persistência"
    );

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "persistence@example.com");
    await page.click('button:has-text("Gravar")');

    // Go to home, search, and add to favorites
    await page.goto("/");
    await page.fill('input[placeholder*="pesquisar"]', "persistência");
    await page.waitForTimeout(1000);

    const favoriteButton = page.locator(".favorite-btn").first();
    await favoriteButton.click();
    await expect(page.getByText(/adicionado aos favoritos/i)).toBeVisible();

    // Reload the page
    await page.reload();

    // Search again
    await page.fill('input[placeholder*="pesquisar"]', "persistência");
    await page.waitForTimeout(1000);

    // Favorite button should still show as favorited
    const reloadedFavoriteButton = page.locator(".favorite-btn").first();
    await expect(reloadedFavoriteButton).toHaveClass(/favorited/);
  });
});
