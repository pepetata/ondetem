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

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

jest.mock("../../../src/utils/validation", () => ({
  isValidUUID: jest.fn((id) => {
    // Mock UUID validation - return true for valid UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }),
}));

// Mock winston to avoid filesystem issues
jest.mock("winston", () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    prettyPrint: jest.fn(),
  },
  transports: {
    File: jest.fn(),
    Console: jest.fn(),
  },
}));

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn(),
  statSync: jest.fn(),
  createWriteStream: jest.fn(() => ({
    on: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
  })),
  stat: jest.fn((path, callback) => callback(null, { isFile: () => true })),
  open: jest.fn((path, flags, callback) => callback(null, 1)),
  write: jest.fn((fd, data, callback) => callback(null, data.length, data)),
  close: jest.fn((fd, callback) => callback(null)),
  promises: {
    writeFile: jest.fn(),
    unlink: jest.fn(),
    stat: jest.fn(),
  },
}));

const adsController = require("../../../src/controllers/adsController");
const adModel = require("../../../src/models/adModel");
const { XSSProtection } = require("../../../src/utils/xssProtection");
const fs = require("fs");
const { isValidUUID } = require("../../../src/utils/validation");

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
    adModel.searchAds = jest.fn();
    adModel.getUserAds = jest.fn();
    adModel.getAdImages = jest.fn();
    adModel.addAdImage = jest.fn();
    adModel.deleteAdImage = jest.fn();
    adModel.getUserAds = jest.fn();
    adModel.searchAds = jest.fn();
    adModel.getAdImages = jest.fn();
    adModel.addAdImage = jest.fn();
    adModel.deleteAdImage = jest.fn();
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

    it("should handle unauthenticated user", async () => {
      req.user = null;

      await adsController.createAd(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not authenticated",
      });
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

  describe("getAllAds", () => {
    it("should return all ads successfully", async () => {
      const mockAds = [
        { id: 1, title: "Ad 1", short: "Description 1" },
        { id: 2, title: "Ad 2", short: "Description 2" },
      ];
      adModel.getAllAds.mockResolvedValue(mockAds);

      await adsController.getAllAds(req, res, next);

      expect(adModel.getAllAds).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAds);
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      adModel.getAllAds.mockRejectedValue(dbError);

      await adsController.getAllAds(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error fetching ads",
      });
    });
  });

  describe("searchAds", () => {
    it("should search ads with valid query", async () => {
      const mockAds = [
        { id: 1, title: "Test Ad", description: "Test description" },
      ];
      req.query.q = "test";
      adModel.searchAds.mockResolvedValue(mockAds);

      await adsController.searchAds(req, res, next);

      expect(adModel.searchAds).toHaveBeenCalledWith("test");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAds);
    });

    it("should return all ads when no search query provided", async () => {
      const mockAds = [
        { id: 1, title: "Ad 1" },
        { id: 2, title: "Ad 2" },
      ];
      req.query.q = "";
      adModel.getAllAds.mockResolvedValue(mockAds);

      await adsController.searchAds(req, res, next);

      expect(adModel.getAllAds).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAds);
    });

    it("should return all ads when query is only whitespace", async () => {
      const mockAds = [
        { id: 1, title: "Ad 1" },
        { id: 2, title: "Ad 2" },
      ];
      req.query.q = "   ";
      adModel.getAllAds.mockResolvedValue(mockAds);

      await adsController.searchAds(req, res, next);

      expect(adModel.getAllAds).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAds);
    });

    it("should return all ads when query is undefined", async () => {
      const mockAds = [
        { id: 1, title: "Ad 1" },
        { id: 2, title: "Ad 2" },
      ];
      req.query = {};
      adModel.getAllAds.mockResolvedValue(mockAds);

      await adsController.searchAds(req, res, next);

      expect(adModel.getAllAds).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAds);
    });

    it("should handle database errors", async () => {
      req.query.q = "test";
      const dbError = new Error("Database connection failed");
      adModel.searchAds.mockRejectedValue(dbError);

      await adsController.searchAds(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to search ads",
      });
    });
  });

  describe("createAdForTesting", () => {
    beforeEach(() => {
      req.body = {
        title: "Test Ad",
        description: "Test description",
      };
    });

    it("should create test ad successfully", async () => {
      const mockAdId = 123;
      adModel.createAd.mockResolvedValue(mockAdId);

      await adsController.createAdForTesting(req, res, next);

      expect(XSSProtection.sanitizeObject).toHaveBeenCalledWith(req.body);
      expect(adModel.createAd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Ad",
          description: "Test description",
          user_id: 1,
        }),
        []
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Test ad created successfully",
        adId: mockAdId,
        id: mockAdId,
      });
    });

    it("should handle missing required fields", async () => {
      req.body = { title: "Test Ad" }; // Missing description

      await adsController.createAdForTesting(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Required fields missing",
      });
    });

    it("should handle unauthenticated user", async () => {
      req.user = null;

      await adsController.createAdForTesting(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not authenticated",
      });
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      adModel.createAd.mockRejectedValue(dbError);

      await adsController.createAdForTesting(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error creating test ad",
      });
    });
  });

  describe("getUserAds", () => {
    it("should return user ads successfully", async () => {
      const mockUserAds = [
        { id: 1, title: "User Ad 1", user_id: 1 },
        { id: 2, title: "User Ad 2", user_id: 1 },
      ];
      adModel.getUserAds.mockResolvedValue(mockUserAds);

      await adsController.getUserAds(req, res, next);

      expect(adModel.getUserAds).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUserAds);
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      adModel.getUserAds.mockRejectedValue(dbError);

      await adsController.getUserAds(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to fetch user ads",
      });
    });
  });

  describe("uploadImage", () => {
    beforeEach(() => {
      req.params.id = "123";
      req.file = {
        filename: "test-image.jpg",
        path: "/uploads/test-image.jpg",
      };
    });

    it("should upload image successfully", async () => {
      const mockImages = ["image1.jpg", "image2.jpg"];
      adModel.getAdImages.mockResolvedValue(mockImages);
      adModel.addAdImage.mockResolvedValue(true);

      await adsController.uploadImage(req, res, next);

      expect(adModel.getAdImages).toHaveBeenCalledWith("123");
      expect(adModel.addAdImage).toHaveBeenCalledWith("123", "test-image.jpg");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        filename: "test-image.jpg",
      });
    });

    it("should handle missing file", async () => {
      req.file = null;

      await adsController.uploadImage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "No file uploaded",
      });
    });

    it("should handle maximum images reached", async () => {
      const mockImages = [
        "img1.jpg",
        "img2.jpg",
        "img3.jpg",
        "img4.jpg",
        "img5.jpg",
      ];
      adModel.getAdImages.mockResolvedValue(mockImages);
      fs.unlinkSync.mockImplementation(() => {});

      await adsController.uploadImage(req, res, next);

      expect(fs.unlinkSync).toHaveBeenCalledWith("/uploads/test-image.jpg");
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Maximum 5 images per ad",
      });
    });

    it("should handle database error when getting images", async () => {
      const dbError = new Error("Database connection failed");
      adModel.getAdImages.mockRejectedValue(dbError);

      await adsController.uploadImage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to upload image",
      });
    });

    it("should handle database error when adding image", async () => {
      const mockImages = ["image1.jpg"];
      adModel.getAdImages.mockResolvedValue(mockImages);
      const dbError = new Error("Database connection failed");
      adModel.addAdImage.mockRejectedValue(dbError);

      await adsController.uploadImage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to upload image",
      });
    });

    it("should handle file system error", async () => {
      const mockImages = [
        "img1.jpg",
        "img2.jpg",
        "img3.jpg",
        "img4.jpg",
        "img5.jpg",
      ];
      adModel.getAdImages.mockResolvedValue(mockImages);
      fs.unlinkSync.mockImplementation(() => {
        throw new Error("File system error");
      });

      await adsController.uploadImage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to upload image",
      });
    });
  });

  describe("getImages", () => {
    beforeEach(() => {
      req.params.id = "123";
    });

    it("should return ad images successfully", async () => {
      const mockImages = ["image1.jpg", "image2.jpg"];
      adModel.getAdImages.mockResolvedValue(mockImages);

      await adsController.getImages(req, res, next);

      expect(adModel.getAdImages).toHaveBeenCalledWith("123");
      expect(res.json).toHaveBeenCalledWith(mockImages);
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      adModel.getAdImages.mockRejectedValue(dbError);

      await adsController.getImages(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to fetch images",
      });
    });
  });

  describe("deleteImage", () => {
    beforeEach(() => {
      req.params.id = "123";
      req.params.filename = "test-image.jpg";
    });

    it("should delete image successfully", async () => {
      adModel.deleteAdImage.mockResolvedValue(true);
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {});

      await adsController.deleteImage(req, res, next);

      expect(adModel.deleteAdImage).toHaveBeenCalledWith(
        "123",
        "test-image.jpg"
      );
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Image deleted",
      });
    });

    it("should handle image not found in database", async () => {
      adModel.deleteAdImage.mockResolvedValue(false);

      await adsController.deleteImage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Image not found",
      });
    });

    it("should handle file not found on disk", async () => {
      adModel.deleteAdImage.mockResolvedValue(true);
      fs.existsSync.mockReturnValue(false);

      await adsController.deleteImage(req, res, next);

      expect(adModel.deleteAdImage).toHaveBeenCalledWith(
        "123",
        "test-image.jpg"
      );
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Image deleted",
      });
    });

    it("should handle file system error", async () => {
      adModel.deleteAdImage.mockResolvedValue(true);
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {
        throw new Error("File system error");
      });

      await adsController.deleteImage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to delete image",
      });
    });

    it("should handle database error", async () => {
      const dbError = new Error("Database connection failed");
      adModel.deleteAdImage.mockRejectedValue(dbError);

      await adsController.deleteImage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to delete image",
      });
    });
  });

  // Additional edge cases for existing functions
  describe("Additional edge cases", () => {
    describe("getAdById edge cases", () => {
      it("should handle database error", async () => {
        req.params.id = "123e4567-e89b-42d3-a456-426614174000";
        const dbError = new Error("Database connection failed");
        adModel.getAdById.mockRejectedValue(dbError);

        await adsController.getAdById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to fetch ad",
        });
      });

      it("should handle non-UUID id format", async () => {
        req.params.id = "not-a-uuid";

        await adsController.getAdById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: "Ad not found",
          message:
            "O anúncio solicitado não foi encontrado. Verifique se o ID está correto.",
        });
      });
    });

    describe("updateAd edge cases", () => {
      beforeEach(() => {
        req.params.id = "123";
        req.body = { title: "Updated Title" };
      });

      it("should handle missing ad ID", async () => {
        req.params.id = "";

        await adsController.updateAd(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Ad ID is required",
        });
      });

      it("should handle unauthenticated user", async () => {
        req.user = null;

        await adsController.updateAd(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: "User not authenticated",
        });
      });
    });

    describe("deleteAd edge cases", () => {
      beforeEach(() => {
        req.params.id = "123";
      });

      it("should handle unauthenticated user", async () => {
        req.user = null;

        await adsController.deleteAd(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: "User not authenticated",
        });
      });
    });
  });
});
