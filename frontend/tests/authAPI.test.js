import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

describe("authAPI integration tests", () => {
  // Import modules dynamically to avoid hoisting issues
  let authAPI;
  let axios;

  beforeEach(async () => {
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
    authAPI = await import("../src/api/authAPI");
    axios = await import("axios");
  });

  afterEach(() => {
    vi.doUnmock("axios");
    vi.resetAllMocks();
  });

  describe("login", () => {
    test("should make POST request to login endpoint with credentials", async () => {
      const mockResponse = {
        data: {
          success: true,
          user: { id: 1, email: "test@example.com", nickname: "testuser" },
          token: "fake-jwt-token",
        },
      };

      axios.default.post.mockResolvedValue(mockResponse);

      const result = await authAPI.login("test@example.com", "password123");

      expect(axios.default.post).toHaveBeenCalledTimes(1);
      expect(axios.default.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/login"),
        {
          email: "test@example.com",
          password: "password123",
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    test("should handle login failure", async () => {
      const mockError = new Error("Invalid credentials");
      mockError.response = {
        status: 401,
        data: { error: "Invalid credentials" },
      };

      axios.default.post.mockRejectedValue(mockError);

      await expect(
        authAPI.login("test@example.com", "wrongpassword")
      ).rejects.toThrow("Invalid credentials");

      expect(axios.default.post).toHaveBeenCalledTimes(1);
    });
  });

  describe("logout", () => {
    test("should make POST request to logout endpoint", async () => {
      const mockResponse = {
        data: { success: true, message: "Logged out successfully" },
      };

      axios.default.post.mockResolvedValue(mockResponse);

      const result = await authAPI.logout();

      expect(axios.default.post).toHaveBeenCalledTimes(1);
      expect(axios.default.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/logout")
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getCurrentUser", () => {
    test("should make GET request to current user endpoint", async () => {
      const mockResponse = {
        data: {
          user: { id: 1, email: "test@example.com", nickname: "testuser" },
        },
      };

      axios.default.get.mockResolvedValue(mockResponse);

      const result = await authAPI.getCurrentUser();

      expect(axios.default.get).toHaveBeenCalledTimes(1);
      expect(axios.default.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/current")
      );
      expect(result).toEqual(mockResponse.data);
    });
  });
});
