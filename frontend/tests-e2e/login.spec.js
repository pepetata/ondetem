import { test, expect, request } from "@playwright/test";

const TEST_USER = {
  fullName: "Test User",
  nickname: "Test",
  email: "testuser@example.com",
  password: "testpassword123",
};

test.beforeAll(async () => {
  // Use Playwright's APIRequestContext to create the user via your backend API
  const api = await request.newContext();
  // Try to create the user (ignore error if already exists)
  await api.post("http://localhost:3000/api/users", {
    data: TEST_USER,
  });
  await api.dispose();
});

test.describe("Login Form", () => {
  test("should login successfully with valid credentials", async ({ page }) => {
    await page.goto("http://localhost:5173/login");
    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Senha").fill(TEST_USER.password);
    await page.getByRole("button", { name: /Entrar/i }).click();
    await expect(page).toHaveURL("http://localhost:5173/");
  });
});

test.describe("Login Form - Invalid Credentials", () => {
  test("shows error notification for wrong email", async ({ page }) => {
    await page.goto("http://localhost:5173/login");
    await page.getByLabel("Email").fill("wrongemail@example.com");
    await page.getByLabel("Senha").fill(TEST_USER.password);
    await page.getByRole("button", { name: /Entrar/i }).click();

    // Expect notification with "Credenciais inválidas"
    await expect(page.getByText(/Credenciais inválidas/i)).toBeVisible();
    // Optionally, ensure we are still on the login page
    await expect(page).toHaveURL(/\/login$/);
  });

  test("shows error notification for wrong password", async ({ page }) => {
    await page.goto("http://localhost:5173/login");
    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Senha").fill("wrongpassword");
    await page.getByRole("button", { name: /Entrar/i }).click();

    // Expect notification with "Credenciais inválidas"
    await expect(page.getByText(/Credenciais inválidas/i)).toBeVisible();
    // Optionally, ensure we are still on the login page
    await expect(page).toHaveURL(/\/login$/);
  });
});
