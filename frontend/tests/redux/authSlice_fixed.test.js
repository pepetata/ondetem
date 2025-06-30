import { describe, it, expect, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import authSlice, {
  logout,
  setUser,
  loginThunk,
} from "../../src/redux/authSlice";
import * as authAPI from "../../src/api/authAPI";

// Mock the authAPI
vi.mock("../../src/api/authAPI");

const mockedLoginAPI = vi.mocked(authAPI.login);

describe("authSlice", () => {
  let store;

  beforeEach(() => {
    vi.clearAllMocks();

    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    store = configureStore({
      reducer: {
        auth: authSlice,
      },
    });
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("reducers", () => {
    it("should handle logout", () => {
      // First set some initial state
      localStorage.setItem("authToken", "test-token");
      localStorage.setItem(
        "user",
        JSON.stringify({ id: 1, email: "test@example.com" })
      );

      store.dispatch(logout());
      const state = store.getState().auth;

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(localStorage.getItem("authToken")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });

    it("should handle setUser", () => {
      const user = { id: 1, email: "test@example.com", nickname: "testuser" };

      store.dispatch(setUser(user));
      const state = store.getState().auth;

      expect(state.user).toEqual(user);
    });
  });

  describe("async thunks", () => {
    it("should handle loginThunk.pending", () => {
      const action = { type: loginThunk.pending.type };
      const state = authSlice(undefined, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should handle loginThunk.fulfilled", () => {
      const payload = {
        user: { id: 1, email: "test@example.com" },
        token: "mock-token",
      };
      const action = { type: loginThunk.fulfilled.type, payload };
      const state = authSlice(undefined, action);

      expect(state.loading).toBe(false);
      expect(state.user).toEqual(payload.user);
      expect(state.token).toBe(payload.token);
    });

    it("should handle loginThunk.rejected", () => {
      const errorMessage = "Login failed";
      const action = {
        type: loginThunk.rejected.type,
        payload: errorMessage,
      };
      const state = authSlice(undefined, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it("should dispatch loginThunk successfully", async () => {
      const mockResponse = {
        user: { id: 1, email: "test@example.com" },
        token: "mock-token",
      };

      mockedLoginAPI.mockResolvedValueOnce(mockResponse);

      const resultAction = await store.dispatch(
        loginThunk({ email: "test@example.com", password: "password123" })
      );

      expect(mockedLoginAPI).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      );
      expect(resultAction.type).toBe(loginThunk.fulfilled.type);
      expect(resultAction.payload).toEqual(mockResponse);

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.user).toEqual(mockResponse.user);
      expect(state.token).toBe(mockResponse.token);
    });

    it("should handle loginThunk failure", async () => {
      const errorMessage = "Invalid credentials";
      const error = new Error(errorMessage);
      error.response = { data: { error: errorMessage } };

      mockedLoginAPI.mockRejectedValueOnce(error);

      const resultAction = await store.dispatch(
        loginThunk({ email: "test@example.com", password: "wrongpassword" })
      );

      expect(resultAction.type).toBe(loginThunk.rejected.type);

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });
});
