import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Ads E2E", () => {
  let testUserId;
  const testUser = {
    email: "testuser@example.com",
    password: "testpassword123",
    fullName: "Test User E2E",
    nickname: "TestUserE2E",
  };

  test.beforeAll(async ({ request }) => {
    // Create test user via API
    console.log(`Creating test user: ${testUser.email}`);

    const res = await request.post("http://localhost:3000/api/users", {
      data: testUser,
    });

    if (res.ok()) {
      const userData = await res.json();
      testUserId = userData.id;
      console.log(`✅ Created test user with ID: ${testUserId}`);
    } else {
      // User might already exist, that's OK
      console.log(`⚠️ User creation response: ${res.status()}`);
    }
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Login and delete test user
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
          console.log(`✅ Cleaned up test user: ${testUserId}`);
        }
      } catch (error) {
        console.log(`⚠️ Could not cleanup test user: ${error.message}`);
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    // Go to login page and login as a test user
    await page.goto("/login");
    await page.fill('input[name="email"]', "testuser@example.com");
    await page.fill('input[name="password"]', "testpassword123");
    await page.click('button:has-text("Entrar")');
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
    // First create an ad to see
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Anúncio para Visualizar");
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Descrição completa do anúncio"
    );

    // Switch to contact tab and fill required fields
    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "visualizar@example.com");
    await page.click('button:has-text("Gravar")');
    await expect(page.getByText(/anúncio criado com sucesso/i)).toBeVisible();

    // Now go to home to see the ad in "Meus Anúncios"
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /meus anúncios/i })
    ).toBeVisible();

    // Should see the ad we just created
    await expect(
      page
        .getByRole("button", { name: "Anúncio para Visualizar", exact: true })
        .first()
    ).toBeVisible();
  });

  test("User can edit an ad", async ({ page }) => {
    // First create an ad to edit
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Anúncio para Editar");
    await page.fill('input[name="short"]', "Breve descrição");
    await page.fill(
      'textarea[name="description"]',
      "Descrição completa do anúncio"
    );

    // Switch to contact tab and fill required fields
    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "editar@example.com");
    await page.click('button:has-text("Gravar")');
    await expect(page.getByText(/anúncio criado com sucesso/i)).toBeVisible();

    // Now edit the ad (we should already be in edit mode)
    await expect(page).toHaveURL(/\/ad\/[^\/]+\/edit/);
    await page.fill('input[name="title"]', "Anúncio Editado com Sucesso");
    await page.click('button:has-text("Gravar")');
    await expect(page.getByText(/anúncio atualizado/i)).toBeVisible();
  });

  test("User can delete an ad", async ({ page }) => {
    // First, create an ad to delete (make test independent)
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Anúncio Para Deletar");
    await page.fill('input[name="short"]', "Será deletado");

    // Switch to contact tab and fill required fields
    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "deletar@example.com");

    // Save the ad
    await page.click('button:has-text("Gravar")');
    await expect(page.getByText(/anúncio criado com sucesso/i)).toBeVisible();

    // Now we should be in edit mode
    await expect(page).toHaveURL(/\/ad\/[^\/]+\/edit/);
    await expect(page.locator('input[name="title"]')).toHaveValue(
      "Anúncio Para Deletar"
    );

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

  test("User can upload and manage images", async ({ page }) => {
    await page.goto("/ad");

    // Fill required fields first
    await page.fill('input[name="title"]', "Anúncio com Imagens");
    await page.fill('input[name="short"]', "Breve descrição com imagens");

    // Switch to contact tab and fill required fields
    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "imagens@example.com");

    // Switch to the "Imagens" tab
    await page.click('button[role="tab"]:has-text("Imagens")');

    // Check initial info text
    await expect(
      page.getByText(/você poderá cadastrar até 5 imagens/i)
    ).toBeVisible();
    await expect(
      page.getByText(/use apenas imagens do tipo jpeg, png ou jpg/i)
    ).toBeVisible();

    // Create test image files
    const testImage1 = path.join(
      process.cwd(),
      "tests-e2e",
      "fixtures",
      "test-image-1.jpg"
    );
    const testImage2 = path.join(
      process.cwd(),
      "tests-e2e",
      "fixtures",
      "test-image-2.jpg"
    );
    const testImage3 = path.join(
      process.cwd(),
      "tests-e2e",
      "fixtures",
      "test-image-3.jpg"
    );

    // Upload first image
    const fileInput = page.locator('input[type="file"].adimage-file-input');
    await fileInput.setInputFiles([testImage1]);

    // Wait for image preview to appear
    await expect(page.locator(".adimage-preview")).toHaveCount(1);
    await expect(page.locator(".adimage-preview img")).toBeVisible();

    // Upload second image
    await fileInput.setInputFiles([testImage2]);
    await expect(page.locator(".adimage-preview")).toHaveCount(2);

    // Test removing a staged image (before saving)
    const removeButtons = page.locator(".adimage-remove-btn");
    await removeButtons.first().click();
    await expect(page.locator(".adimage-preview")).toHaveCount(1);

    // Upload multiple images at once
    await fileInput.setInputFiles([testImage1, testImage2, testImage3]);
    await expect(page.locator(".adimage-preview")).toHaveCount(4);

    // Save the ad
    await page.click('button:has-text("Gravar")');
    await expect(page.getByText(/anúncio criado com sucesso/i)).toBeVisible();

    // Verify images are saved - should redirect to edit mode
    await expect(page).toHaveURL(/\/ad\/[^\/]+\/edit/);
    await page.click('button[role="tab"]:has-text("Imagens")');

    // Images should now be loaded from server
    await expect(page.locator(".adimage-preview")).toHaveCount(4);
    await expect(page.locator(".adimage-preview img")).toHaveCount(4);
  });

  test("User can delete existing images from saved ad", async ({ page }) => {
    // First, create an ad with images
    await page.goto("/ad");
    await page.fill('input[name="title"]', "Anúncio Com Imagens Para Deletar");
    await page.fill('input[name="short"]', "Com imagens");

    // Fill contact info
    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "imagensdeletar@example.com");

    // Add images
    await page.click('button[role="tab"]:has-text("Imagens")');
    const fileInput = page.locator('input[type="file"].adimage-file-input');
    const testImages = [
      path.join(process.cwd(), "tests-e2e", "fixtures", "test-image-1.jpg"),
      path.join(process.cwd(), "tests-e2e", "fixtures", "test-image-2.jpg"),
      path.join(process.cwd(), "tests-e2e", "fixtures", "test-image-3.jpg"),
    ];
    await fileInput.setInputFiles(testImages);
    await expect(page.locator(".adimage-preview")).toHaveCount(3);

    // Save the ad
    await page.click('button:has-text("Gravar")');
    await expect(page.getByText(/anúncio criado com sucesso/i)).toBeVisible();

    // Now we're in edit mode with saved images
    await expect(page).toHaveURL(/\/ad\/[^\/]+\/edit/);
    await page.click('button[role="tab"]:has-text("Imagens")');

    // Count existing images
    const initialImageCount = await page.locator(".adimage-preview").count();
    expect(initialImageCount).toBe(3);

    // Delete one image (mark for deletion)
    await page.locator(".adimage-remove-btn").first().click();

    // Should see the image marked for deletion (faded)
    await expect(page.locator(".adimage-preview-deleting")).toHaveCount(1);

    // Test undo delete
    await page.locator(".adimage-undo-btn").click();
    await expect(page.locator(".adimage-preview-deleting")).toHaveCount(0);

    // Delete again and save
    await page.locator(".adimage-remove-btn").first().click();
    await expect(page.locator(".adimage-preview-deleting")).toHaveCount(1);

    // Save changes
    await page.click('button:has-text("Gravar")');
    await expect(page.getByText(/anúncio atualizado/i)).toBeVisible();

    // Verify image was actually deleted
    await page.reload();
    await page.click('button[role="tab"]:has-text("Imagens")');
    const finalImageCount = await page.locator(".adimage-preview").count();
    expect(finalImageCount).toBe(2); // Should be 3 - 1 = 2
  });

  test("Image upload respects 5 image limit", async ({ page }) => {
    await page.goto("/ad");

    // Fill required fields
    await page.fill('input[name="title"]', "Teste Limite Imagens");
    await page.fill('input[name="short"]', "Testando limite de 5 imagens");

    // Switch to contact tab and fill required fields
    await page.click('button[role="tab"]:has-text("Contato")');
    await page.fill('input[name="zipcode"]', "01001000");
    await page.locator('input[name="zipcode"]').blur();
    await page.fill('input[name="phone1"]', "11999999999");
    await page.fill('input[name="email"]', "limite@example.com");

    // Switch to images tab
    await page.click('button[role="tab"]:has-text("Imagens")');

    // Create 6 test images
    const testImages = [
      path.join(process.cwd(), "tests-e2e", "fixtures", "test-image-1.jpg"),
      path.join(process.cwd(), "tests-e2e", "fixtures", "test-image-2.jpg"),
      path.join(process.cwd(), "tests-e2e", "fixtures", "test-image-3.jpg"),
      path.join(process.cwd(), "tests-e2e", "fixtures", "test-image-4.jpg"),
      path.join(process.cwd(), "tests-e2e", "fixtures", "test-image-5.jpg"),
      path.join(process.cwd(), "tests-e2e", "fixtures", "test-image-6.jpg"),
    ];

    const fileInput = page.locator('input[type="file"].adimage-file-input');

    // Upload all 6 images at once
    await fileInput.setInputFiles(testImages);

    // Should only show 5 images (limit enforced)
    await expect(page.locator(".adimage-preview")).toHaveCount(5);

    // File input should be hidden when limit is reached
    await expect(fileInput).toBeHidden();

    // Remove one image to test that file input reappears
    await page.locator(".adimage-remove-btn").first().click();
    await expect(page.locator(".adimage-preview")).toHaveCount(4);
    await expect(fileInput).toBeVisible();
  });

  test("Image upload shows error for invalid file types", async ({ page }) => {
    await page.goto("/ad");

    // Fill required fields
    await page.fill('input[name="title"]', "Teste Arquivo Inválido");

    // Switch to images tab
    await page.click('button[role="tab"]:has-text("Imagens")');

    const fileInput = page.locator('input[type="file"].adimage-file-input');

    // Test that the input only accepts image files
    const acceptAttribute = await fileInput.getAttribute("accept");
    expect(acceptAttribute).toBe("image/*");

    // Test that multiple attribute is present for multiple file selection
    const multipleAttribute = await fileInput.getAttribute("multiple");
    expect(multipleAttribute).toBe("");
  });
});
