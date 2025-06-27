/**
 * Ad Model Unit Tests
 *
 * Tests the adModel.js functions with mocked database connections
 * to ensure data validation, sanitization, and SQL security.
 */

const adModel = require("../../../src/models/adModel");
const { safePool } = require("../../../src/utils/sqlSecurity");

// Mock the safePool
jest.mock("../../../src/utils/sqlSecurity", () => ({
  safePool: {
    safeQuery: jest.fn(),
  },
}));

describe("Ad Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createAd", () => {
    it("should create a new ad with valid data", async () => {
      const adData = {
        title: "Test Ad",
        description: "Test description",
        user_id: "user-123",
        city: "São Paulo",
        state: "SP",
        zipcode: "12345678",
      };

      const mockResult = {
        rows: [{ id: "ad-123", ...adData }],
        rowCount: 1,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await adModel.createAd(adData);

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO ads"),
        expect.arrayContaining([
          adData.title,
          adData.description,
          adData.user_id,
          adData.city,
          adData.state,
          adData.zipcode,
        ]),
        "create_ad"
      );
      expect(result).toBe("ad-123");
    });

    it("should handle database errors gracefully", async () => {
      const adData = {
        title: "Test Ad",
        description: "Test description",
        user_id: "user-123",
      };

      safePool.safeQuery.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(adModel.createAd(adData)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("findAdById", () => {
    it("should return ad when found", async () => {
      const adId = "ad-123";
      const mockAd = {
        id: adId,
        title: "Test Ad",
        description: "Test description",
        user_id: "user-123",
      };

      const mockResult = {
        rows: [mockAd],
        rowCount: 1,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await adModel.findAdById(adId);

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM ads WHERE id = $1"),
        [adId],
        "find_ad_by_id"
      );
      expect(result).toEqual(mockAd);
    });

    it("should return null when ad not found", async () => {
      const adId = "nonexistent-id";

      const mockResult = {
        rows: [],
        rowCount: 0,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await adModel.findAdById(adId);

      expect(result).toBeNull();
    });
  });

  describe("getAllAds", () => {
    it("should return all ads with pagination", async () => {
      const mockAds = [
        { id: "ad-1", title: "Ad One", user_id: "user-1" },
        { id: "ad-2", title: "Ad Two", user_id: "user-2" },
      ];

      const mockResult = {
        rows: mockAds,
        rowCount: 2,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await adModel.getAllAds(0, 10);

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM ads"),
        expect.arrayContaining([10, 0]),
        "get_all_ads"
      );
      expect(result).toEqual(mockAds);
    });

    it("should handle empty results", async () => {
      const mockResult = {
        rows: [],
        rowCount: 0,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await adModel.getAllAds();

      expect(result).toEqual([]);
    });
  });

  describe("searchAds", () => {
    it("should search ads by title", async () => {
      const searchTerm = "test";
      const mockAds = [
        { id: "ad-1", title: "Test Ad One" },
        { id: "ad-2", title: "Another Test Ad" },
      ];

      const mockResult = {
        rows: mockAds,
        rowCount: 2,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await adModel.searchAds(searchTerm);

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE title ILIKE $1"),
        [`%${searchTerm}%`],
        "search_ads"
      );
      expect(result).toEqual(mockAds);
    });

    it("should handle special characters in search safely", async () => {
      const searchTerm = "'; DROP TABLE ads; --";

      safePool.safeQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      await adModel.searchAds(searchTerm);

      const [query, params] = safePool.safeQuery.mock.calls[0];
      expect(query).not.toContain("DROP TABLE");
      expect(params[0]).toBe(`%${searchTerm}%`);
    });
  });

  describe("updateAd", () => {
    it("should update ad successfully", async () => {
      const adId = "ad-123";
      const updateData = {
        title: "Updated Title",
        description: "Updated description",
      };

      const mockResult = {
        rowCount: 1,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await adModel.updateAd(adId, updateData);

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE ads SET"),
        expect.arrayContaining([adId]),
        "update_ad"
      );
      expect(result).toBe(true);
    });

    it("should return false when ad not found for update", async () => {
      const adId = "nonexistent-id";
      const updateData = { title: "Updated Title" };

      const mockResult = {
        rowCount: 0,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await adModel.updateAd(adId, updateData);

      expect(result).toBe(false);
    });
  });

  describe("deleteAd", () => {
    it("should delete ad successfully", async () => {
      const adId = "ad-123";

      const mockResult = {
        rowCount: 1,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await adModel.deleteAd(adId);

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM ads WHERE id = $1"),
        [adId],
        "delete_ad"
      );
      expect(result).toBe(true);
    });

    it("should return false when ad not found for deletion", async () => {
      const adId = "nonexistent-id";

      const mockResult = {
        rowCount: 0,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await adModel.deleteAd(adId);

      expect(result).toBe(false);
    });
  });

  describe("getAdsByUserId", () => {
    it("should return user ads", async () => {
      const userId = "user-123";
      const mockAds = [
        { id: "ad-1", title: "User Ad One", user_id: userId },
        { id: "ad-2", title: "User Ad Two", user_id: userId },
      ];

      const mockResult = {
        rows: mockAds,
        rowCount: 2,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await adModel.getAdsByUserId(userId);

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM ads WHERE user_id = $1"),
        [userId],
        "get_ads_by_user"
      );
      expect(result).toEqual(mockAds);
    });
  });

  describe("getAdsByLocation", () => {
    it("should return ads by city and state", async () => {
      const city = "São Paulo";
      const state = "SP";
      const mockAds = [
        { id: "ad-1", title: "Local Ad One", city: city, state: state },
        { id: "ad-2", title: "Local Ad Two", city: city, state: state },
      ];

      const mockResult = {
        rows: mockAds,
        rowCount: 2,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await adModel.getAdsByLocation(city, state);

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE city = $1 AND state = $2"),
        [city, state],
        "get_ads_by_location"
      );
      expect(result).toEqual(mockAds);
    });
  });

  describe("SQL Injection Prevention", () => {
    it("should use parameterized queries for all operations", async () => {
      const adData = {
        title: "'; DROP TABLE ads; --",
        description: "Malicious description",
        user_id: "user-123",
      };

      safePool.safeQuery.mockResolvedValue({
        rows: [{ id: "ad-123" }],
        rowCount: 1,
      });

      await adModel.createAd(adData);

      // Verify that safeQuery was called (which enforces parameterized queries)
      expect(safePool.safeQuery).toHaveBeenCalled();

      // Verify that the malicious input was passed as a parameter, not concatenated
      const [query, params] = safePool.safeQuery.mock.calls[0];
      expect(query).not.toContain("'; DROP TABLE ads; --");
      expect(params).toContain("'; DROP TABLE ads; --");
    });

    it("should prevent SQL injection in search operations", async () => {
      const maliciousSearch = "test'; DROP TABLE ads; --";

      safePool.safeQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      await adModel.searchAds(maliciousSearch);

      const [query, params] = safePool.safeQuery.mock.calls[0];
      expect(query).not.toContain("DROP TABLE");
      expect(params[0]).toBe(`%${maliciousSearch}%`);
    });

    it("should prevent SQL injection in location searches", async () => {
      const maliciousCity = "São Paulo'; DROP TABLE ads; --";
      const state = "SP";

      safePool.safeQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      await adModel.getAdsByLocation(maliciousCity, state);

      const [query, params] = safePool.safeQuery.mock.calls[0];
      expect(query).not.toContain("DROP TABLE");
      expect(params).toContain(maliciousCity);
    });
  });
});
