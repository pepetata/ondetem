import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

describe("adAPI integration tests", () => {
  // Import modules dynamically to avoid hoisting issues
  let adAPI;
  let axios;

  beforeEach(async () => {
    // Mock localStorage and sessionStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
    Object.defineProperty(window, "sessionStorage", {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Mock axios before importing the API
    vi.doMock("axios", () => ({
      default: {
        post: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      },
    }));

    // Import the modules after mocking
    adAPI = await import("../src/api/adAPI");
    axios = await import("axios");
  });

  afterEach(() => {
    vi.doUnmock("axios");
    vi.resetAllMocks();
  });

  describe("getToken", () => {
    test("should get token from state when available", () => {
      const mockGetState = () => ({
        auth: { token: "state-token" },
      });

      const token = adAPI.getToken(mockGetState);
      expect(token).toBe("state-token");
    });

    test("should fallback to localStorage when state token not available", () => {
      const mockGetState = () => ({ auth: {} });
      localStorage.getItem.mockReturnValue("local-token");

      const token = adAPI.getToken(mockGetState);
      expect(token).toBe("local-token");
      expect(localStorage.getItem).toHaveBeenCalledWith("authToken");
    });

    test("should fallback to sessionStorage when localStorage not available", () => {
      const mockGetState = () => ({ auth: {} });
      localStorage.getItem.mockReturnValue(null);
      sessionStorage.getItem.mockReturnValue("session-token");

      const token = adAPI.getToken(mockGetState);
      expect(token).toBe("session-token");
      expect(sessionStorage.getItem).toHaveBeenCalledWith("authToken");
    });
  });

  describe("createAd", () => {
    test("should create ad with form data and token", async () => {
      const mockToken = "fake-jwt-token";
      const mockFormData = new FormData();
      mockFormData.append("title", "Test Ad");
      mockFormData.append("description", "Test Description");

      const mockResponse = {
        data: { id: 123, title: "Test Ad", success: true },
      };

      axios.default.post.mockResolvedValue(mockResponse);

      const result = await adAPI.createAd(mockFormData, mockToken);

      expect(axios.default.post).toHaveBeenCalledTimes(1);
      expect(axios.default.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/ads/"),
        mockFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getAllAds", () => {
    test("should get all ads", async () => {
      const mockResponse = {
        data: [
          { id: 1, title: "Ad 1" },
          { id: 2, title: "Ad 2" },
        ],
      };

      axios.default.get.mockResolvedValue(mockResponse);

      const result = await adAPI.getAllAds();

      expect(axios.default.get).toHaveBeenCalledTimes(1);
      expect(axios.default.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/ads/")
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getAd", () => {
    test("should get single ad by ID", async () => {
      const mockAdId = "123";
      const mockResponse = {
        data: { id: 123, title: "Test Ad", description: "Test Description" },
      };

      axios.default.get.mockResolvedValue(mockResponse);

      const result = await adAPI.getAd(mockAdId);

      expect(axios.default.get).toHaveBeenCalledTimes(1);
      expect(axios.default.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/ads/${mockAdId}`)
      );
      expect(result).toEqual(mockResponse.data);
    });
  });
});
