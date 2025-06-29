import { describe, it, expect, vi, beforeEach } from "vitest";
import { authAPI } from "../../src/api/authAPI";

// Mock fetch globally
global.fetch = vi.fn();

describe("authAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    fetch.mockClear();
  });

  describe("login", () => {
    it("should make POST request to /auth/login with credentials", async () => {
      const mockResponse = {
        token: "mock-token",
        user: { id: 1, email: "test@example.com" },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const credentials = {
        email: "test@example.com",
        password: "password123",
      };
      const result = await authAPI.login(credentials);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/login"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(credentials),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error when login fails", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid credentials" }),
      });

      const credentials = { email: "test@example.com", password: "wrong" };

      await expect(authAPI.login(credentials)).rejects.toThrow();
    });
  });

  describe("register", () => {
    it("should make POST request to /auth/register with user data", async () => {
      const mockResponse = {
        token: "mock-token",
        user: { id: 1, email: "newuser@example.com" },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const userData = {
        email: "newuser@example.com",
        password: "password123",
        name: "New User",
      };
      const result = await authAPI.register(userData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/register"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(userData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error when registration fails", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Email already exists" }),
      });

      const userData = {
        email: "existing@example.com",
        password: "password123",
      };

      await expect(authAPI.register(userData)).rejects.toThrow();
    });
  });

  describe("logout", () => {
    it("should make POST request to /auth/logout", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Logged out successfully" }),
      });

      const result = await authAPI.logout();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/logout"),
        expect.objectContaining({
          method: "POST",
        })
      );
      expect(result).toBeDefined();
    });
  });

  describe("verifyToken", () => {
    it("should make GET request to verify token", async () => {
      const mockUser = { id: 1, email: "test@example.com" };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const result = await authAPI.verifyToken();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/verify"),
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw error when token is invalid", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid token" }),
      });

      await expect(authAPI.verifyToken()).rejects.toThrow();
    });
  });
});
