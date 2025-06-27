const request = require("supertest");
const express = require("express");
const usersRoutes = require("../../../src/routes/users");
const usersController = require("../../../src/controllers/usersController");
const middleware = require("../../../src/utils/middleware");

// Mock dependencies
jest.mock("../../../src/controllers/usersController");
jest.mock("../../../src/utils/middleware");
jest.mock("multer", () => {
  const multer = () => ({
    single: () => (req, res, next) => next(),
  });
  return multer;
});

describe("Users Routes", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/users", usersRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock middleware functions
    middleware.tokenExtractor.mockImplementation((req, res, next) => next());
    middleware.userExtractor.mockImplementation((req, res, next) => next());

    // Mock controller responses
    usersController.getAllUsers.mockImplementation((req, res) => res.json([]));
    usersController.getUserById.mockImplementation((req, res) => res.json({}));
    usersController.getUserByEmail.mockImplementation((req, res) =>
      res.json({})
    );
    usersController.getCurrentUser.mockImplementation((req, res) =>
      res.json({})
    );
    usersController.createUser.mockImplementation((req, res) =>
      res.status(201).json({})
    );
    usersController.updateUser.mockImplementation((req, res) => res.json({}));
    usersController.deleteUser.mockImplementation((req, res) =>
      res.status(204).json({})
    );
  });

  describe("GET /users", () => {
    it("should call getAllUsers controller", async () => {
      const response = await request(app).get("/users");

      expect(response.status).toBe(200);
      expect(usersController.getAllUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /users/:id", () => {
    it("should call getUserById controller", async () => {
      const response = await request(app).get("/users/123");

      expect(response.status).toBe(200);
      expect(usersController.getUserById).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /users/email/:email", () => {
    it("should call getUserByEmail controller", async () => {
      const response = await request(app).get("/users/email/test@example.com");

      expect(response.status).toBe(200);
      expect(usersController.getUserByEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /users/me", () => {
    it("should call getCurrentUser controller with middleware", async () => {
      const response = await request(app).get("/users/me");

      expect(response.status).toBe(200);
      expect(middleware.tokenExtractor).toHaveBeenCalledTimes(1);
      expect(middleware.userExtractor).toHaveBeenCalledTimes(1);
      expect(usersController.getCurrentUser).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /users", () => {
    it("should call createUser controller", async () => {
      const response = await request(app)
        .post("/users")
        .send({ name: "Test User" });

      expect(response.status).toBe(201);
      expect(usersController.createUser).toHaveBeenCalledTimes(1);
    });
  });

  describe("PUT /users/:id", () => {
    it("should call updateUser controller with middleware", async () => {
      const response = await request(app)
        .put("/users/123")
        .send({ name: "Updated User" });

      expect(response.status).toBe(200);
      expect(middleware.tokenExtractor).toHaveBeenCalledTimes(1);
      expect(middleware.userExtractor).toHaveBeenCalledTimes(1);
      expect(usersController.updateUser).toHaveBeenCalledTimes(1);
    });
  });

  describe("DELETE /users/:id", () => {
    it("should call deleteUser controller with middleware", async () => {
      const response = await request(app).delete("/users/123");

      expect(response.status).toBe(204);
      expect(middleware.tokenExtractor).toHaveBeenCalledTimes(1);
      expect(middleware.userExtractor).toHaveBeenCalledTimes(1);
      expect(usersController.deleteUser).toHaveBeenCalledTimes(1);
    });
  });
});
