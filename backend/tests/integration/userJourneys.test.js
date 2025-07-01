/**
 * Integration Tests for Core User Journeys
 * Tests complete workflows from start to finish
 */

const request = require("supertest");
const app = require("../../src/app");
const {
  setupTestDB,
  cleanupTestDB,
  createTestUser,
  createTestAd,
} = require("../setup/testHelpers");

describe("User Journey Integration Tests", () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await cleanupTestDB();
  });

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  describe("Complete User Registration and Login Journey", () => {
    test("User registers → verifies email → logs in → updates profile", async () => {
      // Step 1: User registration
      const registrationData = {
        email: "newuser@example.com",
        password: "SecurePassword123!",
        fullName: "John Doe",
        nickname: "johndoe",
      };

      const registrationResponse = await request(app)
        .post("/api/users")
        .send(registrationData)
        .expect(201);

      expect(registrationResponse.body).toHaveProperty("id");
      expect(registrationResponse.body.email).toBe(registrationData.email);

      // Step 2: Login
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: registrationData.email,
          password: registrationData.password,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty("token");
      authToken = loginResponse.body.token;

      // Step 3: Get current user info
      const userInfoResponse = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(userInfoResponse.body.email).toBe(registrationData.email);

      // Step 4: Update profile
      const profileUpdate = {
        fullName: "John Updated Doe",
        bio: "This is my updated bio",
      };

      const updateResponse = await request(app)
        .put(`/api/users/${userInfoResponse.body.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(profileUpdate)
        .expect(200);

      expect(updateResponse.body.fullName).toBe(profileUpdate.fullName);
    });

    test("Should handle duplicate email registration", async () => {
      const userData = {
        email: testUser.email,
        password: "Password123!",
        fullName: "Duplicate User",
      };

      await request(app).post("/api/users").send(userData).expect(400);
    });
  });

  describe("Ad Management Journey", () => {
    beforeEach(async () => {
      // Login test user
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "password123",
      });

      authToken = loginResponse.body.token;
    });

    test("User creates ad → uploads images → receives comments → updates ad → deletes ad", async () => {
      // Step 1: Create ad
      const adData = {
        title: "Test Laptop for Sale",
        description: "High-performance laptop in excellent condition",
        category: "electronics",
        subcategory: "computers",
        price: "800",
        country: "US",
        state: "CA",
        city: "San Francisco",
      };

      const createAdResponse = await request(app)
        .post("/api/ads")
        .set("Authorization", `Bearer ${authToken}`)
        .send(adData)
        .expect(201);

      const adId = createAdResponse.body.id;
      expect(createAdResponse.body.title).toBe(adData.title);

      // Step 2: Upload images (simulated)
      const imageUploadResponse = await request(app)
        .post(`/api/ads/${adId}/images`)
        .set("Authorization", `Bearer ${authToken}`)
        .attach("images", Buffer.from("fake image data"), "laptop1.jpg")
        .expect(200);

      expect(imageUploadResponse.body.images).toHaveLength(1);

      // Step 3: Get ad with images
      const getAdResponse = await request(app)
        .get(`/api/ads/${adId}`)
        .expect(200);

      expect(getAdResponse.body.images).toBeDefined();

      // Step 4: Update ad
      const updateData = {
        title: "Updated Laptop for Sale - Price Reduced!",
        price: "750",
      };

      const updateResponse = await request(app)
        .put(`/api/ads/${adId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.title).toBe(updateData.title);
      expect(updateResponse.body.price).toBe(updateData.price);

      // Step 5: Delete ad
      await request(app)
        .delete(`/api/ads/${adId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Verify ad is deleted
      await request(app).get(`/api/ads/${adId}`).expect(404);
    });

    test("Should handle unauthorized ad operations", async () => {
      const otherUserAd = await createTestAd({ userId: "other-user-id" });

      // Try to update another user's ad
      await request(app)
        .put(`/api/ads/${otherUserAd.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Hacked Title" })
        .expect(403);

      // Try to delete another user's ad
      await request(app)
        .delete(`/api/ads/${otherUserAd.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe("Search and Favorites Journey", () => {
    let testAds;

    beforeEach(async () => {
      // Login test user
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "password123",
      });

      authToken = loginResponse.body.token;

      // Create test ads
      testAds = await Promise.all([
        createTestAd({
          title: "Gaming Laptop",
          category: "electronics",
          price: "1200",
          city: "New York",
        }),
        createTestAd({
          title: "Office Chair",
          category: "furniture",
          price: "150",
          city: "New York",
        }),
        createTestAd({
          title: "Mountain Bike",
          category: "sports",
          price: "800",
          city: "Los Angeles",
        }),
      ]);
    });

    test("User searches ads → filters results → adds to favorites → manages favorites", async () => {
      // Step 1: Search all ads
      const searchAllResponse = await request(app).get("/api/ads").expect(200);

      expect(searchAllResponse.body.length).toBeGreaterThanOrEqual(3);

      // Step 2: Search with category filter
      const electronicsSearchResponse = await request(app)
        .get("/api/ads/search")
        .query({ category: "electronics" })
        .expect(200);

      const electronicsAds = electronicsSearchResponse.body;
      expect(electronicsAds.some((ad) => ad.title === "Gaming Laptop")).toBe(
        true
      );

      // Step 3: Search with location filter
      const nySearchResponse = await request(app)
        .get("/api/ads/search")
        .query({ city: "New York" })
        .expect(200);

      expect(nySearchResponse.body.length).toBeGreaterThanOrEqual(2);

      // Step 4: Search with price range
      const priceRangeResponse = await request(app)
        .get("/api/ads/search")
        .query({ minPrice: "100", maxPrice: "500" })
        .expect(200);

      const affordableAds = priceRangeResponse.body;
      expect(affordableAds.some((ad) => ad.title === "Office Chair")).toBe(
        true
      );
      expect(affordableAds.some((ad) => ad.title === "Gaming Laptop")).toBe(
        false
      );

      // Step 5: Add ads to favorites
      const gamingLaptopAd = testAds.find((ad) => ad.title === "Gaming Laptop");

      const addFavoriteResponse = await request(app)
        .post(`/api/favorites/${gamingLaptopAd.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(201);

      expect(addFavoriteResponse.body.message).toContain("added to favorites");

      // Step 6: Get user favorites
      const favoritesResponse = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(favoritesResponse.body.length).toBe(1);
      expect(favoritesResponse.body[0].title).toBe("Gaming Laptop");

      // Step 7: Remove from favorites
      await request(app)
        .delete(`/api/favorites/${gamingLaptopAd.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Verify removal
      const emptyFavoritesResponse = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(emptyFavoritesResponse.body.length).toBe(0);
    });

    test("Should handle complex search queries", async () => {
      const complexSearchResponse = await request(app)
        .get("/api/ads/search")
        .query({
          title: "laptop",
          category: "electronics",
          minPrice: "500",
          maxPrice: "1500",
          city: "New York",
          sortBy: "price",
          sortOrder: "desc",
        })
        .expect(200);

      // Should return gaming laptop sorted by price descending
      const results = complexSearchResponse.body;
      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(parseFloat(results[i].price)).toBeGreaterThanOrEqual(
            parseFloat(results[i + 1].price)
          );
        }
      }
    });
  });

  describe("Authentication Flow Edge Cases", () => {
    test("JWT token lifecycle management", async () => {
      // Step 1: Login and get token
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "password123",
        })
        .expect(200);

      const token = loginResponse.body.token;

      // Step 2: Use token for authenticated request
      await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Step 3: Test token refresh (if implemented)
      const refreshResponse = await request(app)
        .post("/api/auth/refresh")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(refreshResponse.body).toHaveProperty("token");

      // Step 4: Logout
      await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Step 5: Try to use expired/logged out token
      await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(401);
    });

    test("Should handle concurrent login attempts", async () => {
      const loginPromises = Array(5)
        .fill()
        .map(() =>
          request(app).post("/api/auth/login").send({
            email: testUser.email,
            password: "password123",
          })
        );

      const responses = await Promise.all(loginPromises);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("token");
      });
    });
  });

  describe("Error Recovery Scenarios", () => {
    test("Should handle database disconnection gracefully", async () => {
      // Mock database error
      const originalQuery = require("../../src/utils/sqlSecurity").pool.query;
      require("../../src/utils/sqlSecurity").pool.query = jest
        .fn()
        .mockRejectedValue(new Error("Connection lost"));

      // Try to perform operation
      const response = await request(app).get("/api/ads").expect(503);

      expect(response.body.error).toContain("Database");

      // Restore original function
      require("../../src/utils/sqlSecurity").pool.query = originalQuery;
    });

    test("Should handle file upload failures gracefully", async () => {
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "password123",
      });

      // Mock file system error
      const originalWriteFile = require("fs").promises.writeFile;
      require("fs").promises.writeFile = jest
        .fn()
        .mockRejectedValue(new Error("Disk full"));

      const response = await request(app)
        .post("/api/ads")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .attach("images", Buffer.from("fake image"), "test.jpg")
        .field("title", "Test Ad")
        .field("description", "Test Description")
        .field("category", "electronics")
        .field("price", "100")
        .expect(500);

      expect(response.body.error).toContain("upload");

      // Restore original function
      require("fs").promises.writeFile = originalWriteFile;
    });
  });
});
