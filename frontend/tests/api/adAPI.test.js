import { describe, it, expect, vi, beforeEach } from "vitest";
import { adAPI } from "../../src/api/adAPI";

// Mock fetch globally
global.fetch = vi.fn();

describe("adAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
  });

  describe("createAd", () => {
    it("should make POST request to create ad with FormData", async () => {
      const mockResponse = {
        id: 1,
        title: "Test Ad",
        description: "Test Description",
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const formData = new FormData();
      formData.append("title", "Test Ad");
      formData.append("description", "Test Description");

      const result = await adAPI.createAd(formData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/ads"),
        expect.objectContaining({
          method: "POST",
          body: formData,
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error when ad creation fails", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Invalid ad data" }),
      });

      const formData = new FormData();

      await expect(adAPI.createAd(formData)).rejects.toThrow();
    });
  });

  describe("getAds", () => {
    it("should make GET request to fetch ads", async () => {
      const mockAds = [
        { id: 1, title: "Ad 1", description: "Description 1" },
        { id: 2, title: "Ad 2", description: "Description 2" },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAds,
      });

      const result = await adAPI.getAds();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/ads"),
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result).toEqual(mockAds);
    });

    it("should handle query parameters", async () => {
      const mockAds = [];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAds,
      });

      const params = { search: "test", category: "electronics" };
      await adAPI.getAds(params);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/ads\?.*search=test.*category=electronics/),
        expect.objectContaining({
          method: "GET",
        })
      );
    });
  });

  describe("getAdById", () => {
    it("should make GET request to fetch specific ad", async () => {
      const mockAd = {
        id: 1,
        title: "Test Ad",
        description: "Test Description",
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAd,
      });

      const result = await adAPI.getAdById(1);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/ads/1"),
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result).toEqual(mockAd);
    });

    it("should throw error when ad not found", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Ad not found" }),
      });

      await expect(adAPI.getAdById(999)).rejects.toThrow();
    });
  });

  describe("updateAd", () => {
    it("should make PUT request to update ad", async () => {
      const mockResponse = { id: 1, title: "Updated Ad" };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const formData = new FormData();
      formData.append("title", "Updated Ad");

      const result = await adAPI.updateAd(1, formData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/ads/1"),
        expect.objectContaining({
          method: "PUT",
          body: formData,
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("deleteAd", () => {
    it("should make DELETE request to remove ad", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Ad deleted successfully" }),
      });

      const result = await adAPI.deleteAd(1);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/ads/1"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
      expect(result).toBeDefined();
    });

    it("should throw error when deletion fails", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: "Unauthorized" }),
      });

      await expect(adAPI.deleteAd(1)).rejects.toThrow();
    });
  });

  describe("getMyAds", () => {
    it("should make GET request to fetch user ads", async () => {
      const mockAds = [{ id: 1, title: "My Ad 1", userId: 1 }];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAds,
      });

      const result = await adAPI.getMyAds();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/ads/my"),
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result).toEqual(mockAds);
    });
  });
});
