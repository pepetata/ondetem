/**
 * Ads Controller Unit Tests
 *
 * Tests the adsController.js functions to ensure proper input sanitization,
 * error handling, and response formatting without database dependencies.
 */

// Mock dependencies
jest.mock("../../../src/models/adModel");
jest.mock("../../../src/utils/xssProtection", () => ({
  XSSProtection: {
    sanitizeUserInput: jest.fn((input) => input),
    sanitizeObject: jest.fn((obj) => obj),
    sanitizeURL: jest.fn((url) => url),
    sanitizeHTML: jest.fn((html) => html),
    sanitizeFilename: jest.fn((filename) => filename),
    logger: {
      warn: jest.fn(),
      error: jest.fn(),
    },
  },
}));

jest.mock("../../../src/utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const adsController = require("../../../src/controllers/adsController");
const adModel = require("../../../src/models/adModel");
const { XSSProtection } = require("../../../src/utils/xssProtection");

describe("Ads Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      files: [],
      headers: {},
      ip: "127.0.0.1",
      user: { id: 1, email: "test@example.com" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();

    // Setup model method mocks
    adModel.createAd = jest.fn();
    adModel.getAds = jest.fn();
    adModel.getAllAds = jest.fn();
    adModel.getAdById = jest.fn();
    adModel.updateAd = jest.fn();
    adModel.deleteAd = jest.fn();
  });

  describe("createAd", () => {
    beforeEach(() => {
      req.body = {
        title: "Test Ad",
        short: "Short description",
        description: "Long description",
        category: "test-category",
        subcategory: "test-subcategory",
        country: "BR",
        state: "SP",
        city: "São Paulo",
        price: "100.00",
      };
    });

    it("should create ad successfully with valid data", async () => {
      const mockAdId = 123;
      const mockCreatedAd = {
        id: mockAdId,
        title: "Test Ad",
        short: "Short description",
        description: "Long description",
        user_id: 1,
      };
      adModel.createAd.mockResolvedValue(mockAdId);
      adModel.getAdById.mockResolvedValue(mockCreatedAd);

      await adsController.createAd(req, res, next);

      expect(XSSProtection.sanitizeObject).toHaveBeenCalledWith(req.body);
      expect(adModel.createAd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Ad",
          short: "Short description",
          description: "Long description",
          category: "test-category",
          subcategory: "test-subcategory",
          country: "BR",
          state: "SP",
          city: "São Paulo",
          price: "100.00",
          user_id: 1,
        }),
        []
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ad created successfully",
        ...mockCreatedAd,
      });
    });

    it("should handle missing required fields", async () => {
      req.body = { title: "Test Ad" }; // Missing required fields

      await adsController.createAd(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining("Required fields missing"),
      });
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      adModel.createAd.mockRejectedValue(dbError);

      await adsController.createAd(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error creating ad",
      });
    });

    it("should handle file uploads correctly", async () => {
      const mockFiles = [
        { filename: "image1.jpg", path: "/uploads/image1.jpg" },
        { filename: "image2.jpg", path: "/uploads/image2.jpg" },
      ];
      req.files = mockFiles;
      adModel.createAd.mockResolvedValue(123);

      await adsController.createAd(req, res, next);

      expect(adModel.createAd).toHaveBeenCalledWith(
        expect.any(Object),
        mockFiles
      );
    });
  });

  describe("getAds", () => {
    it("should return all ads successfully", async () => {
      const mockAds = [
        { id: 1, title: "Ad 1", short: "Description 1" },
        { id: 2, title: "Ad 2", short: "Description 2" },
      ];
      adModel.getAds.mockResolvedValue(mockAds);

      await adsController.getAds(req, res, next);

      expect(adModel.getAds).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAds);
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      adModel.getAds.mockRejectedValue(dbError);

      await adsController.getAds(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error fetching ads",
      });
    });
  });

  describe("getAdById", () => {
    beforeEach(() => {
      req.params.id = "123";
    });

    it("should return ad by id successfully", async () => {
      const mockAd = { id: 123, title: "Test Ad", short: "Description" };
      adModel.getAdById.mockResolvedValue(mockAd);

      await adsController.getAdById(req, res, next);

      expect(XSSProtection.sanitizeUserInput).toHaveBeenCalledWith("123");
      expect(adModel.getAdById).toHaveBeenCalledWith("123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAd);
    });

    it("should return 404 for non-existent ad", async () => {
      adModel.getAdById.mockResolvedValue(null);

      await adsController.getAdById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Ad not found",
        message:
          "O anúncio solicitado não foi encontrado. Verifique se o ID está correto.",
      });
    });

    it("should handle invalid id format", async () => {
      req.params.id = "invalid-id";

      await adsController.getAdById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid ad ID",
      });
    });
  });

  describe("updateAd", () => {
    beforeEach(() => {
      req.params.id = "123";
      req.body = {
        title: "Updated Title",
        short: "Updated short description",
      };
    });

    it("should update ad successfully", async () => {
      adModel.updateAd.mockResolvedValue(true);

      await adsController.updateAd(req, res, next);

      expect(XSSProtection.sanitizeUserInput).toHaveBeenCalledWith("123");
      expect(XSSProtection.sanitizeObject).toHaveBeenCalledWith(req.body);
      expect(adModel.updateAd).toHaveBeenCalledWith("123", req.body, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ad updated successfully",
      });
    });

    it("should return 404 for non-existent ad", async () => {
      adModel.updateAd.mockResolvedValue(false);

      await adsController.updateAd(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Ad not found or not authorized",
      });
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      adModel.updateAd.mockRejectedValue(dbError);

      await adsController.updateAd(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error updating ad",
      });
    });
  });

  describe("deleteAd", () => {
    beforeEach(() => {
      req.params.id = "123";
    });

    it("should delete ad successfully", async () => {
      adModel.deleteAd.mockResolvedValue(true);

      await adsController.deleteAd(req, res, next);

      expect(XSSProtection.sanitizeUserInput).toHaveBeenCalledWith("123");
      expect(adModel.deleteAd).toHaveBeenCalledWith("123", 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ad deleted successfully",
      });
    });

    it("should return 404 for non-existent ad", async () => {
      adModel.deleteAd.mockResolvedValue(false);

      await adsController.deleteAd(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Ad not found or not authorized",
      });
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      adModel.deleteAd.mockRejectedValue(dbError);

      await adsController.deleteAd(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error deleting ad",
      });
    });
  });
});
