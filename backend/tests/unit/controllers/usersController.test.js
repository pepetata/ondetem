/**
 * Users Controller Unit Tests
 *
 * Tests the usersController.js functions to ensure proper input sanitization,
 * error handling, and response formatting without database dependencies.
 */

// Mock dependencies
jest.mock("../../../src/models/userModel", () => ({
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
  getUsers: jest.fn(),
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));
jest.mock("../../../src/utils/xssProtection", () => ({
  XSSProtection: {
    sanitizeUserInput: jest.fn((input) => input),
    sanitizeObject: jest.fn((obj) => obj),
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

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashedPassword"),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../../src/utils/validation", () => ({
  isValidUUID: jest.fn((id) => {
    // Mock UUID validation - return true for valid UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }),
  isValidEmail: jest.fn((email) => {
    // Mock email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }),
}));

const usersController = require("../../../src/controllers/usersController");
const userModel = require("../../../src/models/userModel");
const { XSSProtection } = require("../../../src/utils/xssProtection");
const { isValidUUID, isValidEmail } = require("../../../src/utils/validation");
const bcrypt = require("bcrypt");

describe("Users Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      file: null,
      headers: {},
      ip: "127.0.0.1",
      user: { id: "1", email: "test@example.com" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    beforeEach(() => {
      req.body = {
        fullName: "Test User",
        nickname: "testuser",
        email: "test@example.com",
        password: "password123",
        country: "BR",
        state: "SP",
        city: "São Paulo",
      };
    });

    it("should create user successfully with valid data", async () => {
      const mockUserId = 123;
      userModel.findUserByEmail.mockResolvedValue(null);
      userModel.createUser.mockResolvedValue(mockUserId);

      await usersController.createUser(req, res, next);

      expect(XSSProtection.sanitizeObject).toHaveBeenCalledWith(req.body);
      expect(userModel.findUserByEmail).toHaveBeenCalledWith(
        "test@example.com"
      );
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(userModel.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Test User",
          nickname: "testuser",
          email: "test@example.com",
          password: "hashedPassword",
        }),
        null
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "User created successfully",
        userId: mockUserId,
      });
    });

    it("should handle existing email error", async () => {
      const existingUser = { id: 1, email: "test@example.com" };
      userModel.findUserByEmail.mockResolvedValue(existingUser);

      await usersController.createUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email already registered",
      });
    });

    it("should handle missing required fields", async () => {
      req.body = { fullName: "Test User" }; // Missing required fields

      await usersController.createUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Primeiro nome ou apelido é obrigatório!",
      });
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      userModel.findUserByEmail.mockRejectedValue(dbError);

      await usersController.createUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error creating user",
      });
    });

    it("should handle profile photo upload", async () => {
      const mockFile = {
        filename: "profile.jpg",
        path: "/uploads/profile.jpg",
      };
      req.file = mockFile;
      userModel.findUserByEmail.mockResolvedValue(null);
      userModel.createUser.mockResolvedValue(123);

      await usersController.createUser(req, res, next);

      expect(userModel.createUser).toHaveBeenCalledWith(
        expect.any(Object),
        mockFile
      );
    });
  });

  describe("getUsers", () => {
    it("should return all users successfully", async () => {
      const mockUsers = [
        { id: 1, fullName: "User 1", email: "user1@example.com" },
        { id: 2, fullName: "User 2", email: "user2@example.com" },
      ];
      userModel.getUsers.mockResolvedValue(mockUsers);

      await usersController.getUsers(req, res, next);

      expect(userModel.getUsers).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      userModel.getUsers.mockRejectedValue(dbError);

      await usersController.getUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error fetching users",
      });
    });
  });

  describe("getAllUsers", () => {
    it("should return all users successfully", async () => {
      const mockUsers = [
        { id: 1, fullName: "User 1", email: "user1@example.com" },
        { id: 2, fullName: "User 2", email: "user2@example.com" },
      ];
      userModel.getAllUsers.mockResolvedValue(mockUsers);

      await usersController.getAllUsers(req, res, next);

      expect(userModel.getAllUsers).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      userModel.getAllUsers.mockRejectedValue(dbError);

      await usersController.getAllUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to fetch users",
      });
    });
  });

  describe("getUserById", () => {
    beforeEach(() => {
      req.params.id = "123e4567-e89b-42d3-a456-426614174000";
    });

    it("should return user by id successfully", async () => {
      const mockUser = {
        id: "123e4567-e89b-42d3-a456-426614174000",
        fullName: "Test User",
        email: "test@example.com",
      };
      userModel.getUserById.mockResolvedValue(mockUser);

      await usersController.getUserById(req, res, next);

      expect(XSSProtection.sanitizeUserInput).toHaveBeenCalledWith(
        "123e4567-e89b-42d3-a456-426614174000"
      );
      expect(userModel.getUserById).toHaveBeenCalledWith(
        "123e4567-e89b-42d3-a456-426614174000"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return 404 for non-existent user", async () => {
      userModel.getUserById.mockResolvedValue(null);

      await usersController.getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not found",
        message:
          "O usuário solicitado não foi encontrado. Verifique se o ID está correto.",
      });
    });

    it("should handle invalid id format", async () => {
      req.params.id = "invalid-id";
      userModel.getUserById.mockResolvedValue(null);

      await usersController.getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not found",
        message:
          "O usuário solicitado não foi encontrado. Verifique se o ID está correto.",
      });
    });

    it("should handle database error", async () => {
      req.params.id = "123e4567-e89b-42d3-a456-426614174000";
      const dbError = new Error("Database connection failed");
      userModel.getUserById.mockRejectedValue(dbError);

      await usersController.getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to fetch user",
        message: "Erro interno do servidor. Tente novamente mais tarde.",
      });
    });
  });

  describe("getUserByEmail", () => {
    beforeEach(() => {
      req.params.email = "test@example.com";
    });

    it("should return user by email successfully", async () => {
      const mockUser = {
        id: "123e4567-e89b-42d3-a456-426614174000",
        fullName: "Test User",
        email: "test@example.com",
      };
      userModel.getUserByEmail.mockResolvedValue(mockUser);

      await usersController.getUserByEmail(req, res, next);

      expect(userModel.getUserByEmail).toHaveBeenCalledWith("test@example.com");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return 404 for non-existent user", async () => {
      userModel.getUserByEmail.mockResolvedValue(null);

      await usersController.getUserByEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not found",
        message: "O usuário solicitado não foi encontrado.",
      });
    });

    it("should handle invalid email format", async () => {
      req.params.email = "invalid-email";

      await usersController.getUserByEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not found",
        message:
          "O usuário solicitado não foi encontrado. Verifique se o email está correto.",
      });
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      userModel.getUserByEmail.mockRejectedValue(dbError);

      await usersController.getUserByEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to fetch user by email",
        message: "Erro interno do servidor. Tente novamente mais tarde.",
      });
    });
  });

  describe("getCurrentUser", () => {
    beforeEach(() => {
      req.user = { userId: "123e4567-e89b-42d3-a456-426614174000" };
    });

    it("should return current user successfully", async () => {
      const mockUser = {
        id: "123e4567-e89b-42d3-a456-426614174000",
        fullName: "Current User",
        email: "current@example.com",
      };
      userModel.getUserById.mockResolvedValue(mockUser);

      await usersController.getCurrentUser(req, res, next);

      expect(userModel.getUserById).toHaveBeenCalledWith(
        "123e4567-e89b-42d3-a456-426614174000"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return 404 for non-existent current user", async () => {
      userModel.getUserById.mockResolvedValue(null);

      await usersController.getCurrentUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not found",
      });
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      userModel.getUserById.mockRejectedValue(dbError);

      await usersController.getCurrentUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to fetch current user",
      });
    });
  });

  // Additional edge cases for existing functions
  describe("Additional edge cases", () => {
    describe("createUser edge cases", () => {
      it("should handle no body in request", async () => {
        req.body = null;

        await usersController.createUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "No data received",
        });
      });

      it("should handle invalid email format in validation", async () => {
        req.body = {
          fullName: "Test User",
          nickname: "testuser",
          email: "invalid-email",
          password: "password123",
        };

        await usersController.createUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Email inválido",
        });
      });

      it("should handle user creation without password", async () => {
        req.body = {
          fullName: "Test User",
          nickname: "testuser",
          email: "test@example.com",
          // No password provided
        };

        await usersController.createUser(req, res, next);

        // Should return validation error because password is required
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: expect.stringContaining("Senha é obrigatório"),
        });
        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(userModel.createUser).not.toHaveBeenCalled();
      });
    });

    describe("updateUser edge cases", () => {
      beforeEach(() => {
        req.params.id = "1";
        req.body = { fullName: "Updated Name" };
      });

      it("should handle unauthenticated user", async () => {
        req.user = null;

        await usersController.updateUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: "Authentication required",
        });
      });

      it("should handle unauthorized user trying to update another user", async () => {
        req.user = { id: "2", email: "other@example.com" };
        req.params.id = "1";

        await usersController.updateUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: "Access denied",
        });
      });

      it("should handle missing user ID", async () => {
        req.params = { id: "1" }; // Set user ID to match authenticated user
        req.params.id = undefined; // Then remove it to test missing ID

        await usersController.updateUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: "Access denied",
        });
      });

      it("should handle validation errors", async () => {
        req.body = { email: "invalid-email" };

        await usersController.updateUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: expect.stringContaining(""), // Any validation error message
        });
      });
    });

    describe("deleteUser edge cases", () => {
      beforeEach(() => {
        req.params.id = "1";
      });

      it("should handle unauthenticated user", async () => {
        req.user = null;

        await usersController.deleteUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: "Authentication required",
        });
      });

      it("should handle unauthorized user trying to delete another user", async () => {
        req.user = { id: "2", email: "other@example.com" };
        req.params.id = "1";

        await usersController.deleteUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: "Access denied",
        });
      });

      it("should handle missing user ID", async () => {
        req.params = { id: "1" }; // Set user ID to match authenticated user
        req.params.id = undefined; // Then remove it to test missing ID

        await usersController.deleteUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: "Access denied",
        });
      });
    });
  });

  // Additional comprehensive tests for better coverage
  describe("Comprehensive edge cases", () => {
    describe("createUser comprehensive edge cases", () => {
      it("should handle file upload with valid data", async () => {
        req.body = {
          fullName: "Test User",
          nickname: "testuser",
          email: "test@example.com",
          password: "password123",
        };
        req.file = { path: "/path/to/image.jpg" };
        userModel.findUserByEmail.mockResolvedValue(null);
        userModel.createUser.mockResolvedValue(123);

        await usersController.createUser(req, res, next);

        expect(userModel.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            fullName: "Test User",
            nickname: "testuser",
            email: "test@example.com",
            password: "hashedPassword",
          }),
          req.file
        );
        expect(res.status).toHaveBeenCalledWith(201);
      });

      it("should handle XSS sanitization", async () => {
        req.body = {
          fullName: "<script>alert('xss')</script>Test User",
          nickname: "testuser",
          email: "test@example.com",
          password: "password123",
        };
        userModel.findUserByEmail.mockResolvedValue(null);
        userModel.createUser.mockResolvedValue(123);

        await usersController.createUser(req, res, next);

        expect(XSSProtection.sanitizeObject).toHaveBeenCalledWith(req.body);
        expect(res.status).toHaveBeenCalledWith(201);
      });

      it("should handle email case normalization", async () => {
        req.body = {
          fullName: "Test User",
          nickname: "testuser",
          email: "TEST@EXAMPLE.COM",
          password: "password123",
        };
        userModel.findUserByEmail.mockResolvedValue(null);
        userModel.createUser.mockResolvedValue(123);

        await usersController.createUser(req, res, next);

        expect(userModel.findUserByEmail).toHaveBeenCalledWith(
          "test@example.com"
        );
        expect(userModel.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            email: "test@example.com",
          }),
          null
        );
      });
    });

    describe("getUserById comprehensive edge cases", () => {
      it("should handle XSS sanitization of user ID", async () => {
        req.params.id =
          "<script>alert('xss')</script>123e4567-e89b-12d3-a456-426614174000";

        await usersController.getUserById(req, res, next);

        expect(XSSProtection.sanitizeUserInput).toHaveBeenCalledWith(
          req.params.id
        );
      });

      it("should handle empty user ID", async () => {
        req.params.id = "";

        await usersController.getUserById(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
      });
    });

    describe("updateUser comprehensive edge cases", () => {
      beforeEach(() => {
        req.params = { id: "1" };
        req.user = { id: "1", email: "test@example.com" };
      });

      it("should handle password hashing in update", async () => {
        req.body = { password: "newpassword123" };
        userModel.updateUser.mockResolvedValue(true);
        userModel.getUserById.mockResolvedValue({
          id: "1",
          email: "test@example.com",
        });

        await usersController.updateUser(req, res, next);

        expect(bcrypt.hash).toHaveBeenCalledWith("newpassword123", 10);
        expect(userModel.updateUser).toHaveBeenCalledWith(
          "1",
          expect.objectContaining({ password: "hashedPassword" }),
          null
        );
      });

      it("should handle update without password", async () => {
        req.body = { fullName: "Updated Name" };
        userModel.updateUser.mockResolvedValue(true);
        userModel.getUserById.mockResolvedValue({
          id: "1",
          fullName: "Updated Name",
        });

        await usersController.updateUser(req, res, next);

        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(userModel.updateUser).toHaveBeenCalledWith(
          "1",
          expect.objectContaining({ fullName: "Updated Name" }),
          null
        );
      });

      it("should handle user not found after update", async () => {
        req.body = { fullName: "Updated Name" };
        userModel.updateUser.mockResolvedValue(true);
        userModel.getUserById.mockResolvedValue(null);

        await usersController.updateUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
      });

      it("should handle XSS sanitization in update", async () => {
        req.body = { fullName: "<script>alert('xss')</script>Test" };
        userModel.updateUser.mockResolvedValue(true);
        userModel.getUserById.mockResolvedValue({ id: "1", fullName: "Test" });

        await usersController.updateUser(req, res, next);

        expect(XSSProtection.sanitizeObject).toHaveBeenCalledWith(req.body);
        expect(XSSProtection.sanitizeUserInput).toHaveBeenCalledWith("1");
      });
    });

    describe("deleteUser comprehensive edge cases", () => {
      beforeEach(() => {
        req.params = { id: "1" };
        req.user = { id: "1", email: "test@example.com" };
      });

      it("should handle successful deletion", async () => {
        userModel.deleteUser.mockResolvedValue(true);

        await usersController.deleteUser(req, res, next);

        expect(userModel.deleteUser).toHaveBeenCalledWith("1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          message: "User deleted successfully",
        });
      });

      it("should handle user not found for deletion", async () => {
        userModel.deleteUser.mockResolvedValue(false);

        await usersController.deleteUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
      });

      it("should handle XSS sanitization in delete", async () => {
        req.params.id = "<script>alert('xss')</script>1";
        userModel.deleteUser.mockResolvedValue(true);

        await usersController.deleteUser(req, res, next);

        expect(XSSProtection.sanitizeUserInput).toHaveBeenCalledWith(
          "<script>alert('xss')</script>1"
        );
      });
    });

    describe("getCurrentUser comprehensive edge cases", () => {
      it("should handle missing userId in request", async () => {
        req.user = {}; // No userId property

        await usersController.getCurrentUser(req, res, next);

        expect(userModel.getUserById).toHaveBeenCalledWith(undefined);
      });

      it("should handle successful current user fetch", async () => {
        req.user = { userId: "123" };
        const mockUser = { id: "123", email: "test@example.com" };
        userModel.getUserById.mockResolvedValue(mockUser);

        await usersController.getCurrentUser(req, res, next);

        expect(userModel.getUserById).toHaveBeenCalledWith("123");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockUser);
      });
    });

    describe("Database error handling", () => {
      it("should handle database errors in getAllUsers", async () => {
        userModel.getAllUsers.mockRejectedValue(
          new Error("Database connection failed")
        );

        await usersController.getAllUsers(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to fetch users",
        });
      });

      it("should handle database errors in getUserByEmail", async () => {
        req.params.email = "test@example.com";
        userModel.getUserByEmail.mockRejectedValue(
          new Error("Database connection failed")
        );

        await usersController.getUserByEmail(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to fetch user by email",
          message: "Erro interno do servidor. Tente novamente mais tarde.",
        });
      });

      it("should handle database errors in updateUser", async () => {
        req.params = { id: "1" };
        req.user = { id: "1" };
        req.body = { fullName: "Test" };
        userModel.updateUser.mockRejectedValue(
          new Error("Database connection failed")
        );

        await usersController.updateUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error updating user" });
      });

      it("should handle database errors in deleteUser", async () => {
        req.params = { id: "1" };
        req.user = { id: "1" };
        userModel.deleteUser.mockRejectedValue(
          new Error("Database connection failed")
        );

        await usersController.deleteUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Error deleting user" });
      });
    });
  });
});
