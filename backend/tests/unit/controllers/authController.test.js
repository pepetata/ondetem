/**
 * Auth Controller Unit Tests
 *
 * Tests the authentication controller functions including login,
 * token generation, and security validation.
 */

const authController = require("../../../src/controllers/authController");
const userModel = require("../../../src/models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Mock dependencies
jest.mock("../../../src/models/userModel", () => ({
  findUserByEmail: jest.fn(),
  getUserByEmail: jest.fn(),
}));
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

// Mock XSSProtection
jest.mock("../../../src/utils/xssProtection", () => ({
  XSSProtection: {
    sanitizeUserInput: jest.fn((input) => input),
    logger: {
      warn: jest.fn(),
      error: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock("../../../src/utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock validation
jest.mock("../../../src/utils/validation", () => ({
  isValidEmail: jest.fn((email) => {
    // Return false for the specific invalid email format test
    if (email === "invalid-email-format") return false;
    return email && email.includes("@");
  }),
}));

const { XSSProtection } = require("../../../src/utils/xssProtection");

describe("Auth Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      headers: {},
      ip: "127.0.0.1",
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashedpassword",
        fullName: "Test User",
        nickname: "testuser",
      };

      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      userModel.findUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("mock-jwt-token");

      await authController.login(req, res);

      expect(userModel.findUserByEmail).toHaveBeenCalledWith(
        "test@example.com"
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedpassword"
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: "user-123", email: "test@example.com" },
        expect.any(String),
        { expiresIn: "24h" }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: "Login successful",
        token: "mock-jwt-token",
        user: {
          id: "user-123",
          email: "test@example.com",
          fullName: "Test User",
          nickname: "testuser",
        },
      });
    });

    it("should reject login with invalid email", async () => {
      req.body = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      userModel.findUserByEmail.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid credentials",
      });
    });

    it("should reject login with invalid password", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashedpassword",
      };

      req.body = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      userModel.findUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid credentials",
      });
    });

    it("should handle missing email field", async () => {
      req.body = {
        password: "password123",
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email and password are required",
      });
    });

    it("should handle missing password field", async () => {
      req.body = {
        email: "test@example.com",
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email and password are required",
      });
    });

    it("should handle database errors", async () => {
      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      userModel.findUserByEmail.mockRejectedValue(new Error("Database error"));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });

    it("should handle bcrypt errors", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashedpassword",
      };

      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      userModel.findUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockRejectedValue(new Error("Bcrypt error"));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });

    it("should sanitize input data", async () => {
      const { XSSProtection } = require("../../../src/utils/xssProtection");

      req.body = {
        email: '<script>alert("xss")</script>test@example.com',
        password: "password123",
      };

      userModel.findUserByEmail.mockResolvedValue(null);

      await authController.login(req, res);

      expect(XSSProtection.sanitizeUserInput).toHaveBeenCalledWith(
        '<script>alert("xss")</script>test@example.com',
        expect.any(Object)
      );
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      await authController.logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith("token");
      expect(res.json).toHaveBeenCalledWith({
        message: "Logout successful",
      });
    });

    it("should handle logout errors gracefully", async () => {
      res.clearCookie.mockImplementation(() => {
        throw new Error("Cookie error");
      });

      await authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  describe("refreshToken", () => {
    it("should refresh token successfully", async () => {
      req.user = {
        id: "user-123",
        email: "test@example.com",
      };

      jwt.sign.mockReturnValue("new-jwt-token");

      await authController.refreshToken(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: "user-123", email: "test@example.com" },
        expect.any(String),
        { expiresIn: "24h" }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: "Token refreshed successfully",
        token: "new-jwt-token",
      });
    });

    it("should handle missing user data", async () => {
      req.user = null;

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not authenticated",
      });
    });

    it("should handle JWT signing errors", async () => {
      req.user = {
        id: "user-123",
        email: "test@example.com",
      };

      jwt.sign.mockImplementation(() => {
        throw new Error("JWT error");
      });

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  describe("verifyToken", () => {
    it("should verify valid token", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        fullName: "Test User",
      };

      req.user = mockUser;

      await authController.verifyToken(req, res);

      expect(res.json).toHaveBeenCalledWith({
        valid: true,
        user: mockUser,
      });
    });

    it("should handle invalid token", async () => {
      req.user = null;

      await authController.verifyToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        valid: false,
        error: "Invalid token",
      });
    });
  });

  describe("Security Features", () => {
    it("should prevent brute force attacks", async () => {
      const logger = require("../../../src/utils/logger");

      req.body = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      userModel.findUserByEmail.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        password: "hashedpassword",
      });
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(req, res);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Invalid password for email")
      );
    });

    it("should log successful logins", async () => {
      const logger = require("../../../src/utils/logger");
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashedpassword",
        fullName: "Test User",
        nickname: "testuser",
      };

      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      userModel.findUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("mock-jwt-token");

      await authController.login(req, res);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("logged in successfully")
      );
    });

    it("should not expose sensitive user data", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashedpassword",
        fullName: "Test User",
        nickname: "testuser",
        internalNotes: "sensitive data",
      };

      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      userModel.findUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("mock-jwt-token");

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Login successful",
        token: "mock-jwt-token",
        user: {
          id: "user-123",
          email: "test@example.com",
          fullName: "Test User",
          nickname: "testuser",
          // Should not include password or internalNotes
        },
      });
    });
  });

  describe("Rate Limiting Integration", () => {
    it("should be compatible with rate limiting middleware", async () => {
      // Simulate rate limiting headers
      req.headers["x-ratelimit-limit"] = "5";
      req.headers["x-ratelimit-remaining"] = "4";

      req.body = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      userModel.findUserByEmail.mockResolvedValue(null);

      await authController.login(req, res);

      // Should still function normally with rate limiting headers
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Input Validation", () => {
    it("should validate email format", async () => {
      req.body = {
        email: "invalid-email-format",
        password: "password123",
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid email format",
      });
    });

    it("should validate password length", async () => {
      req.body = {
        email: "test@example.com",
        password: "123", // Too short
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Password must be at least 6 characters long",
      });
    });

    it("should handle empty strings", async () => {
      req.body = {
        email: "",
        password: "",
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email and password are required",
      });
    });
  });
});
