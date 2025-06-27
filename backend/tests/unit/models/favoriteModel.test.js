const favoriteModel = require("../../../src/models/favoriteModel");
const { safePool } = require("../../../src/utils/sqlSecurity");

// Mock dependencies
jest.mock("../../../src/utils/sqlSecurity");

describe("Favorite Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn(); // Mock console.error
  });

  describe("addFavorite", () => {
    it("should add favorite successfully", async () => {
      const mockResult = { rows: [{ id: 1 }] };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await favoriteModel.addFavorite("user-123", "ad-123");

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        `INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2) 
       ON CONFLICT (user_id, ad_id) DO NOTHING 
       RETURNING id`,
        ["user-123", "ad-123"],
        "add_favorite"
      );
      expect(result).toBe(true);
    });

    it("should return false when favorite already exists", async () => {
      const mockResult = { rows: [] };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await favoriteModel.addFavorite("user-123", "ad-123");

      expect(result).toBe(false);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      safePool.safeQuery.mockRejectedValue(error);

      await expect(
        favoriteModel.addFavorite("user-123", "ad-123")
      ).rejects.toThrow(error);
      expect(console.error).toHaveBeenCalledWith(
        "Error adding favorite:",
        error
      );
    });
  });

  describe("removeFavorite", () => {
    it("should remove favorite successfully", async () => {
      const mockResult = { rowCount: 1 };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await favoriteModel.removeFavorite("user-123", "ad-123");

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        `DELETE FROM favorites WHERE user_id = $1 AND ad_id = $2`,
        ["user-123", "ad-123"],
        "remove_favorite"
      );
      expect(result).toBe(true);
    });

    it("should return false when favorite doesn't exist", async () => {
      const mockResult = { rowCount: 0 };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await favoriteModel.removeFavorite("user-123", "ad-123");

      expect(result).toBe(false);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      safePool.safeQuery.mockRejectedValue(error);

      await expect(
        favoriteModel.removeFavorite("user-123", "ad-123")
      ).rejects.toThrow(error);
      expect(console.error).toHaveBeenCalledWith(
        "Error removing favorite:",
        error
      );
    });
  });

  describe("getUserFavorites", () => {
    it("should get user favorites with images", async () => {
      const mockFavorites = [
        { id: "ad-1", title: "Test Ad 1", favorited_at: new Date() },
        { id: "ad-2", title: "Test Ad 2", favorited_at: new Date() },
      ];
      const mockImagesResult = { rows: [{ filename: "image1.jpg" }] };

      safePool.safeQuery
        .mockResolvedValueOnce({ rows: mockFavorites }) // First call for favorites
        .mockResolvedValue(mockImagesResult); // Subsequent calls for images

      const result = await favoriteModel.getUserFavorites("user-123");

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        ["user-123"],
        "get_user_favorites"
      );
      expect(result).toEqual([
        { ...mockFavorites[0], images: ["image1.jpg"] },
        { ...mockFavorites[1], images: ["image1.jpg"] },
      ]);
    });

    it("should handle empty favorites list", async () => {
      safePool.safeQuery.mockResolvedValue({ rows: [] });

      const result = await favoriteModel.getUserFavorites("user-123");

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      safePool.safeQuery.mockRejectedValue(error);

      await expect(favoriteModel.getUserFavorites("user-123")).rejects.toThrow(
        error
      );
      expect(console.error).toHaveBeenCalledWith(
        "Error getting user favorites:",
        error
      );
    });
  });

  describe("isFavorite", () => {
    it("should return true when ad is favorite", async () => {
      const mockResult = { rows: [{ "?column?": 1 }] };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await favoriteModel.isFavorite("user-123", "ad-123");

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        `SELECT 1 FROM favorites WHERE user_id = $1 AND ad_id = $2`,
        ["user-123", "ad-123"],
        "check_is_favorite"
      );
      expect(result).toBe(true);
    });

    it("should return false when ad is not favorite", async () => {
      const mockResult = { rows: [] };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await favoriteModel.isFavorite("user-123", "ad-123");

      expect(result).toBe(false);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      safePool.safeQuery.mockRejectedValue(error);

      await expect(
        favoriteModel.isFavorite("user-123", "ad-123")
      ).rejects.toThrow(error);
      expect(console.error).toHaveBeenCalledWith(
        "Error checking if favorite:",
        error
      );
    });
  });

  describe("getFavoriteIds", () => {
    it("should get favorite IDs successfully", async () => {
      const mockResult = {
        rows: [{ ad_id: "ad-1" }, { ad_id: "ad-2" }, { ad_id: "ad-3" }],
      };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await favoriteModel.getFavoriteIds("user-123");

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        `SELECT ad_id FROM favorites WHERE user_id = $1`,
        ["user-123"],
        "get_favorite_ids"
      );
      expect(result).toEqual(["ad-1", "ad-2", "ad-3"]);
    });

    it("should return empty array when no favorites", async () => {
      const mockResult = { rows: [] };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await favoriteModel.getFavoriteIds("user-123");

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      safePool.safeQuery.mockRejectedValue(error);

      await expect(favoriteModel.getFavoriteIds("user-123")).rejects.toThrow(
        error
      );
      expect(console.error).toHaveBeenCalledWith(
        "Error getting favorite IDs:",
        error
      );
    });
  });
});
