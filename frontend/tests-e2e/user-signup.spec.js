import { test, expect } from "@playwright/test";

test.describe("User Signup", () => {
  test("should allow a new user to register", async ({ page }) => {
    // Go to the signup page
    await page.goto("http://localhost:5173/signup");

    // Fill in the form fields (adjust selectors/labels as needed)
    await page.getByLabel("Nome Completo").fill("Usuário E2E");
    await page.getByLabel("Primeiro nome ou apelido").fill("E2E");
    await page.getByLabel("Email").fill(`e2e${Date.now()}@test.com`);
    await page.getByLabel(/^Senha/i).fill("senhaSegura123");
    await page.getByLabel("Confirme a senha").fill("senhaSegura123");
    await page.getByRole("checkbox").check();

    // Optionally upload a photo
    // await page.getByLabel('Selecione sua foto').setInputFiles('path/to/photo.jpg');

    // Submit the form
    await page.getByRole("button", { name: /Gravar/i }).click();

    // Expect a success notification or redirect (adjust as needed)
    await expect(page.getByText(/sucesso|cadastrado|bem-vindo/i)).toBeVisible();
    // Or, for redirect:
    // await expect(page).toHaveURL(/\/login|\/user/);
  });
});

test.describe("User Signup Required Fields", () => {
  test("should show required field errors when submitting empty form", async ({
    page,
  }) => {
    // Go to the signup page
    await page.goto("http://localhost:5173/signup");

    // Click the "Gravar" button without filling any fields
    await page.getByRole("button", { name: /Gravar/i }).click();

    // Check for required field error messages (adjust the text as needed)
    // If your validation error says "Obrigatório" or "Campo obrigatório"
    const errors = await page.getByText(/obrigat[óo]rio/i).all();
    expect(errors).toHaveLength(5);
    for (const error of errors) {
      await expect(error).toBeVisible();
    }
    // Optionally, check for each field's error
    // await expect(page.getByText(/Nome Completo.*obrigat[óo]rio/i)).toBeVisible();
    // await expect(page.getByText(/Email.*obrigat[óo]rio/i)).toBeVisible();
    // await expect(page.getByText(/Senha.*obrigat[óo]rio/i)).toBeVisible();
  });
});
