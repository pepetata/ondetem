import "@testing-library/jest-dom";

// Mock API modules to prevent network calls
import { vi } from "vitest";

vi.mock("./src/api/authAPI", () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  verifyToken: vi.fn(),
}));

vi.mock("./src/api/userAPI", () => ({
  getAllUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  getUserById: vi.fn(),
}));

vi.mock("./src/api/adAPI", () => ({
  getAllAds: vi.fn(),
  createAd: vi.fn(),
  updateAd: vi.fn(),
  deleteAd: vi.fn(),
  getAdById: vi.fn(),
}));

// Global test utilities and setup can go here

// Mock URL.createObjectURL for file upload tests
global.URL = global.URL || {};
global.URL.createObjectURL = vi.fn(() => "mocked-url");
global.URL.revokeObjectURL = vi.fn();
