import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../../src/redux/userSlice";
import authReducer from "../../src/redux/authSlice";
import notificationReducer from "../../src/redux/notificationSlice";
import adReducer from "../../src/redux/adSlice";
import adImagesReducer from "../../src/redux/adImagesSlice";
import favoritesReducer from "../../src/redux/favoritesSlice";
import commentsReducer from "../../src/redux/commentsSlice";

/**
 * Creates a mock store for testing
 * @param {Object} initialState - Initial state for the store
 * @returns {Object} Configured Redux store
 */
export function createMockStore(initialState = {}) {
  return configureStore({
    reducer: {
      user: userReducer,
      auth: authReducer,
      notification: notificationReducer,
      ads: adReducer,
      adImages: adImagesReducer,
      favorites: favoritesReducer,
      comments: commentsReducer,
    },
    preloadedState: initialState,
  });
}

/**
 * Common store states for testing
 */
export const mockStoreStates = {
  // Logged out user
  loggedOut: {
    auth: {
      isAuthenticated: false,
      user: null,
      token: null,
    },
    user: {
      currentUser: null,
    },
  },

  // Logged in user
  loggedIn: {
    auth: {
      isAuthenticated: true,
      user: { id: 1, nickname: "testuser", email: "test@example.com" },
      token: "mock-jwt-token",
    },
    user: {
      currentUser: { id: 1, nickname: "testuser", email: "test@example.com" },
    },
  },

  // User with ad data
  withCurrentAd: {
    auth: {
      isAuthenticated: true,
      user: { id: 1, nickname: "testuser", email: "test@example.com" },
      token: "mock-jwt-token",
    },
    ads: {
      currentAd: {
        id: 123,
        title: "Test Ad Title",
        description: "Test Ad Description",
        cep: "12345678",
        address: "Test Address",
        city: "Test City",
        state: "TS",
        userId: 1,
      },
      ads: [],
      loading: false,
      error: null,
    },
  },

  // Store with notification
  withNotification: {
    notification: {
      message: "Test notification message",
      type: "success",
      show: true,
    },
  },

  // Store with loading state
  loading: {
    ads: {
      loading: true,
      error: null,
      currentAd: null,
      ads: [],
    },
  },

  // Store with error state
  withError: {
    ads: {
      loading: false,
      error: "Test error message",
      currentAd: null,
      ads: [],
    },
  },
};
