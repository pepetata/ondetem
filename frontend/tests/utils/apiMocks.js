import { vi } from "vitest";

/**
 * Mock API responses for testing
 */
export const mockApiResponses = {
  // User API responses
  user: {
    success: {
      id: 1,
      nickname: "testuser",
      email: "test@example.com",
      fullName: "Test User",
      photo: null,
    },
    error: {
      message: "User not found",
      status: 404,
    },
  },

  // Auth API responses
  auth: {
    loginSuccess: {
      token: "mock-jwt-token",
      user: {
        id: 1,
        nickname: "testuser",
        email: "test@example.com",
      },
    },
    loginError: {
      message: "Invalid credentials",
      status: 401,
    },
  },

  // Ad API responses
  ad: {
    success: {
      id: 123,
      title: "Test Ad",
      description: "Test Description",
      cep: "12345678",
      userId: 1,
      createdAt: "2023-01-01T00:00:00.000Z",
    },
    list: [
      {
        id: 1,
        title: "Ad 1",
        description: "Description 1",
        cep: "11111111",
      },
      {
        id: 2,
        title: "Ad 2",
        description: "Description 2",
        cep: "22222222",
      },
    ],
    error: {
      message: "Ad not found",
      status: 404,
    },
  },

  // Comments API responses
  comments: {
    success: [
      {
        id: 1,
        content: "Great ad!",
        userId: 2,
        adId: 123,
        createdAt: "2023-01-01T00:00:00.000Z",
      },
    ],
    error: {
      message: "Comments not found",
      status: 404,
    },
  },
};

/**
 * Creates mock API functions
 */
export function createApiMocks() {
  return {
    // User API mocks
    userAPI: {
      getUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
      uploadPhoto: vi.fn(),
    },

    // Auth API mocks
    authAPI: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
    },

    // Ad API mocks
    adAPI: {
      getAds: vi.fn(),
      getAd: vi.fn(),
      createAd: vi.fn(),
      updateAd: vi.fn(),
      deleteAd: vi.fn(),
      uploadImage: vi.fn(),
    },

    // Comments API mocks
    commentsAPI: {
      getComments: vi.fn(),
      addComment: vi.fn(),
      deleteComment: vi.fn(),
    },

    // Favorites API mocks
    favoritesAPI: {
      getFavorites: vi.fn(),
      addFavorite: vi.fn(),
      removeFavorite: vi.fn(),
    },
  };
}

/**
 * Resets all API mocks
 */
export function resetApiMocks(mocks) {
  Object.values(mocks).forEach((apiGroup) => {
    Object.values(apiGroup).forEach((mockFn) => {
      if (mockFn.mockReset) {
        mockFn.mockReset();
      }
    });
  });
}

/**
 * Common mock implementations
 */
export const mockImplementations = {
  // Success responses
  resolveWith: (data) => vi.fn().mockResolvedValue({ data }),
  rejectWith: (error) => vi.fn().mockRejectedValue(error),

  // Promise implementations
  pending: () => vi.fn().mockImplementation(() => new Promise(() => {})),
  delayed: (data, delay = 100) =>
    vi
      .fn()
      .mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve({ data }), delay))
      ),
};
