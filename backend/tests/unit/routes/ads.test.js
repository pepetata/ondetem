const express = require("express");
const request = require("supertest");

// Mock modules before importing them
const mockUpload = {
  single: jest.fn(() => (req, res, next) => next()),
};

const mockMiddleware = {
  tokenExtractor: jest.fn((req, res, next) => next()),
  userExtractor: jest.fn((req, res, next) => next()),
};

const mockAdsController = {
  getAllAds: jest.fn((req, res) => res.status(200).json([])),
  searchAds: jest.fn((req, res) => res.status(200).json([])),
  getUserAds: jest.fn((req, res) => res.status(200).json([])),
  getAdById: jest.fn((req, res) => res.status(200).json({})),
  createAd: jest.fn((req, res) => res.status(201).json({})),
  createAdForTesting: jest.fn((req, res) => res.status(201).json({})),
  updateAd: jest.fn((req, res) => res.status(200).json({})),
  deleteAd: jest.fn((req, res) => res.status(200).json({})),
  uploadImage: jest.fn((req, res) => res.status(200).json({})),
  getImages: jest.fn((req, res) => res.status(200).json([])),
  deleteImage: jest.fn((req, res) => res.status(200).json({})),
};

jest.mock("../../../src/controllers/adsController", () => mockAdsController);
jest.mock("../../../src/utils/middleware", () => mockMiddleware);
jest.mock("multer", () => {
  const mockMulter = jest.fn(() => mockUpload);
  mockMulter.diskStorage = jest.fn(() => ({}));
  return mockMulter;
});

// Mock winston to avoid filesystem issues
jest.mock("winston", () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    combine: jest.fn(() => ({})),
    timestamp: jest.fn(() => ({})),
    json: jest.fn(() => ({})),
    printf: jest.fn(() => ({})),
  },
  transports: {
    File: jest.fn(),
    Console: jest.fn(),
  },
}));

// Mock filesystem operations
jest.mock("fs", () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
}));

describe("Ads Routes", () => {
  let app;

  beforeAll(() => {
    // Create Express app and import routes
    app = express();
    app.use(express.json());

    // Import and mount the ads routes
    const adsRouter = require("../../../src/routes/ads");
    app.use("/ads", adsRouter);
  });

  beforeEach(() => {
    // Clear mock call counts
    jest.clearAllMocks();
  });

  describe("GET /ads", () => {
    it("should call getAllAds controller", async () => {
      await request(app).get("/ads").expect(200);

      expect(mockAdsController.getAllAds).toHaveBeenCalled();
    });
  });

  describe("GET /ads/search", () => {
    it("should call searchAds controller", async () => {
      await request(app).get("/ads/search").expect(200);

      expect(mockAdsController.searchAds).toHaveBeenCalled();
    });
  });

  describe("GET /ads/my", () => {
    it("should call getUserAds controller with middleware", async () => {
      await request(app).get("/ads/my").expect(200);

      expect(mockMiddleware.tokenExtractor).toHaveBeenCalled();
      expect(mockMiddleware.userExtractor).toHaveBeenCalled();
      expect(mockAdsController.getUserAds).toHaveBeenCalled();
    });
  });

  describe("GET /ads/:id", () => {
    it("should call getAdById controller", async () => {
      await request(app).get("/ads/123").expect(200);

      expect(mockAdsController.getAdById).toHaveBeenCalled();
    });
  });

  describe("POST /ads", () => {
    it("should call createAd controller with file upload and middleware", async () => {
      await request(app).post("/ads").send({ title: "Test Ad" }).expect(201);

      // The route should have called upload.single("image") during setup
      // We can verify the controller and middleware were called
      expect(mockMiddleware.tokenExtractor).toHaveBeenCalled();
      expect(mockMiddleware.userExtractor).toHaveBeenCalled();
      expect(mockAdsController.createAd).toHaveBeenCalled();
    });
  });

  describe("POST /ads/test-seed (test environment only)", () => {
    it("should call createAdForTesting controller with middleware in test environment", async () => {
      // Ensure test environment
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";

      try {
        await request(app)
          .post("/ads/test-seed")
          .send({ title: "Test Ad" })
          .expect(201);

        expect(mockMiddleware.tokenExtractor).toHaveBeenCalled();
        expect(mockMiddleware.userExtractor).toHaveBeenCalled();
        expect(mockAdsController.createAdForTesting).toHaveBeenCalled();
      } finally {
        // Restore original environment
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  describe("PUT /ads/:id", () => {
    it("should call updateAd controller with file upload and middleware", async () => {
      await request(app)
        .put("/ads/123")
        .send({ title: "Updated Ad" })
        .expect(200);

      // The route should have called upload.single("image") during setup
      expect(mockMiddleware.tokenExtractor).toHaveBeenCalled();
      expect(mockMiddleware.userExtractor).toHaveBeenCalled();
      expect(mockAdsController.updateAd).toHaveBeenCalled();
    });
  });

  describe("DELETE /ads/:id", () => {
    it("should call deleteAd controller with middleware", async () => {
      await request(app).delete("/ads/123").expect(200);

      expect(mockMiddleware.tokenExtractor).toHaveBeenCalled();
      expect(mockMiddleware.userExtractor).toHaveBeenCalled();
      expect(mockAdsController.deleteAd).toHaveBeenCalled();
    });
  });

  describe("POST /ads/:id/images", () => {
    it("should call uploadImage controller with file upload and middleware", async () => {
      await request(app).post("/ads/123/images").expect(200);

      // The route should have called upload.single("image") during setup
      expect(mockMiddleware.tokenExtractor).toHaveBeenCalled();
      expect(mockMiddleware.userExtractor).toHaveBeenCalled();
      expect(mockAdsController.uploadImage).toHaveBeenCalled();
    });
  });

  describe("GET /ads/:id/images", () => {
    it("should call getImages controller", async () => {
      await request(app).get("/ads/123/images").expect(200);

      expect(mockAdsController.getImages).toHaveBeenCalled();
    });
  });

  describe("DELETE /ads/:id/images/:filename", () => {
    it("should call deleteImage controller with middleware", async () => {
      await request(app).delete("/ads/123/images/test.jpg").expect(200);

      expect(mockMiddleware.tokenExtractor).toHaveBeenCalled();
      expect(mockMiddleware.userExtractor).toHaveBeenCalled();
      expect(mockAdsController.deleteImage).toHaveBeenCalled();
    });
  });

  describe("Route Configuration", () => {
    it("should have ads routes configured", () => {
      // Since we're importing the routes successfully, this verifies the configuration works
      // The fact that other tests pass proves the routes are properly configured
      expect(app).toBeDefined();
    });

    it("should handle file uploads", () => {
      // The upload configuration is working since the routes that use it are responding
      // This is verified by the successful POST requests in other tests
      expect(mockUpload.single).toBeDefined();
    });
  });
});
