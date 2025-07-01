const request = require("supertest");
const express = require("express");

// Mock modules before importing them
const mockCommentsController = {
  createComment: jest.fn((req, res) =>
    res.status(201).json({ id: 1, message: "Comment created" })
  ),
  getCommentsByAdId: jest.fn((req, res) => res.json({ comments: [] })),
  getCommentsCount: jest.fn((req, res) => res.json({ count: 0 })),
  updateComment: jest.fn((req, res) =>
    res.json({ id: 1, message: "Comment updated" })
  ),
  deleteComment: jest.fn((req, res) => res.status(204).send()),
  getUserComments: jest.fn((req, res) => res.json({ comments: [] })),
};

const mockMiddleware = {
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: "test-user-id", email: "test@example.com" };
    next();
  }),
};

jest.mock(
  "../../../src/controllers/commentsController",
  () => mockCommentsController
);
jest.mock("../../../src/utils/middleware", () => mockMiddleware);

describe("Comments Routes", () => {
  let app;

  beforeAll(() => {
    // Create Express app and import routes
    app = express();
    app.use(express.json());

    // Import and mount the comments routes
    const commentsRouter = require("../../../src/routes/comments");
    app.use("/comments", commentsRouter);
  });

  beforeEach(() => {
    // Clear mock call counts
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("should return API status message", async () => {
      const response = await request(app).get("/comments/").expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Comments API is working"
      );
      expect(response.body).toHaveProperty("timestamp");
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe("POST /", () => {
    it("should call authenticateToken middleware and createComment controller", async () => {
      const commentData = {
        content: "Test comment",
        ad_id: "test-ad-id",
      };

      await request(app).post("/comments/").send(commentData).expect(201);

      expect(mockMiddleware.authenticateToken).toHaveBeenCalled();
      expect(mockCommentsController.createComment).toHaveBeenCalled();
    });

    it("should pass request to createComment controller", async () => {
      const commentData = {
        content: "Test comment",
        ad_id: "test-ad-id",
      };

      await request(app).post("/comments/").send(commentData);

      const createCommentCall =
        mockCommentsController.createComment.mock.calls[0];
      expect(createCommentCall[0].body).toEqual(commentData);
      expect(createCommentCall[0].user).toEqual({
        id: "test-user-id",
        email: "test@example.com",
      });
    });
  });

  describe("GET /ad/:ad_id", () => {
    it("should call getCommentsByAdId controller", async () => {
      const adId = "test-ad-id";

      await request(app).get(`/comments/ad/${adId}`).expect(200);

      expect(mockCommentsController.getCommentsByAdId).toHaveBeenCalled();

      const controllerCall =
        mockCommentsController.getCommentsByAdId.mock.calls[0];
      expect(controllerCall[0].params.ad_id).toBe(adId);
    });

    it("should not require authentication", async () => {
      await request(app).get("/comments/ad/test-ad-id").expect(200);

      // authenticateToken should not be called for this route
      expect(mockMiddleware.authenticateToken).not.toHaveBeenCalled();
    });
  });

  describe("GET /ad/:ad_id/count", () => {
    it("should call getCommentsCount controller", async () => {
      const adId = "test-ad-id";

      await request(app).get(`/comments/ad/${adId}/count`).expect(200);

      expect(mockCommentsController.getCommentsCount).toHaveBeenCalled();

      const controllerCall =
        mockCommentsController.getCommentsCount.mock.calls[0];
      expect(controllerCall[0].params.ad_id).toBe(adId);
    });

    it("should not require authentication", async () => {
      await request(app).get("/comments/ad/test-ad-id/count").expect(200);

      expect(mockMiddleware.authenticateToken).not.toHaveBeenCalled();
    });
  });

  describe("GET /user", () => {
    it("should call authenticateToken middleware and getUserComments controller", async () => {
      await request(app).get("/comments/user").expect(200);

      expect(mockMiddleware.authenticateToken).toHaveBeenCalled();
      expect(mockCommentsController.getUserComments).toHaveBeenCalled();
    });

    it("should pass authenticated user to getUserComments controller", async () => {
      await request(app).get("/comments/user");

      const controllerCall =
        mockCommentsController.getUserComments.mock.calls[0];
      expect(controllerCall[0].user).toEqual({
        id: "test-user-id",
        email: "test@example.com",
      });
    });
  });

  describe("PUT /:id", () => {
    it("should call authenticateToken middleware and updateComment controller", async () => {
      const commentId = "test-comment-id";
      const updateData = { content: "Updated comment" };

      await request(app)
        .put(`/comments/${commentId}`)
        .send(updateData)
        .expect(200);

      expect(mockMiddleware.authenticateToken).toHaveBeenCalled();
      expect(mockCommentsController.updateComment).toHaveBeenCalled();
    });

    it("should pass comment ID and update data to updateComment controller", async () => {
      const commentId = "test-comment-id";
      const updateData = { content: "Updated comment" };

      await request(app).put(`/comments/${commentId}`).send(updateData);

      const controllerCall = mockCommentsController.updateComment.mock.calls[0];
      expect(controllerCall[0].params.id).toBe(commentId);
      expect(controllerCall[0].body).toEqual(updateData);
      expect(controllerCall[0].user).toEqual({
        id: "test-user-id",
        email: "test@example.com",
      });
    });
  });

  describe("DELETE /:id", () => {
    it("should call authenticateToken middleware and deleteComment controller", async () => {
      const commentId = "test-comment-id";

      await request(app).delete(`/comments/${commentId}`).expect(204);

      expect(mockMiddleware.authenticateToken).toHaveBeenCalled();
      expect(mockCommentsController.deleteComment).toHaveBeenCalled();
    });

    it("should pass comment ID to deleteComment controller", async () => {
      const commentId = "test-comment-id";

      await request(app).delete(`/comments/${commentId}`);

      const controllerCall = mockCommentsController.deleteComment.mock.calls[0];
      expect(controllerCall[0].params.id).toBe(commentId);
      expect(controllerCall[0].user).toEqual({
        id: "test-user-id",
        email: "test@example.com",
      });
    });
  });

  describe("Authentication requirements", () => {
    beforeEach(() => {
      // Mock authenticateToken to simulate unauthenticated requests
      mockMiddleware.authenticateToken.mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });
    });

    it("should require authentication for POST /", async () => {
      await request(app)
        .post("/comments/")
        .send({ content: "Test comment" })
        .expect(401);

      expect(mockCommentsController.createComment).not.toHaveBeenCalled();
    });

    it("should require authentication for GET /user", async () => {
      await request(app).get("/comments/user").expect(401);

      expect(mockCommentsController.getUserComments).not.toHaveBeenCalled();
    });

    it("should require authentication for PUT /:id", async () => {
      await request(app)
        .put("/comments/test-id")
        .send({ content: "Updated comment" })
        .expect(401);

      expect(mockCommentsController.updateComment).not.toHaveBeenCalled();
    });

    it("should require authentication for DELETE /:id", async () => {
      await request(app).delete("/comments/test-id").expect(401);

      expect(mockCommentsController.deleteComment).not.toHaveBeenCalled();
    });
  });
});
