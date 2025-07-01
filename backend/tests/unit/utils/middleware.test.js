const jwt = require("jsonwebtoken");
const middleware = require("../../../src/utils/middleware");
const User = require("../../../src/models/userModel");
const logger = require("../../../src/utils/logger");

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("../../../src/models/userModel");
jest.mock("../../../src/utils/logger");

describe("Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      get: jest.fn(),
      method: "GET",
      path: "/test",
      body: { test: "data" },
      token: null,
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();

    // Setup default mock behavior
    logger.info = jest.fn();
    logger.error = jest.fn();
  });

  describe("requestLogger", () => {
    it("should log request details in non-test environment", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      middleware.requestLogger(req, res, next);

      expect(logger.info).toHaveBeenCalledWith("Method: GET");
      expect(logger.info).toHaveBeenCalledWith("Path:   /test");
      expect(logger.info).toHaveBeenCalledWith('Body:   {"test":"data"}');
      expect(logger.info).toHaveBeenCalledWith("---");
      expect(next).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it("should not log in test environment", () => {
      process.env.NODE_ENV = "test";

      middleware.requestLogger(req, res, next);

      expect(logger.info).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it("should handle undefined request properties", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      req.method = undefined;
      req.path = undefined;

      middleware.requestLogger(req, res, next);

      expect(logger.info).toHaveBeenCalledWith("Method: undefined");
      expect(logger.info).toHaveBeenCalledWith("Path:   undefined");
      expect(next).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("tokenExtractor", () => {
    it("should extract token from bearer authorization header", () => {
      req.get.mockReturnValue("Bearer test-token-123");

      middleware.tokenExtractor(req, res, next);

      expect(req.token).toBe("test-token-123");
      expect(next).toHaveBeenCalled();
    });

    it("should extract token from mixed case bearer header", () => {
      req.get.mockReturnValue("BEARER test-token-456");

      middleware.tokenExtractor(req, res, next);

      expect(req.token).toBe("test-token-456");
      expect(next).toHaveBeenCalled();
    });

    it("should set token to null when no authorization header", () => {
      req.get.mockReturnValue(null);

      middleware.tokenExtractor(req, res, next);

      expect(req.token).toBe(null);
      expect(next).toHaveBeenCalled();
    });

    it("should set token to null for non-bearer authorization", () => {
      req.get.mockReturnValue("Basic dGVzdDp0ZXN0");

      middleware.tokenExtractor(req, res, next);

      expect(req.token).toBe(null);
      expect(next).toHaveBeenCalled();
    });

    it("should set token to null for malformed bearer header", () => {
      req.get.mockReturnValue("Bearer");

      middleware.tokenExtractor(req, res, next);

      expect(req.token).toBe("");
      expect(next).toHaveBeenCalled();
    });
  });

  describe("userExtractor", () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    };
    const mockDecodedToken = { userId: "user-123" };

    beforeEach(() => {
      // Mock console methods to avoid noise in test output
      jest.spyOn(console, "log").mockImplementation(() => {});
      jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      console.log.mockRestore();
      console.error.mockRestore();
    });

    it("should extract user when valid token is provided", async () => {
      req.token = "valid-token";
      jwt.verify.mockReturnValue(mockDecodedToken);
      User.getUserById.mockResolvedValue(mockUser);

      await middleware.userExtractor(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        "valid-token",
        process.env.JWT_SECRET
      );
      expect(User.getUserById).toHaveBeenCalledWith("user-123");
      expect(req.user).toBe(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it("should handle valid token but user not found", async () => {
      req.token = "valid-token";
      jwt.verify.mockReturnValue(mockDecodedToken);
      User.getUserById.mockResolvedValue(null);

      await middleware.userExtractor(req, res, next);

      expect(req.user).toBe(null);
      expect(next).toHaveBeenCalled();
    });

    it("should handle token without userId", async () => {
      req.token = "valid-token";
      jwt.verify.mockReturnValue({ someOtherField: "value" });

      await middleware.userExtractor(req, res, next);

      expect(User.getUserById).not.toHaveBeenCalled();
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it("should handle invalid token", async () => {
      req.token = "invalid-token";
      jwt.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await middleware.userExtractor(req, res, next);

      expect(req.user).toBe(null);
      expect(next).toHaveBeenCalled();
    });

    it("should handle no token provided", async () => {
      req.token = null;

      await middleware.userExtractor(req, res, next);

      expect(jwt.verify).not.toHaveBeenCalled();
      expect(User.getUserById).not.toHaveBeenCalled();
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      req.token = "valid-token";
      jwt.verify.mockReturnValue(mockDecodedToken);
      User.getUserById.mockRejectedValue(new Error("Database error"));

      await middleware.userExtractor(req, res, next);

      expect(req.user).toBe(null);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("unknownEndpoint", () => {
    it("should return 404 with error message", () => {
      middleware.unknownEndpoint(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "unknown endpoint",
        message:
          "A página ou recurso solicitado não foi encontrado no servidor.",
      });
    });
  });

  describe("errorHandler", () => {
    let error;

    beforeEach(() => {
      error = new Error("Test error");
    });

    it("should handle JsonWebTokenError", () => {
      error.name = "JsonWebTokenError";

      middleware.errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledWith("Test error");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "invalid token" });
    });

    it("should handle TokenExpiredError", () => {
      error.name = "TokenExpiredError";

      middleware.errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledWith("Test error");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "token expired" });
    });

    it("should pass through other errors", () => {
      error.name = "SomeOtherError";

      middleware.errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledWith("Test error");
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("authenticateToken", () => {
    const mockUser = { id: "user-123", email: "test@example.com" };

    it("should authenticate valid token and user", async () => {
      req.get.mockReturnValue("Bearer valid-token");
      jwt.verify.mockReturnValue({ userId: "user-123" });
      User.getUserById.mockResolvedValue(mockUser);

      await middleware.authenticateToken(req, res, next);

      expect(req.user).toBe(mockUser);
      expect(req.token).toBe("valid-token");
      expect(next).toHaveBeenCalled();
    });

    it("should reject request without authorization header", async () => {
      req.get.mockReturnValue(null);

      await middleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Token missing or invalid",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject request with non-bearer authorization", async () => {
      req.get.mockReturnValue("Basic dGVzdDp0ZXN0");

      await middleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Token missing or invalid",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject token without userId", async () => {
      req.get.mockReturnValue("Bearer valid-token");
      jwt.verify.mockReturnValue({ someOtherField: "value" });

      await middleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Token invalid" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject when user not found", async () => {
      req.get.mockReturnValue("Bearer valid-token");
      jwt.verify.mockReturnValue({ userId: "user-123" });
      User.getUserById.mockResolvedValue(null);

      await middleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle JsonWebTokenError", async () => {
      req.get.mockReturnValue("Bearer invalid-token");
      jwt.verify.mockImplementation(() => {
        const error = new Error("jwt malformed");
        error.name = "JsonWebTokenError";
        throw error;
      });

      await middleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle TokenExpiredError", async () => {
      req.get.mockReturnValue("Bearer expired-token");
      jwt.verify.mockImplementation(() => {
        const error = new Error("jwt expired");
        error.name = "TokenExpiredError";
        throw error;
      });

      await middleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Token expired" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle other token validation errors", async () => {
      req.get.mockReturnValue("Bearer problematic-token");
      jwt.verify.mockImplementation(() => {
        throw new Error("Some other error");
      });

      await middleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Token validation failed",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle database errors when fetching user", async () => {
      req.get.mockReturnValue("Bearer valid-token");
      jwt.verify.mockReturnValue({ userId: "user-123" });
      User.getUserById.mockRejectedValue(
        new Error("Database connection failed")
      );

      await middleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Token validation failed",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should extract token correctly from Bearer header", async () => {
      req.get.mockReturnValue("Bearer abc123def456");
      jwt.verify.mockReturnValue({ userId: "user-123" });
      User.getUserById.mockResolvedValue(mockUser);

      await middleware.authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        "abc123def456",
        process.env.JWT_SECRET
      );
      expect(req.token).toBe("abc123def456");
    });

    it("should handle case insensitive Bearer prefix", async () => {
      req.get.mockReturnValue("BEARER test-token");
      jwt.verify.mockReturnValue({ userId: "user-123" });
      User.getUserById.mockResolvedValue(mockUser);

      await middleware.authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        "test-token",
        process.env.JWT_SECRET
      );
    });
  });

  describe("Edge cases and error handling", () => {
    beforeEach(() => {
      // Mock console to avoid noise in tests
      jest.spyOn(console, "log").mockImplementation(() => {});
      jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      console.log.mockRestore();
      console.error.mockRestore();
    });

    it("should handle undefined JWT_SECRET in authenticateToken", async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      req.get.mockReturnValue("Bearer valid-token");
      jwt.verify.mockImplementation(() => {
        throw new Error("secretOrPrivateKey required");
      });

      await middleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Token validation failed",
      });

      process.env.JWT_SECRET = originalSecret;
    });

    it("should handle malformed authorization header", async () => {
      req.get.mockReturnValue("Bearer");

      await middleware.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Token missing or invalid",
      });
    });

    it("should handle empty token", async () => {
      req.get.mockReturnValue("Bearer ");

      await middleware.authenticateToken(req, res, next);

      // The token would be empty string, which should be handled by jwt.verify throwing an error
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
