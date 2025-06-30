import { test, expect } from "@playwright/test";

// Use pre-seeded test user (no dynamic creation needed)
const TEST_USER = {
  email: "testuser1@example.com", // This user is pre-seeded
  password: "TestPassword123!", // Correct password from seed data
};

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

    // Expect notification with "Invalid credentials"
    await expect(page.getByText(/Invalid credentials/i).first()).toBeVisible();
    // Optionally, ensure we are still on the login page
    await expect(page).toHaveURL(/\/login$/);
  });

  test("shows error notification for wrong password", async ({ page }) => {
    await page.goto("http://localhost:5173/login");
    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Senha").fill("wrongpassword");
    await page.getByRole("button", { name: /Entrar/i }).click();

    // Expect notification with "Invalid credentials"
    await expect(page.getByText(/Invalid credentials/i).first()).toBeVisible();
    // Optionally, ensure we are still on the login page
    await expect(page).toHaveURL(/\/login$/);
  });
});
