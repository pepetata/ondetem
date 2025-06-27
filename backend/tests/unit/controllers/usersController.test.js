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

const usersController = require("../../../src/controllers/usersController");
const userModel = require("../../../src/models/userModel");
const { XSSProtection } = require("../../../src/utils/xssProtection");
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

  describe("getUserById", () => {
    beforeEach(() => {
      req.params.id = "123";
    });

    it("should return user by id successfully", async () => {
      const mockUser = {
        id: 123,
        fullName: "Test User",
        email: "test@example.com",
      };
      userModel.getUserById.mockResolvedValue(mockUser);

      await usersController.getUserById(req, res, next);

      expect(XSSProtection.sanitizeUserInput).toHaveBeenCalledWith("123");
      expect(userModel.getUserById).toHaveBeenCalledWith("123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return 404 for non-existent user", async () => {
      userModel.getUserById.mockResolvedValue(null);

      await usersController.getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not found",
      });
    });

    it("should handle invalid id format", async () => {
      req.params.id = "invalid-id";
      userModel.getUserById.mockResolvedValue(null);

      await usersController.getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not found",
      });
    });
  });

  describe("updateUser", () => {
    beforeEach(() => {
      req.params.id = "123";
      req.body = {
        fullName: "Updated Name",
        nickname: "updateduser",
      };
    });

    it("should update user successfully", async () => {
      userModel.updateUser.mockResolvedValue(true);
      userModel.getUserById.mockResolvedValue({
        id: "123",
        fullName: "Updated Name",
      });

      await usersController.updateUser(req, res, next);

      expect(XSSProtection.sanitizeUserInput).toHaveBeenCalledWith("123");
      expect(XSSProtection.sanitizeObject).toHaveBeenCalledWith(req.body);
      expect(userModel.updateUser).toHaveBeenCalledWith("123", req.body, null);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User updated successfully",
      });
    });

    it("should return 404 for non-existent user", async () => {
      userModel.updateUser.mockResolvedValue(true);
      userModel.getUserById.mockResolvedValue(null);

      await usersController.updateUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not found",
      });
    });

    it("should handle profile photo update", async () => {
      const mockFile = {
        filename: "new-profile.jpg",
        path: "/uploads/new-profile.jpg",
      };
      req.file = mockFile;
      userModel.updateUser.mockResolvedValue(true);
      userModel.getUserById.mockResolvedValue({
        id: "123",
        fullName: "Updated Name",
      });

      await usersController.updateUser(req, res, next);

      expect(userModel.updateUser).toHaveBeenCalledWith(
        "123",
        req.body,
        mockFile
      );
    });

    it("should handle password updates with encryption", async () => {
      req.body.password = "newpassword123";
      userModel.updateUser.mockResolvedValue(true);
      userModel.getUserById.mockResolvedValue({
        id: "123",
        fullName: "Updated Name",
      });

      await usersController.updateUser(req, res, next);

      expect(bcrypt.hash).toHaveBeenCalledWith("newpassword123", 10);
      expect(userModel.updateUser).toHaveBeenCalledWith(
        "123",
        expect.objectContaining({
          password: "hashedPassword",
        }),
        null
      );
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      userModel.updateUser.mockRejectedValue(dbError);

      await usersController.updateUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error updating user",
      });
    });
  });

  describe("deleteUser", () => {
    beforeEach(() => {
      req.params.id = "123";
    });

    it("should delete user successfully", async () => {
      userModel.deleteUser.mockResolvedValue(true);

      await usersController.deleteUser(req, res, next);

      expect(XSSProtection.sanitizeUserInput).toHaveBeenCalledWith("123");
      expect(userModel.deleteUser).toHaveBeenCalledWith("123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User deleted successfully",
      });
    });

    it("should return 404 for non-existent user", async () => {
      userModel.deleteUser.mockResolvedValue(false);

      await usersController.deleteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not found",
      });
    });

    it("should handle database errors", async () => {
      const dbError = new Error("Database connection failed");
      userModel.deleteUser.mockRejectedValue(dbError);

      await usersController.deleteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error deleting user",
      });
    });
  });
});
