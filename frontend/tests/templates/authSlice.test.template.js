// Example Redux slice test template - authSlice.test.js
import { describe, test, expect, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import authSlice, {
  loginThunk,
  logoutThunk,
  verifyTokenThunk,
  clearError,
  setUser,
} from "../src/redux/authSlice";

// Mock API
vi.mock("../src/api/authAPI", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  verifyToken: vi.fn(),
}));

describe("authSlice", () => {
  let store;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: {
        auth: authSlice,
      },
    });
  });

  describe("initial state", () => {
    test("should have correct initial state", () => {
      const state = store.getState().auth;

      expect(state).toEqual({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    });
  });

  describe("reducers", () => {
    test("setUser should update user state", () => {
      const user = { id: 1, email: "test@test.com" };

      store.dispatch(setUser(user));

      const state = store.getState().auth;
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
    });

    test("clearError should clear error state", () => {
      // First set an error
      store.dispatch(setUser(null));

      // Then clear it
      store.dispatch(clearError());

      const state = store.getState().auth;
      expect(state.error).toBe(null);
    });
  });

  describe("loginThunk", () => {
    test("should handle successful login", async () => {
      const mockAuthAPI = await import("../src/api/authAPI");
      const mockResponse = {
        token: "test-token",
        user: { id: 1, email: "test@test.com" },
      };
      mockAuthAPI.login.mockResolvedValue(mockResponse);

      const credentials = { email: "test@test.com", password: "password" };

      await store.dispatch(loginThunk(credentials));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(mockResponse.user);
      expect(state.token).toBe(mockResponse.token);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBe(null);
    });

    test("should handle login failure", async () => {
      const mockAuthAPI = await import("../src/api/authAPI");
      const errorMessage = "Invalid credentials";
      mockAuthAPI.login.mockRejectedValue(new Error(errorMessage));

      const credentials = { email: "test@test.com", password: "wrongpass" };

      await store.dispatch(loginThunk(credentials));

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toContain(errorMessage);
    });

    test("should set loading state during login", async () => {
      const mockAuthAPI = await import("../src/api/authAPI");
      // Create a promise that we can control
      let resolveLogin;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockAuthAPI.login.mockReturnValue(loginPromise);

      const credentials = { email: "test@test.com", password: "password" };

      // Start the login process
      const loginAction = store.dispatch(loginThunk(credentials));

      // Check loading state is true
      let state = store.getState().auth;
      expect(state.loading).toBe(true);

      // Resolve the login
      resolveLogin({ token: "test-token", user: { id: 1 } });
      await loginAction;

      // Check loading state is false
      state = store.getState().auth;
      expect(state.loading).toBe(false);
    });
  });

  describe("logoutThunk", () => {
    test("should handle successful logout", async () => {
      const mockAuthAPI = await import("../src/api/authAPI");
      mockAuthAPI.logout.mockResolvedValue();

      // First login
      store.dispatch(setUser({ id: 1, email: "test@test.com" }));

      // Then logout
      await store.dispatch(logoutThunk());

      const state = store.getState().auth;
      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
    });

    test("should handle logout failure gracefully", async () => {
      const mockAuthAPI = await import("../src/api/authAPI");
      mockAuthAPI.logout.mockRejectedValue(new Error("Network error"));

      // First login
      store.dispatch(setUser({ id: 1, email: "test@test.com" }));

      // Then attempt logout
      await store.dispatch(logoutThunk());

      const state = store.getState().auth;
      // Should still logout locally even if API call fails
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("verifyTokenThunk", () => {
    test("should handle valid token verification", async () => {
      const mockAuthAPI = await import("../src/api/authAPI");
      const mockResponse = {
        valid: true,
        user: { id: 1, email: "test@test.com" },
      };
      mockAuthAPI.verifyToken.mockResolvedValue(mockResponse);

      await store.dispatch(verifyTokenThunk());

      const state = store.getState().auth;
      expect(state.user).toEqual(mockResponse.user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
    });

    test("should handle invalid token verification", async () => {
      const mockAuthAPI = await import("../src/api/authAPI");
      mockAuthAPI.verifyToken.mockRejectedValue(new Error("Invalid token"));

      await store.dispatch(verifyTokenThunk());

      const state = store.getState().auth;
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
    });
  });

  describe("selectors", () => {
    test("should select user correctly", () => {
      const user = { id: 1, email: "test@test.com" };
      store.dispatch(setUser(user));

      const state = store.getState();
      expect(state.auth.user).toEqual(user);
    });

    test("should select authentication status correctly", () => {
      store.dispatch(setUser({ id: 1 }));

      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
    });
  });
});
