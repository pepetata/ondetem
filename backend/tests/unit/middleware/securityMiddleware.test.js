/**
 * const { SecurityMiddleware } = require('../../../src/middleware/securityMiddleware');ecurity Middleware Unit Tests
 *
 * Tests the SecurityMiddleware class including security headers,
 * input sanitization, rate limiting, and error handling.
 */

const SecurityMiddleware = require("../../../src/middleware/securityMiddleware");
const express = require("express");
const request = require("supertest");

// Mock XSSProtection
jest.mock("../../../src/utils/xssProtection", () => ({
  XSSProtection: {
    sanitizeUserInput: jest.fn((input) => input),
    sanitizeObject: jest.fn((obj) => obj),
    sanitizeFilename: jest.fn((filename) => filename),
    generateCSP: jest.fn(({ allowInlineScripts, additionalSources }) => {
      const isDev =
        additionalSources &&
        additionalSources["script-src"] &&
        additionalSources["script-src"].includes("'unsafe-inline'");
      return isDev
        ? "default-src 'self'; script-src 'self' 'unsafe-inline'"
        : "default-src 'self'";
    }),
    logger: {
      warn: jest.fn(),
      error: jest.fn(),
    },
  },
}));

// Mock helmet
jest.mock("helmet", () => jest.fn(() => (req, res, next) => next()));

describe("SecurityMiddleware", () => {
  let app;
  let req, res, next;

  beforeEach(() => {
    app = express();
    req = {
      body: {},
      query: {},
      params: {},
      headers: {},
      ip: "127.0.0.1",
      method: "GET",
      path: "/test",
    };
    res = {
      setHeader: jest.fn(),
      removeHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("Security Headers", () => {
    it("should apply security headers middleware", () => {
      const middleware = SecurityMiddleware.securityHeaders();

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Security-Policy",
        expect.stringContaining("default-src 'self'")
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        "X-Content-Type-Options",
        "nosniff"
      );
      expect(res.setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
      expect(res.setHeader).toHaveBeenCalledWith(
        "X-XSS-Protection",
        "1; mode=block"
      );
      expect(next).toHaveBeenCalled();
    });

    it("should set HSTS header for HTTPS", () => {
      req.secure = true;
      const middleware = SecurityMiddleware.securityHeaders();

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains"
      );
    });

    it("should not set HSTS header for HTTP", () => {
      req.secure = false;
      const middleware = SecurityMiddleware.securityHeaders();

      middleware(req, res, next);

      expect(res.setHeader).not.toHaveBeenCalledWith(
        "Strict-Transport-Security",
        expect.any(String)
      );
    });

    it("should set different CSP for development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const middleware = SecurityMiddleware.securityHeaders();
      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Security-Policy",
        expect.stringContaining("'unsafe-inline'")
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Input Sanitization", () => {
    it("should sanitize request body", () => {
      const { XSSProtection } = require("../../../src/utils/xssProtection");
      req.body = {
        title: '<script>alert("xss")</script>Test',
        description: "Normal text",
      };

      const middleware = SecurityMiddleware.inputSanitization();
      middleware(req, res, next);

      expect(XSSProtection.sanitizeObject).toHaveBeenCalledWith(req.body);
      expect(next).toHaveBeenCalled();
    });

    it("should sanitize query parameters", () => {
      const { XSSProtection } = require("../../../src/utils/xssProtection");
      req.query = {
        search: '<script>alert("xss")</script>',
        filter: "safe text",
      };

      const middleware = SecurityMiddleware.inputSanitization();
      middleware(req, res, next);

      expect(XSSProtection.sanitizeObject).toHaveBeenCalledWith(req.query);
      expect(next).toHaveBeenCalled();
    });

    it("should sanitize route parameters", () => {
      const { XSSProtection } = require("../../../src/utils/xssProtection");
      req.params = {
        id: '<script>alert("xss")</script>',
        slug: "normal-slug",
      };

      const middleware = SecurityMiddleware.inputSanitization();
      middleware(req, res, next);

      expect(XSSProtection.sanitizeObject).toHaveBeenCalledWith(req.params);
      expect(next).toHaveBeenCalled();
    });

    it("should handle sanitization errors gracefully", () => {
      const { XSSProtection } = require("../../../src/utils/xssProtection");
      XSSProtection.sanitizeObject.mockImplementation(() => {
        throw new Error("Sanitization error");
      });

      req.body = { test: "data" };

      const middleware = SecurityMiddleware.inputSanitization();
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid input data",
        message: "Input validation failed",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("File Upload Protection", () => {
    it("should allow safe file types", () => {
      req.file = {
        mimetype: "image/jpeg",
        originalname: "test.jpg",
        size: 1000000, // 1MB
      };

      const middleware = SecurityMiddleware.fileUploadProtection();
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should block dangerous file types", () => {
      req.file = {
        mimetype: "application/x-executable",
        originalname: "malware.exe",
        size: 1000000,
      };

      const middleware = SecurityMiddleware.fileUploadProtection();
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "File type not allowed",
        allowedTypes: expect.any(Array),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should block files that are too large", () => {
      req.file = {
        mimetype: "image/jpeg",
        originalname: "large.jpg",
        size: 20000000, // 20MB
      };

      const middleware = SecurityMiddleware.fileUploadProtection({
        maxSize: 10000000,
      });
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "File too large",
        maxSize: "10.00 MB",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should block files with dangerous extensions", () => {
      req.file = {
        mimetype: "text/plain",
        originalname: "script.php",
        size: 1000,
      };

      const middleware = SecurityMiddleware.fileUploadProtection();
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "File extension not allowed",
        allowedExtensions: expect.any(Array),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle multiple files", () => {
      req.files = [
        {
          mimetype: "image/jpeg",
          originalname: "test1.jpg",
          size: 1000000,
        },
        {
          mimetype: "image/png",
          originalname: "test2.png",
          size: 2000000,
        },
      ];

      const middleware = SecurityMiddleware.fileUploadProtection();
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should block if any file in array is dangerous", () => {
      req.files = [
        {
          mimetype: "image/jpeg",
          originalname: "test1.jpg",
          size: 1000000,
        },
        {
          mimetype: "application/x-executable",
          originalname: "malware.exe",
          size: 1000000,
        },
      ];

      const middleware = SecurityMiddleware.fileUploadProtection();
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("should pass through when no files present", () => {
      // No req.file or req.files

      const middleware = SecurityMiddleware.fileUploadProtection();
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("Rate Limiting", () => {
    it("should create rate limiter with default options", () => {
      const limiter = SecurityMiddleware.rateLimiter();

      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe("function");
    });

    it("should create rate limiter with custom options", () => {
      const limiter = SecurityMiddleware.rateLimiter({
        windowMs: 60000,
        maxRequests: 100,
        message: "Custom rate limit message",
      });

      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe("function");
    });
  });

  describe("Error Handler", () => {
    it("should handle security errors", () => {
      const error = new Error("Security violation");
      error.type = "SECURITY_ERROR";

      const errorHandler = SecurityMiddleware.errorHandler();
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Security violation detected",
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it("should handle validation errors", () => {
      const error = new Error("Validation failed");
      error.type = "VALIDATION_ERROR";

      const errorHandler = SecurityMiddleware.errorHandler();
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Input validation failed",
        details: "Validation failed",
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it("should handle rate limit errors", () => {
      const error = new Error("Too many requests");
      error.type = "RATE_LIMIT_ERROR";

      const errorHandler = SecurityMiddleware.errorHandler();
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: "Too many requests",
        retryAfter: expect.any(Number),
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it("should pass through non-security errors", () => {
      const error = new Error("Regular error");

      const errorHandler = SecurityMiddleware.errorHandler();
      errorHandler(error, req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should not expose sensitive information in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("Database connection failed");
      error.type = "SECURITY_ERROR";

      const errorHandler = SecurityMiddleware.errorHandler();
      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        error: "Security violation detected",
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });

      process.env.NODE_ENV = originalEnv;
    });

    it("should include debug info in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("Detailed error message");
      error.type = "SECURITY_ERROR";
      error.stack = "Error stack trace...";

      const errorHandler = SecurityMiddleware.errorHandler();
      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          debug: {
            message: "Detailed error message",
            stack: "Error stack trace...",
          },
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("applyAll Method", () => {
    it("should apply all security middleware to express app", () => {
      const mockApp = {
        use: jest.fn(),
      };

      SecurityMiddleware.applyAll(mockApp);

      // Should apply multiple middleware functions
      expect(mockApp.use).toHaveBeenCalledTimes(13);
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function)); // helmet
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function)); // securityHeaders
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function)); // contentSecurityPolicy
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function)); // requestLogger
    });
  });

  describe("Integration Tests", () => {
    beforeEach(() => {
      app = express();
      app.use(express.json());
      SecurityMiddleware.applyAll(app);

      app.post("/api/test", (req, res) => {
        res.json({ received: req.body });
      });

      app.use(SecurityMiddleware.errorHandler());
    });

    it("should apply security headers to responses", async () => {
      const response = await request(app).get("/test").expect(404); // No GET handler, but headers should be applied

      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("DENY");
      expect(response.headers["x-xss-protection"]).toBe("1; mode=block");
    });

    it("should sanitize input data", async () => {
      const { XSSProtection } = require("../../../src/utils/xssProtection");
      XSSProtection.sanitizeObject.mockImplementation((obj) => {
        if (obj.title) obj.title = obj.title.replace(/<script>/g, "");
        return obj;
      });

      const response = await request(app)
        .post("/api/test")
        .send({ title: '<script>alert("xss")</script>Hello' })
        .expect(200);

      expect(XSSProtection.sanitizeObject).toHaveBeenCalled();
    });
  });
});
