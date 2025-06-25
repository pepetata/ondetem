import { test, expect } from "@playwright/test";

test.describe("Comments Functionality E2E", () => {
  let testUserId;
  let testAdId;
  const testUser = {
    email: "commentstest@example.com",
    password: "testpassword123",
    fullName: "Comments Test User",
    nickname: "CommentsTest",
  };

  test.beforeAll(async ({ request }) => {
    console.log(`Creating comments test user: ${testUser.email}`);
    const res = await request.post("http://localhost:3000/api/users", {
      data: testUser,
    });

    if (res.ok()) {
      const userData = await res.json();
      testUserId = userData.id;
      console.log(`✅ Created comments test user with ID: ${testUserId}`);
    } else {
      console.log(`⚠️ Comments user creation response: ${res.status()}`);
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
          console.log(`✅ Cleaned up comments test user: ${testUserId}`);
        }
      } catch (error) {
        console.log(
          `⚠️ Could not cleanup comments test user: ${error.message}`
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

  test("User can view comments section in ad detail", async ({ page }) => {
    // Create an ad first
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Anúncio para Comentários");
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Descrição do anúncio para teste de comentários"
    );

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "comments@example.com");
    await page.click('button:has-text("Gravar")');
    await expect(page.getByText(/anúncio criado com sucesso/i)).toBeVisible();

    // Go to home, search, and click on ad to view details
    await page.goto("/");
    await page.fill('input[placeholder*="pesquisar"]', "comentários");
    await page.waitForTimeout(1000);

    // Click on the ad to view details
    await page.getByText("Anúncio para Comentários").click();

    // Should be on ad detail page
    await expect(page).toHaveURL(/\/ad\/view\//);

    // Comments section should be visible
    await expect(page.getByText(/comentários/i)).toBeVisible();

    // Comments component should be loaded
    await expect(
      page.locator('[data-testid="comments-section"]')
    ).toBeVisible();
  });

  test("User can add a comment to an ad", async ({ page }) => {
    // Create an ad first
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Anúncio para Adicionar Comentário");
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Descrição do anúncio para adicionar comentários"
    );

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "addcomment@example.com");
    await page.click('button:has-text("Gravar")');

    // Go to ad detail page
    await page.goto("/");
    await page.fill('input[placeholder*="pesquisar"]', "adicionar comentário");
    await page.waitForTimeout(1000);

    await page.getByText("Anúncio para Adicionar Comentário").click();

    // Wait for comments section to load
    await expect(
      page.locator('[data-testid="comments-section"]')
    ).toBeVisible();

    // Find comment input field
    const commentInput = page.locator('[data-testid="comment-input"]');
    await expect(commentInput).toBeVisible();

    // Add a comment
    const testComment = "Este é um comentário de teste muito interessante!";
    await commentInput.fill(testComment);

    // Submit comment
    const submitButton = page.locator('[data-testid="comment-submit"]');
    await submitButton.click();

    // Should see success message or the comment appear
    await expect(
      page.getByText(testComment).or(page.getByText(/comentário adicionado/i))
    ).toBeVisible();
  });

  test("User can view existing comments", async ({ page }) => {
    // Create an ad and add a comment first
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Anúncio para Ver Comentários");
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Descrição do anúncio para ver comentários"
    );

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "viewcomments@example.com");
    await page.click('button:has-text("Gravar")');

    // Go to ad detail and add a comment
    await page.goto("/");
    await page.fill('input[placeholder*="pesquisar"]', "ver comentários");
    await page.waitForTimeout(1000);

    await page.getByText("Anúncio para Ver Comentários").click();

    // Add a comment
    const commentInput = page.locator('[data-testid="comment-input"]');
    await commentInput.fill("Primeiro comentário para visualização");

    const submitButton = page.locator('[data-testid="comment-submit"]');
    await submitButton.click();

    // Wait a bit for comment to be processed
    await page.waitForTimeout(1000);

    // Reload page to see if comment persists
    await page.reload();

    // Should see the comment
    await expect(
      page.getByText("Primeiro comentário para visualização")
    ).toBeVisible();

    // Should show commenter's name/nickname
    await expect(page.getByText("CommentsTest")).toBeVisible();
  });

  test("Comments require authentication", async ({ page }) => {
    // Create an ad as authenticated user
    await page.goto("/ad");
    await page.fill(
      'input[name="title"]',
      "Anúncio para Teste de Autenticação"
    );
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill('textarea[name="description"]', "Descrição do anúncio");

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "authtest@example.com");
    await page.click('button:has-text("Gravar")');

    // Logout
    await page.locator('[data-testid="user-menu"]').click();

    // Go to ad detail as anonymous user
    await page.goto("/");
    await page.fill('input[placeholder*="pesquisar"]', "autenticação");
    await page.waitForTimeout(1000);

    await page.getByText("Anúncio para Teste de Autenticação").click();

    // Comments section should show login prompt or disabled input
    await expect(
      page
        .getByText(/faça login para comentar/i)
        .or(page.locator("textarea[disabled], input[disabled]"))
    ).toBeVisible();
  });

  test("Comments display with user information", async ({ page }) => {
    // Create an ad
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Anúncio para Info do Usuário");
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Descrição do anúncio para teste de info do usuário"
    );

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "userinfo@example.com");
    await page.click('button:has-text("Gravar")');

    // Go to ad detail and add a comment
    await page.goto("/");
    await page.fill('input[placeholder*="pesquisar"]', "info do usuário");
    await page.waitForTimeout(1000);

    await page.getByText("Anúncio para Info do Usuário").click();

    const commentInput = page.locator('[data-testid="comment-input"]');
    await commentInput.fill("Comentário com informações do usuário");

    const submitButton = page.locator('[data-testid="comment-submit"]');
    await submitButton.click();

    // Should display user's nickname/name with the comment
    await expect(page.getByText("CommentsTest")).toBeVisible();

    // Should display the comment text
    await expect(
      page.getByText("Comentário com informações do usuário")
    ).toBeVisible();

    // Should display date/time information
    await expect(page.locator('[data-testid="comment-date"]')).toBeVisible();
  });

  test("Comments section loads and functions on mobile viewport", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Create an ad
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Anúncio para Mobile");
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Descrição do anúncio para teste mobile"
    );

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "mobile@example.com");
    await page.click('button:has-text("Gravar")');

    // Go to ad detail
    await page.goto("/");
    await page.fill('input[placeholder*="pesquisar"]', "mobile");
    await page.waitForTimeout(1000);

    await page.getByText("Anúncio para Mobile").click();

    // Comments section should be visible and functional on mobile
    await expect(
      page.locator('[data-testid="comments-section"]')
    ).toBeVisible();

    const commentInput = page.locator('[data-testid="comment-input"]');
    await expect(commentInput).toBeVisible();

    // Should be able to add comment on mobile
    await commentInput.fill("Comentário no mobile");

    const submitButton = page.locator('[data-testid="comment-submit"]');
    await submitButton.click();

    // Comment should appear
    await expect(page.getByText("Comentário no mobile")).toBeVisible();
  });

  test("Multiple comments display correctly", async ({ page }) => {
    // Create an ad
    await page.goto("/ad");
    await page.fill(
      'input[name="title"]',
      "Anúncio para Múltiplos Comentários"
    );
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Descrição do anúncio para múltiplos comentários"
    );

    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "multiplecomments@example.com");
    await page.click('button:has-text("Gravar")');

    // Go to ad detail
    await page.goto("/");
    await page.fill('input[placeholder*="pesquisar"]', "múltiplos");
    await page.waitForTimeout(1000);

    await page.getByText("Anúncio para Múltiplos Comentários").click();

    // Add multiple comments
    const comments = [
      "Primeiro comentário",
      "Segundo comentário",
      "Terceiro comentário",
    ];

    for (const comment of comments) {
      const commentInput = page.locator('[data-testid="comment-input"]');
      await commentInput.fill(comment);

      const submitButton = page.locator('[data-testid="comment-submit"]');
      await submitButton.click();

      // Wait for comment to be processed
      await page.waitForTimeout(500);
    }

    // All comments should be visible
    for (const comment of comments) {
      await expect(page.getByText(comment)).toBeVisible();
    }
  });
});
