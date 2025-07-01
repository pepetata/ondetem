const request = require("supertest");
const express = require("express");

// Mock modules before importing them
const mockFavoritesController = {
  getUserFavorites: jest.fn((req, res) => res.json({ favorites: [] })),
  getFavoriteIds: jest.fn((req, res) => res.json({ favoriteIds: [] })),
  addFavorite: jest.fn((req, res) =>
    res.status(201).json({ message: "Added to favorites" })
  ),
  removeFavorite: jest.fn((req, res) => res.status(204).send()),
  checkFavorite: jest.fn((req, res) => res.json({ isFavorited: false })),
};

const mockMiddleware = {
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: "test-user-id", email: "test@example.com" };
    next();
  }),
};

jest.mock(
  "../../../src/controllers/favoritesController",
  () => mockFavoritesController
);
jest.mock("../../../src/utils/middleware", () => mockMiddleware);

describe("Favorites Routes", () => {
  let app;

  beforeAll(() => {
    // Create Express app and import routes
    app = express();
    app.use(express.json());

    // Import and mount the favorites routes
    const favoritesRouter = require("../../../src/routes/favorites");
    app.use("/favorites", favoritesRouter);
  });

  beforeEach(() => {
    // Clear mock call counts
    jest.clearAllMocks();
  });

  describe("Authentication middleware", () => {
    it("should apply authenticateToken to all routes", async () => {
      // Test that authenticateToken is called for any route
      await request(app).get("/favorites/").expect(200);

      expect(mockMiddleware.authenticateToken).toHaveBeenCalled();
    });

    it("should reject unauthenticated requests", async () => {
      // Mock authenticateToken to simulate unauthorized request
      mockMiddleware.authenticateToken.mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });

      await request(app).get("/favorites/").expect(401);

      expect(mockFavoritesController.getUserFavorites).not.toHaveBeenCalled();

      // Restore the mock for subsequent tests
      mockMiddleware.authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: "test-user-id", email: "test@example.com" };
        next();
      });
    });
  });

  describe("GET /", () => {
    it("should call getUserFavorites controller", async () => {
      await request(app).get("/favorites/").expect(200);

      expect(mockMiddleware.authenticateToken).toHaveBeenCalled();
      expect(mockFavoritesController.getUserFavorites).toHaveBeenCalled();
    });

    it("should pass authenticated user to getUserFavorites controller", async () => {
      await request(app).get("/favorites/");

      const controllerCall =
        mockFavoritesController.getUserFavorites.mock.calls[0];
      expect(controllerCall[0].user).toEqual({
        id: "test-user-id",
        email: "test@example.com",
      });
    });
  });

  describe("GET /ids", () => {
    it("should call getFavoriteIds controller", async () => {
      await request(app).get("/favorites/ids").expect(200);

      expect(mockMiddleware.authenticateToken).toHaveBeenCalled();
      expect(mockFavoritesController.getFavoriteIds).toHaveBeenCalled();
    });

    it("should pass authenticated user to getFavoriteIds controller", async () => {
      await request(app).get("/favorites/ids");

      const controllerCall =
        mockFavoritesController.getFavoriteIds.mock.calls[0];
      expect(controllerCall[0].user).toEqual({
        id: "test-user-id",
        email: "test@example.com",
      });
    });
  });

  describe("POST /:adId", () => {
    it("should call addFavorite controller with adId parameter", async () => {
      const adId = "test-ad-id";

      await request(app).post(`/favorites/${adId}`).expect(201);

      expect(mockMiddleware.authenticateToken).toHaveBeenCalled();
      expect(mockFavoritesController.addFavorite).toHaveBeenCalled();

      const controllerCall = mockFavoritesController.addFavorite.mock.calls[0];
      expect(controllerCall[0].params.adId).toBe(adId);
      expect(controllerCall[0].user).toEqual({
        id: "test-user-id",
        email: "test@example.com",
      });
    });

    it("should handle different adId formats", async () => {
      const uuidAdId = "123e4567-e89b-12d3-a456-426614174000";

      await request(app).post(`/favorites/${uuidAdId}`).expect(201);

      const controllerCall = mockFavoritesController.addFavorite.mock.calls[0];
      expect(controllerCall[0].params.adId).toBe(uuidAdId);
    });
  });

  describe("DELETE /:adId", () => {
    it("should call removeFavorite controller with adId parameter", async () => {
      const adId = "test-ad-id";

      await request(app).delete(`/favorites/${adId}`).expect(204);

      expect(mockMiddleware.authenticateToken).toHaveBeenCalled();
      expect(mockFavoritesController.removeFavorite).toHaveBeenCalled();

      const controllerCall =
        mockFavoritesController.removeFavorite.mock.calls[0];
      expect(controllerCall[0].params.adId).toBe(adId);
      expect(controllerCall[0].user).toEqual({
        id: "test-user-id",
        email: "test@example.com",
      });
    });
  });

  describe("GET /:adId/check", () => {
    it("should call checkFavorite controller with adId parameter", async () => {
      const adId = "test-ad-id";

      await request(app).get(`/favorites/${adId}/check`).expect(200);

      expect(mockMiddleware.authenticateToken).toHaveBeenCalled();
      expect(mockFavoritesController.checkFavorite).toHaveBeenCalled();

      const controllerCall =
        mockFavoritesController.checkFavorite.mock.calls[0];
      expect(controllerCall[0].params.adId).toBe(adId);
      expect(controllerCall[0].user).toEqual({
        id: "test-user-id",
        email: "test@example.com",
      });
    });

    it("should return favorite check result", async () => {
      mockFavoritesController.checkFavorite.mockImplementation((req, res) =>
        res.json({ isFavorited: true })
      );

      const response = await request(app)
        .get("/favorites/test-ad-id/check")
        .expect(200);

      expect(response.body).toEqual({ isFavorited: true });
    });
  });

  describe("Route parameters", () => {
    it("should handle URL-encoded adId parameters", async () => {
      const encodedAdId = encodeURIComponent("ad-with-special-chars-123");

      await request(app).post(`/favorites/${encodedAdId}`).expect(201);

      const controllerCall = mockFavoritesController.addFavorite.mock.calls[0];
      expect(controllerCall[0].params.adId).toBe("ad-with-special-chars-123");
    });
  });

  describe("Error handling", () => {
    it("should handle controller errors gracefully", async () => {
      mockFavoritesController.getUserFavorites.mockImplementation(
        (req, res) => {
          throw new Error("Database error");
        }
      );

      // The error should be caught by Express error handling
      await request(app).get("/favorites/").expect(500);
    });
  });

  describe("Authentication edge cases", () => {
    beforeEach(() => {
      // Reset authenticateToken to default behavior
      mockMiddleware.authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: "test-user-id", email: "test@example.com" };
        next();
      });
    });

    it("should require authentication for all endpoints", async () => {
      const endpoints = [
        { method: "get", path: "/favorites/" },
        { method: "get", path: "/favorites/ids" },
        { method: "post", path: "/favorites/test-ad" },
        { method: "delete", path: "/favorites/test-ad" },
        { method: "get", path: "/favorites/test-ad/check" },
      ];

      for (const endpoint of endpoints) {
        await request(app)[endpoint.method](endpoint.path);
        expect(mockMiddleware.authenticateToken).toHaveBeenCalled();
      }
    });
  });
});
