const express = require("express");
const request = require("supertest");

// Mock modules before importing them
const mockAuthController = {
  login: jest.fn((req, res) => res.status(200).json({ token: "test-token" })),
  logout: jest.fn((req, res) =>
    res.status(200).json({ message: "Logged out" })
  ),
};

jest.mock("../../../src/controllers/authController", () => mockAuthController);

describe("Auth Routes", () => {
  let app;

  beforeAll(() => {
    // Create Express app
    app = express();
    app.use(express.json());

    // Import and mount the auth routes
    const authRouter = require("../../../src/routes/auth");
    app.use("/auth", authRouter);
  });

  beforeEach(() => {
    // Clear mock call counts
    jest.clearAllMocks();
  });

  describe("POST /auth/login", () => {
    it("should call login controller", async () => {
      await request(app)
        .post("/auth/login")
        .send({ email: "test@example.com", password: "password" })
        .expect(200);

      expect(mockAuthController.login).toHaveBeenCalled();
    });

    it("should pass request body to login controller", async () => {
      const loginData = { email: "test@example.com", password: "password" };

      await request(app).post("/auth/login").send(loginData).expect(200);

      const mockCall = mockAuthController.login.mock.calls[0];
      const req = mockCall[0];
      expect(req.body).toEqual(loginData);
    });
  });

  describe("POST /auth/logout", () => {
    it("should call logout controller", async () => {
      await request(app).post("/auth/logout").expect(200);

      expect(mockAuthController.logout).toHaveBeenCalled();
    });

    it("should handle logout request without body", async () => {
      await request(app).post("/auth/logout").expect(200);

      expect(mockAuthController.logout).toHaveBeenCalledTimes(1);
    });
  });

  describe("Route Configuration", () => {
    it("should export a valid Express router", () => {
      const authRouter = require("../../../src/routes/auth");
      expect(typeof authRouter).toBe("function");
    });

    it("should handle invalid routes appropriately", async () => {
      await request(app).get("/auth/invalid").expect(404);
    });

    it("should only accept POST methods for auth routes", async () => {
      await request(app).get("/auth/login").expect(404);

      await request(app).put("/auth/login").expect(404);

      await request(app).delete("/auth/login").expect(404);
    });
  });
});
