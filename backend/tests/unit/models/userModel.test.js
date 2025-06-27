/**
 * User Model Unit Tests
 *
 * Tests the userModel.js functions with mocked database connections
 * to ensure data validation, sanitization, and SQL security.
 */

const userModel = require("../../../src/models/userModel");
const { safePool } = require("../../../src/utils/sqlSecurity");

// Mock the safePool
jest.mock("../../../src/utils/sqlSecurity", () => ({
  safePool: {
    safeQuery: jest.fn(),
  },
}));

describe("User Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("should create a new user with valid data", async () => {
      const userData = {
        fullName: "John Doe",
        nickname: "johndoe",
        email: "john@example.com",
        password: "hashedpassword123",
        zipcode: "12345678",
      };

      const mockResult = {
        rows: [{ id: "user-123", ...userData }],
        rowCount: 1,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await userModel.createUser(userData);

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO users"),
        expect.arrayContaining([
          userData.fullName,
          userData.nickname,
          userData.email,
          userData.password,
          userData.zipcode,
        ]),
        "create_user"
      );
      expect(result).toBe("user-123");
    });

    it("should handle database errors gracefully", async () => {
      const userData = {
        fullName: "John Doe",
        nickname: "johndoe",
        email: "john@example.com",
        password: "hashedpassword123",
      };

      safePool.safeQuery.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(userModel.createUser(userData)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("getUserByEmail", () => {
    it("should return user when found", async () => {
      const email = "john@example.com";
      const mockUser = {
        id: "user-123",
        email: email,
        fullName: "John Doe",
        nickname: "johndoe",
      };

      const mockResult = {
        rows: [mockUser],
        rowCount: 1,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await userModel.getUserByEmail(email);

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM users WHERE email = $1"),
        [email],
        "find_user_by_email"
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found", async () => {
      const email = "nonexistent@example.com";

      const mockResult = {
        rows: [],
        rowCount: 0,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await userModel.getUserByEmail(email);

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const email = "john@example.com";

      safePool.safeQuery.mockRejectedValue(new Error("Database error"));

      await expect(userModel.getUserByEmail(email)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getUserById", () => {
    it("should return user when found by ID", async () => {
      const userId = "user-123";
      const mockUser = {
        id: userId,
        email: "john@example.com",
        fullName: "John Doe",
        nickname: "johndoe",
      };

      const mockResult = {
        rows: [mockUser],
        rowCount: 1,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await userModel.getUserById(userId);

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        [userId],
        "get_user_by_id"
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found by ID", async () => {
      const userId = "nonexistent-id";

      const mockResult = {
        rows: [],
        rowCount: 0,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await userModel.getUserById(userId);

      expect(result).toBeNull();
    });
  });

  describe("updateUser", () => {
    it("should update user successfully", async () => {
      const userId = "user-123";
      const updateData = {
        fullName: "John Updated",
        nickname: "johnupdated",
      };

      const mockResult = {
        rows: [{ id: userId, ...updateData }],
        rowCount: 1,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await userModel.updateUser(userId, updateData);

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET"),
        expect.arrayContaining([userId]),
        "update_user"
      );
      expect(result).toBe(true);
    });

    it("should return false when user not found for update", async () => {
      const userId = "nonexistent-id";
      const updateData = { fullName: "Updated Name" };

      const mockResult = {
        rows: [],
        rowCount: 0,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await userModel.updateUser(userId, updateData);

      expect(result).toBe(false);
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      const userId = "user-123";

      const mockResult = {
        rowCount: 1,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await userModel.deleteUser(userId);

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM users WHERE id = $1"),
        [userId],
        "delete_user"
      );
      expect(result).toBe(true);
    });

    it("should return false when user not found for deletion", async () => {
      const userId = "nonexistent-id";

      const mockResult = {
        rowCount: 0,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await userModel.deleteUser(userId);

      expect(result).toBe(false);
    });
  });

  describe("getAllUsers", () => {
    it("should return all users", async () => {
      const mockUsers = [
        { id: "user-1", email: "user1@example.com", fullName: "User One" },
        { id: "user-2", email: "user2@example.com", fullName: "User Two" },
      ];

      const mockResult = {
        rows: mockUsers,
        rowCount: 2,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await userModel.getAllUsers();

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM users"),
        [],
        "get_all_users"
      );
      expect(result).toEqual(mockUsers);
    });

    it("should return empty array when no users found", async () => {
      const mockResult = {
        rows: [],
        rowCount: 0,
      };

      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await userModel.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe("SQL Injection Prevention", () => {
    it("should use parameterized queries for all operations", async () => {
      const userData = {
        fullName: "'; DROP TABLE users; --",
        nickname: "malicious",
        email: "hacker@example.com",
        password: "password",
      };

      safePool.safeQuery.mockResolvedValue({
        rows: [{ id: "user-123" }],
        rowCount: 1,
      });

      await userModel.createUser(userData);

      // Verify that safeQuery was called (which enforces parameterized queries)
      expect(safePool.safeQuery).toHaveBeenCalled();

      // Verify that the malicious input was passed as a parameter, not concatenated
      const [query, params] = safePool.safeQuery.mock.calls[0];
      expect(query).not.toContain("'; DROP TABLE users; --");
      expect(params).toContain("'; DROP TABLE users; --");
    });

    it("should prevent SQL injection in search operations", async () => {
      const maliciousEmail = "admin@example.com'; DROP TABLE users; --";

      safePool.safeQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      await userModel.getUserByEmail(maliciousEmail);

      const [query, params] = safePool.safeQuery.mock.calls[0];
      expect(query).not.toContain("DROP TABLE");
      expect(params[0]).toBe(maliciousEmail);
    });
  });
});
