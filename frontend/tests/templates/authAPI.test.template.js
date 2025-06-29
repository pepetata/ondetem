// Example API test template - authAPI.test.js
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import * as authAPI from "../src/api/authAPI";

// Mock axios
vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("authAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    test("should send correct login request", async () => {
      const mockResponse = { data: { token: "test-token", user: { id: 1 } } };
      const mockAxios = await import("axios");
      mockAxios.default.post.mockResolvedValue(mockResponse);

      const credentials = { email: "test@test.com", password: "password" };
      const result = await authAPI.login(credentials);

      expect(mockAxios.default.post).toHaveBeenCalledWith(
        "/api/auth/login",
        credentials
      );
      expect(result).toEqual(mockResponse.data);
    });

    test("should handle login errors", async () => {
      const mockAxios = await import("axios");
      const errorResponse = {
        response: { data: { message: "Invalid credentials" } },
      };
      mockAxios.default.post.mockRejectedValue(errorResponse);

      const credentials = { email: "test@test.com", password: "wrongpass" };

      await expect(authAPI.login(credentials)).rejects.toThrow();
    });
  });

  describe("logout", () => {
    test("should send logout request", async () => {
      const mockAxios = await import("axios");
      mockAxios.default.post.mockResolvedValue({ data: { success: true } });

      await authAPI.logout();

      expect(mockAxios.default.post).toHaveBeenCalledWith("/api/auth/logout");
    });
  });

  describe("verifyToken", () => {
    test("should verify valid token", async () => {
      const mockResponse = { data: { valid: true, user: { id: 1 } } };
      const mockAxios = await import("axios");
      mockAxios.default.get.mockResolvedValue(mockResponse);

      const result = await authAPI.verifyToken();

      expect(mockAxios.default.get).toHaveBeenCalledWith("/api/auth/verify");
      expect(result).toEqual(mockResponse.data);
    });

    test("should handle invalid token", async () => {
      const mockAxios = await import("axios");
      const errorResponse = { response: { status: 401 } };
      mockAxios.default.get.mockRejectedValue(errorResponse);

      await expect(authAPI.verifyToken()).rejects.toThrow();
    });
  });
});
