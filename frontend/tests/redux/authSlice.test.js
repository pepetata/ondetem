import { describe, it, expect, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import authSlice, {
  setCredentials,
  logout,
  setLoading,
  setError,
  clearError,
  loginUser,
  registerUser,
  verifyToken,
} from "../../src/redux/authSlice";

// Mock the authAPI
vi.mock("../../src/api/authAPI", () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    verifyToken: vi.fn(),
    logout: vi.fn(),
  },
}));

describe("authSlice", () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authSlice,
      },
    });
  });

  describe("reducers", () => {
    it("should handle setCredentials", () => {
      const credentials = {
        user: { id: 1, email: "test@example.com" },
        token: "mock-token",
      };

      store.dispatch(setCredentials(credentials));
      const state = store.getState().auth;

      expect(state.user).toEqual(credentials.user);
      expect(state.token).toEqual(credentials.token);
      expect(state.isAuthenticated).toBe(true);
    });

    it("should handle logout", () => {
      // First set some credentials
      store.dispatch(
        setCredentials({
          user: { id: 1, email: "test@example.com" },
          token: "mock-token",
        })
      );

      // Then logout
      store.dispatch(logout());
      const state = store.getState().auth;

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it("should handle setLoading", () => {
      store.dispatch(setLoading(true));
      expect(store.getState().auth.loading).toBe(true);

      store.dispatch(setLoading(false));
      expect(store.getState().auth.loading).toBe(false);
    });

    it("should handle setError", () => {
      const errorMessage = "Test error";
      store.dispatch(setError(errorMessage));

      expect(store.getState().auth.error).toBe(errorMessage);
    });

    it("should handle clearError", () => {
      store.dispatch(setError("Test error"));
      store.dispatch(clearError());

      expect(store.getState().auth.error).toBeNull();
    });
  });

  describe("async thunks", () => {
    it("should handle loginUser.pending", () => {
      const action = { type: loginUser.pending.type };
      const state = authSlice(undefined, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should handle loginUser.fulfilled", () => {
      const payload = {
        user: { id: 1, email: "test@example.com" },
        token: "mock-token",
      };
      const action = { type: loginUser.fulfilled.type, payload };
      const state = authSlice(undefined, action);

      expect(state.loading).toBe(false);
      expect(state.user).toEqual(payload.user);
      expect(state.token).toEqual(payload.token);
      expect(state.isAuthenticated).toBe(true);
    });

    it("should handle loginUser.rejected", () => {
      const action = {
        type: loginUser.rejected.type,
        error: { message: "Login failed" },
      };
      const state = authSlice(undefined, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBe("Login failed");
      expect(state.isAuthenticated).toBe(false);
    });

    it("should handle registerUser.pending", () => {
      const action = { type: registerUser.pending.type };
      const state = authSlice(undefined, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should handle registerUser.fulfilled", () => {
      const payload = {
        user: { id: 1, email: "newuser@example.com" },
        token: "mock-token",
      };
      const action = { type: registerUser.fulfilled.type, payload };
      const state = authSlice(undefined, action);

      expect(state.loading).toBe(false);
      expect(state.user).toEqual(payload.user);
      expect(state.token).toEqual(payload.token);
      expect(state.isAuthenticated).toBe(true);
    });

    it("should handle registerUser.rejected", () => {
      const action = {
        type: registerUser.rejected.type,
        error: { message: "Registration failed" },
      };
      const state = authSlice(undefined, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBe("Registration failed");
    });

    it("should handle verifyToken.fulfilled", () => {
      const payload = { id: 1, email: "test@example.com" };
      const action = { type: verifyToken.fulfilled.type, payload };
      const state = authSlice(undefined, action);

      expect(state.user).toEqual(payload);
      expect(state.isAuthenticated).toBe(true);
    });

    it("should handle verifyToken.rejected", () => {
      const action = { type: verifyToken.rejected.type };
      const state = authSlice(undefined, action);

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = store.getState().auth;

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
