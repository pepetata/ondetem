import { test, expect } from "@playwright/test";

test.describe("Ads E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Go to login page and login as a test user
    await page.goto("/login");
    await page.fill('input[name="email"]', "testuser@example.com");
    await page.fill('input[name="password"]', "testpassword123");
    await page.click('button:has-text("Entrar")');
    // Wait for redirect to home or dashboard
    await expect(page).toHaveURL("/");
  });

  test("User can create a new ad", async ({ page }) => {
    await page.goto("/ad");
    await expect(
      page.getByRole("heading", {
        name: /registre as informações de seus anúncios/i,
      })
    ).toBeVisible();

    // Fill required fields on the "Descrição" tab
    await page.fill('input[name="title"]', "Anúncio E2E");
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Descrição completa do anúncio"
    );

    // Switch to the "Contato" tab before filling contact fields
    await page.click('button[role="tab"]:has-text("Contato")');

    // Fill only the zipcode, then wait for auto-fill of city/state/address1
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();

    // Wait for auto-filled fields
    await expect(page.locator('input[name="city"]')).toHaveValue("São Paulo");
    await expect(page.locator('input[name="state"]')).toHaveValue("SP");
    await expect(page.locator('input[name="address1"]')).toHaveValue(
      "Praça da Sé"
    );

    // Fill the rest
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "anuncioe2e@example.com");

    // Save
    await page.click('button:has-text("Gravar")');

    // Should see success notification
    await expect(page.getByText(/anúncio criado com sucesso/i)).toBeVisible();
  });

  test('User can see their ads in "Meus Anúncios"', async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /meus anúncios/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Anúncio E2E", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Anúncio E2E Editado", exact: true })
    ).toBeVisible();
  });

  test("User can edit an ad", async ({ page }) => {
    await page.goto("/");
    await page.click('button:has-text("Anúncio E2E")');
    await expect(page).toHaveURL("/ad");
    await page.fill('input[name="title"]', "Anúncio E2E Editado");
    await page.click('button:has-text("Gravar")');
    await expect(page.getByText(/anúncio atualizado/i)).toBeVisible();
  });

  test("User can delete an ad", async ({ page }) => {
    await page.goto("/");
    // Click the edited ad to load it
    await page.click('button:has-text("Anúncio E2E Editado")');
    await expect(page).toHaveURL("/ad");
    await expect(page.locator('input[name="title"]')).toHaveValue(/editado/i);
    // Click "Remover Anúncio"
    await page.click('button:has-text("Remover Anúncio")');
    // Confirm modal
    await expect(
      page.getByText(/tem certeza que deseja remover/i)
    ).toBeVisible();
    await page.click('button:has-text("Confirmar")');
    await expect(page.getByText(/anúncio removido/i)).toBeVisible();
  });

  test("Form validation works", async ({ page }) => {
    await page.goto("/ad");
    // Try to submit with empty fields
    await page.click('button:has-text("Gravar")');
    await expect(page.getByText(/obrigatório/i)).toBeVisible();

    // Switch to the "Contato" tab before testing zipcode validation
    await page.click('button[role="tab"]:has-text("Contato")');

    // Invalid CEP
    await page.fill('input[name="zipcode"]', "123");
    await page.locator('input[name="zipcode"]').blur();
    await expect(page.getByText(/informe o cep no formato/i)).toBeVisible();
  });
});
