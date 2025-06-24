const fs = require("fs");
const path = require("path");
const { request } = require("@playwright/test");

class TestCleanup {
  constructor() {
    this.testAdPatterns = [
      "E2E",
      "Test",
      "Teste",
      "Anúncio com Imagens",
      "Para Deletar",
      "para Deletar",
      "Limite Imagens",
      "Arquivo Inválido",
      "para Visualizar",
      "para Editar",
      "Editado com Sucesso",
    ];
    this.testUserPatterns = ["E2E", "Test", "Teste", "e2euser", "testuser"];
  }

  async cleanupAllTestData(page) {
    console.log("🔍 Finding all test ads...");

    try {
      // Make sure we're on the home page
      await page.goto("/", { timeout: 10000 });

      // Wait a bit for the page to load
      await page.waitForTimeout(2000);

      const testAdTitles = await this.findTestAds(page);
      console.log(`Found ${testAdTitles.length} test ads to clean up`);

      for (const title of testAdTitles) {
        await this.deleteAd(page, title);
      }

      this.cleanupTestImages();
    } catch (error) {
      console.error("Error in UI cleanup:", error.message);
      console.log("🔄 Falling back to API cleanup...");
      await this.cleanupViaAPI();
    }
  }

  async cleanupViaAPI() {
    console.log("🔧 Running API-based cleanup...");

    try {
      const api = await request.newContext();

      // Try to login as test user to get a token
      let token = null;
      try {
        const loginRes = await api.post(
          "http://localhost:3000/api/auth/login",
          {
            data: {
              email: "testuser@example.com",
              password: "testpassword123",
            },
          }
        );

        if (loginRes.ok()) {
          const loginData = await loginRes.json();
          token = loginData.token;
          console.log("✅ Got auth token for API cleanup");
        }
      } catch (loginError) {
        console.log("⚠️ Could not get auth token, trying cleanup without auth");
      }

      // Clean up test ads via API
      await this.cleanupTestAdsViaAPI(api, token);

      // Clean up test users via API (be careful not to delete the main test user)
      await this.cleanupTestUsersViaAPI(api, token);

      // Clean up images
      this.cleanupTestImages();

      await api.dispose();
      console.log("✅ API cleanup completed");
    } catch (error) {
      console.error("❌ API cleanup failed:", error.message);
      // Still try to cleanup images as last resort
      this.cleanupTestImages();
    }
  }

  async cleanupTestAdsViaAPI(api, token) {
    if (!token) {
      console.log("⚠️ No token available, skipping ad cleanup");
      return;
    }

    try {
      // Get all ads for the user
      const adsRes = await api.get("http://localhost:3000/api/ads", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (adsRes.ok()) {
        const ads = await adsRes.json();
        console.log(`Found ${ads.length} ads to check for cleanup`);

        for (const ad of ads) {
          if (
            this.testAdPatterns.some(
              (pattern) => ad.title && ad.title.includes(pattern)
            )
          ) {
            try {
              const deleteRes = await api.delete(
                `http://localhost:3000/api/ads/${ad.id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (deleteRes.ok()) {
                console.log(`🗑️ Deleted test ad via API: ${ad.title}`);
              }
            } catch (deleteError) {
              console.log(
                `⚠️ Could not delete ad ${ad.title}:`,
                deleteError.message
              );
            }
          }
        }
      }
    } catch (error) {
      console.log("⚠️ Could not cleanup ads via API:", error.message);
    }
  }

  async cleanupTestUsersViaAPI(api, token) {
    try {
      // Get all users (if there's an admin endpoint)
      // Note: This depends on your API structure - you might need to adjust this
      const usersRes = await api.get("http://localhost:3000/api/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (usersRes.ok()) {
        const users = await usersRes.json();
        console.log(`Found ${users.length} users to check for cleanup`);

        for (const user of users) {
          // Only delete users that match test patterns but NOT the main test user
          if (
            user.email !== "testuser@example.com" &&
            this.testUserPatterns.some(
              (pattern) =>
                (user.email && user.email.includes(pattern)) ||
                (user.nickname && user.nickname.includes(pattern)) ||
                (user.fullName && user.fullName.includes(pattern))
            )
          ) {
            try {
              const deleteRes = await api.delete(
                `http://localhost:3000/api/users/${user.id}`,
                {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
              );

              if (deleteRes.ok()) {
                console.log(`🗑️ Deleted test user via API: ${user.email}`);
              }
            } catch (deleteError) {
              console.log(
                `⚠️ Could not delete user ${user.email}:`,
                deleteError.message
              );
            }
          }
        }
      }
    } catch (error) {
      console.log("⚠️ Could not cleanup users via API:", error.message);
    }
  }

  async findTestAds(page) {
    const testAdButtons = await page.locator("button").all();
    const testAdTitles = [];

    for (const button of testAdButtons) {
      const text = await button.textContent();
      if (
        text &&
        this.testAdPatterns.some((pattern) => text.includes(pattern))
      ) {
        testAdTitles.push(text.trim());
      }
    }

    return testAdTitles;
  }

  async deleteAd(page, title) {
    try {
      await page.goto("/");
      const adButton = page.locator(`button:has-text("${title}")`).first();

      if (await adButton.isVisible({ timeout: 2000 })) {
        await adButton.click();
        await page.waitForURL(/\/ad\/[^\/]+\/edit/, { timeout: 5000 });

        const deleteButton = page.locator('button:has-text("Remover Anúncio")');
        if (await deleteButton.isVisible({ timeout: 2000 })) {
          await deleteButton.click();
          await page.click('button:has-text("Confirmar")');
          await page.waitForSelector("text=/anúncio removido/i", {
            timeout: 5000,
          });
          console.log(`✅ Deleted ad: ${title}`);
        }
      }
    } catch (error) {
      console.log(`⚠️ Could not delete ad "${title}":`, error.message);
    }
  }

  cleanupTestImages() {
    // Adjust path to your backend uploads directory
    const uploadsDir = path.join(
      process.cwd(),
      "..",
      "backend",
      "uploads",
      "ad_images"
    );

    if (!fs.existsSync(uploadsDir)) {
      console.log("Upload directory not found, skipping image cleanup");
      return;
    }

    try {
      const files = fs.readdirSync(uploadsDir);
      let deletedCount = 0;

      files.forEach((file) => {
        if (this.isTestImage(file)) {
          const filePath = path.join(uploadsDir, file);
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`🗑️ Deleted: ${file}`);
        }
      });

      console.log(`🗑️ Deleted ${deletedCount} test image files`);
    } catch (error) {
      console.log("⚠️ Could not clean up images:", error.message);
    }
  }

  isTestImage(filename) {
    return (
      filename.startsWith("test-image-") ||
      filename.includes("e2e") ||
      filename.includes("test") ||
      filename.includes("fixture")
    );
  }
}

module.exports = TestCleanup;
