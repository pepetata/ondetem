import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

// Mock axios completely
vi.mock("axios");

// Mock the adAPI module but import the original to keep the actual implementations
vi.mock("../../src/api/adAPI", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
  };
});

import * as adAPI from "../../src/api/adAPI";

const mockedAxios = vi.mocked(axios, true);

describe("adAPI integration tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getToken", () => {
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    it("should get token from state when available", () => {
      const mockGetState = vi.fn(() => ({
        auth: { token: "state-token" },
      }));

      const token = adAPI.getToken(mockGetState);
      expect(token).toBe("state-token");
    });

    it("should fallback to localStorage when state token not available", () => {
      const mockGetState = vi.fn(() => ({}));
      vi.spyOn(Storage.prototype, "getItem").mockReturnValue("local-token");

      const token = adAPI.getToken(mockGetState);
      expect(token).toBe("local-token");
      expect(localStorage.getItem).toHaveBeenCalledWith("authToken");
    });

    it("should fallback to sessionStorage when localStorage not available", () => {
      const mockGetState = vi.fn(() => ({}));
      vi.spyOn(Storage.prototype, "getItem")
        .mockReturnValueOnce(null) // localStorage
        .mockReturnValueOnce("session-token"); // sessionStorage

      const token = adAPI.getToken(mockGetState);
      expect(token).toBe("session-token");
      expect(sessionStorage.getItem).toHaveBeenCalledWith("authToken");
    });
  });

  describe("createAd", () => {
    it("should create ad with form data and token", async () => {
      const mockFormData = new FormData();
      mockFormData.append("title", "Test Ad");
      const mockToken = "test-token";
      const mockResponse = { data: { id: 1, title: "Test Ad" } };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await adAPI.createAd(mockFormData, mockToken);

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/ads/"),
        mockFormData,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getAllAds", () => {
    it("should get all ads", async () => {
      const mockResponse = { data: [{ id: 1, title: "Test Ad" }] };

      axios.get.mockResolvedValue(mockResponse);

      const result = await adAPI.getAllAds();

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/ads/")
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getAd", () => {
    it("should get single ad by ID", async () => {
      const mockAdId = 1;
      const mockResponse = { data: { id: 1, title: "Test Ad" } };

      axios.get.mockResolvedValue(mockResponse);

      const result = await adAPI.getAd(mockAdId);

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/ads/${mockAdId}`)
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw error when ad not found", async () => {
      axios.get.mockRejectedValue(new Error("Ad not found"));

      await expect(adAPI.getAd(999)).rejects.toThrow("Ad not found");
    });
  });

  describe("searchAds", () => {
    it("should search ads with query parameters", async () => {
      const mockSearchTerm = "test search";
      const mockResponse = { data: [{ id: 1, title: "Test Ad" }] };

      axios.get.mockResolvedValue(mockResponse);

      const result = await adAPI.searchAds(mockSearchTerm);

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/ads/search"),
        expect.objectContaining({
          params: { q: mockSearchTerm },
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("updateAd", () => {
    it("should update ad with form data and token", async () => {
      const mockAdId = 1;
      const mockFormData = new FormData();
      mockFormData.append("title", "Updated Ad");
      const mockToken = "test-token";
      const mockResponse = { data: { id: 1, title: "Updated Ad" } };

      axios.put.mockResolvedValue(mockResponse);

      const result = await adAPI.updateAd(mockAdId, mockFormData, mockToken);

      expect(axios.put).toHaveBeenCalledTimes(1);
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining(`/api/ads/${mockAdId}`),
        mockFormData,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("deleteAd", () => {
    it("should delete ad with token", async () => {
      const mockAdId = 1;
      const mockToken = "test-token";
      const mockResponse = { data: { message: "Ad deleted successfully" } };

      axios.delete.mockResolvedValue(mockResponse);

      const result = await adAPI.deleteAd(mockAdId, mockToken);

      expect(axios.delete).toHaveBeenCalledTimes(1);
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining(`/api/ads/${mockAdId}`),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getUserAds", () => {
    it("should get user's ads with token", async () => {
      const mockToken = "test-token";
      const mockResponse = { data: [{ id: 1, title: "My Ad" }] };

      axios.get.mockResolvedValue(mockResponse);

      const result = await adAPI.getUserAds(mockToken);

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/ads/my"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });
});
