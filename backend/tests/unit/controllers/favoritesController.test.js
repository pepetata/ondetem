const favoritesController = require("../../../src/controllers/favoritesController");
const favoriteModel = require("../../../src/models/favoriteModel");
const logger = require("../../../src/utils/logger");

// Mock dependencies
jest.mock("../../../src/models/favoriteModel");
jest.mock("../../../src/utils/logger");

describe("Favorites Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: "user-123" },
      params: { adId: "ad-123" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe("addFavorite", () => {
    it("should add favorite successfully", async () => {
      favoriteModel.addFavorite.mockResolvedValue(true);

      await favoritesController.addFavorite(req, res);

      expect(favoriteModel.addFavorite).toHaveBeenCalledWith(
        "user-123",
        "ad-123"
      );
      expect(logger.info).toHaveBeenCalledWith(
        "User user-123 added ad ad-123 to favorites"
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Anúncio adicionado aos favoritos",
      });
    });

    it("should handle when favorite already exists", async () => {
      favoriteModel.addFavorite.mockResolvedValue(false);

      await favoritesController.addFavorite(req, res);

      expect(favoriteModel.addFavorite).toHaveBeenCalledWith(
        "user-123",
        "ad-123"
      );
      expect(logger.warn).toHaveBeenCalledWith(
        "User user-123 tried to add ad ad-123 to favorites, but it already exists"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Anúncio já está nos favoritos",
      });
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      favoriteModel.addFavorite.mockRejectedValue(error);

      await favoritesController.addFavorite(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        "Error adding favorite for user user-123:",
        error
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erro interno do servidor",
      });
    });
  });

  describe("removeFavorite", () => {
    it("should remove favorite successfully", async () => {
      favoriteModel.removeFavorite.mockResolvedValue(true);

      await favoritesController.removeFavorite(req, res);

      expect(favoriteModel.removeFavorite).toHaveBeenCalledWith(
        "user-123",
        "ad-123"
      );
      expect(logger.info).toHaveBeenCalledWith(
        "User user-123 removed ad ad-123 from favorites"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Anúncio removido dos favoritos",
      });
    });

    it("should handle when favorite doesn't exist", async () => {
      favoriteModel.removeFavorite.mockResolvedValue(false);

      await favoritesController.removeFavorite(req, res);

      expect(favoriteModel.removeFavorite).toHaveBeenCalledWith(
        "user-123",
        "ad-123"
      );
      expect(logger.warn).toHaveBeenCalledWith(
        "User user-123 tried to remove ad ad-123 from favorites, but it does not exist"
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Favorito não encontrado",
      });
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      favoriteModel.removeFavorite.mockRejectedValue(error);

      await favoritesController.removeFavorite(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        "Error removing favorite for user user-123:",
        error
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erro interno do servidor",
      });
    });
  });

  describe("getUserFavorites", () => {
    it("should get user favorites successfully", async () => {
      const mockFavorites = [
        { id: "ad-1", title: "Test Ad 1", favorited_at: new Date() },
        { id: "ad-2", title: "Test Ad 2", favorited_at: new Date() },
      ];
      favoriteModel.getUserFavorites.mockResolvedValue(mockFavorites);

      await favoritesController.getUserFavorites(req, res);

      expect(favoriteModel.getUserFavorites).toHaveBeenCalledWith("user-123");
      expect(res.json).toHaveBeenCalledWith(mockFavorites);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      favoriteModel.getUserFavorites.mockRejectedValue(error);
      console.error = jest.fn(); // Mock console.error

      await favoritesController.getUserFavorites(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        "Error fetching favorites for user user-123:",
        error
      );
      expect(console.error).toHaveBeenCalledWith(
        "Error in getUserFavorites:",
        error
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erro interno do servidor",
      });
    });
  });

  describe("checkFavorite", () => {
    it("should check if ad is favorite successfully", async () => {
      favoriteModel.isFavorite.mockResolvedValue(true);

      await favoritesController.checkFavorite(req, res);

      expect(favoriteModel.isFavorite).toHaveBeenCalledWith(
        "user-123",
        "ad-123"
      );
      expect(res.json).toHaveBeenCalledWith({ isFavorite: true });
    });

    it("should return false when ad is not favorite", async () => {
      favoriteModel.isFavorite.mockResolvedValue(false);

      await favoritesController.checkFavorite(req, res);

      expect(favoriteModel.isFavorite).toHaveBeenCalledWith(
        "user-123",
        "ad-123"
      );
      expect(res.json).toHaveBeenCalledWith({ isFavorite: false });
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      favoriteModel.isFavorite.mockRejectedValue(error);

      await favoritesController.checkFavorite(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        "Error checking favorite for user user-123:",
        error
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erro interno do servidor",
      });
    });
  });

  describe("getFavoriteIds", () => {
    it("should get favorite IDs successfully", async () => {
      const mockIds = ["ad-1", "ad-2", "ad-3"];
      favoriteModel.getFavoriteIds.mockResolvedValue(mockIds);

      await favoritesController.getFavoriteIds(req, res);

      expect(favoriteModel.getFavoriteIds).toHaveBeenCalledWith("user-123");
      expect(res.json).toHaveBeenCalledWith(mockIds);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      favoriteModel.getFavoriteIds.mockRejectedValue(error);

      await favoritesController.getFavoriteIds(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        "Error fetching favorite IDs for user user-123:",
        error
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erro interno do servidor",
      });
    });
  });
});
