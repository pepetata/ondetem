/**
 * Comments Controller Unit Tests
 *
 * Tests the comments controller functions including CRUD operations,
 * security validation, and error handling.
 */

const commentsController = require("../../../src/controllers/commentsController");
const commentModel = require("../../../src/models/commentModel");

// Mock dependencies
jest.mock("../../../src/models/commentModel");

// Mock XSSProtection
jest.mock("../../../src/utils/xssProtection", () => ({
  XSSProtection: {
    sanitizeUserInput: jest.fn((input) => input),
    logger: {
      warn: jest.fn(),
      error: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock("../../../src/utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("Comments Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        id: "user-123",
        email: "test@example.com",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();

    // Setup comment model method mocks
    commentModel.createComment = jest.fn();
    commentModel.findCommentById = jest.fn();
    commentModel.getCommentsByAdId = jest.fn();
    commentModel.updateComment = jest.fn();
    commentModel.deleteComment = jest.fn();
  });

  describe("createComment", () => {
    it("should create comment successfully", async () => {
      const mockComment = {
        id: "comment-123",
        content: "Great ad!",
        ad_id: "ad-123",
        user_id: "user-123",
        created_at: new Date(),
      };

      req.body = {
        content: "Great ad!",
        ad_id: "ad-123",
      };

      commentModel.createComment.mockResolvedValue("comment-123");
      commentModel.findCommentById.mockResolvedValue(mockComment);

      await commentsController.createComment(req, res);

      expect(commentModel.createComment).toHaveBeenCalledWith({
        content: "Great ad!",
        ad_id: "ad-123",
        user_id: "user-123",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Comment created successfully",
        comment: mockComment,
      });
    });

    it("should handle missing content", async () => {
      req.body = {
        ad_id: "ad-123",
      };

      await commentsController.createComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Comment content is required",
      });
    });

    it("should handle missing ad_id", async () => {
      req.body = {
        content: "Great ad!",
      };

      await commentsController.createComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Ad ID is required",
      });
    });

    it("should handle unauthenticated user", async () => {
      req.user = null;
      req.body = {
        content: "Great ad!",
        ad_id: "ad-123",
      };

      await commentsController.createComment(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not authenticated",
      });
    });

    it("should sanitize comment content", async () => {
      const { XSSProtection } = require("../../../src/utils/xssProtection");

      req.body = {
        content: '<script>alert("xss")</script>Great ad!',
        ad_id: "ad-123",
      };

      commentModel.createComment.mockResolvedValue("comment-123");
      commentModel.findCommentById.mockResolvedValue({
        id: "comment-123",
        content: "Great ad!",
        ad_id: "ad-123",
        user_id: "user-123",
      });

      await commentsController.createComment(req, res);

      expect(XSSProtection.sanitizeUserInput).toHaveBeenCalledWith(
        '<script>alert("xss")</script>Great ad!',
        expect.any(Object)
      );
    });

    it("should handle database errors", async () => {
      req.body = {
        content: "Great ad!",
        ad_id: "ad-123",
      };

      commentModel.createComment.mockRejectedValue(new Error("Database error"));

      await commentsController.createComment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to create comment",
      });
    });
  });

  describe("getCommentsByAdId", () => {
    it("should get comments for an ad", async () => {
      const mockComments = [
        {
          id: "comment-1",
          content: "Great ad!",
          ad_id: "ad-123",
          user_id: "user-1",
          created_at: new Date(),
        },
        {
          id: "comment-2",
          content: "Interesting!",
          ad_id: "ad-123",
          user_id: "user-2",
          created_at: new Date(),
        },
      ];

      req.params = { adId: "ad-123" };

      commentModel.getCommentsByAdId.mockResolvedValue(mockComments);

      await commentsController.getCommentsByAdId(req, res);

      expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
        "ad-123",
        10,
        0
      );
      expect(res.json).toHaveBeenCalledWith({
        comments: mockComments,
        count: 2,
      });
    });

    it("should handle empty comments list", async () => {
      req.params = { adId: "ad-123" };

      commentModel.getCommentsByAdId.mockResolvedValue([]);

      await commentsController.getCommentsByAdId(req, res);

      expect(res.json).toHaveBeenCalledWith({
        comments: [],
        count: 0,
      });
    });

    it("should handle invalid ad ID", async () => {
      req.params = { adId: "invalid-id" };

      await commentsController.getCommentsByAdId(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid ad ID format",
      });
    });

    it("should handle database errors", async () => {
      req.params = { adId: "ad-123" };

      commentModel.getCommentsByAdId.mockRejectedValue(
        new Error("Database error")
      );

      await commentsController.getCommentsByAdId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to fetch comments",
      });
    });
  });

  describe("updateComment", () => {
    it("should update comment successfully", async () => {
      const mockComment = {
        id: "comment-123",
        content: "Updated comment",
        ad_id: "ad-123",
        user_id: "user-123",
      };

      req.params = { commentId: "comment-123" };
      req.body = { content: "Updated comment" };

      commentModel.findCommentById.mockResolvedValue(mockComment);
      commentModel.updateComment.mockResolvedValue(true);

      await commentsController.updateComment(req, res);

      expect(commentModel.updateComment).toHaveBeenCalledWith("comment-123", {
        content: "Updated comment",
      });
      expect(res.json).toHaveBeenCalledWith({
        message: "Comment updated successfully",
      });
    });

    it("should prevent updating other users comments", async () => {
      const mockComment = {
        id: "comment-123",
        content: "Original comment",
        ad_id: "ad-123",
        user_id: "other-user-123", // Different user
      };

      req.params = { commentId: "comment-123" };
      req.body = { content: "Updated comment" };

      commentModel.findCommentById.mockResolvedValue(mockComment);

      await commentsController.updateComment(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "You can only edit your own comments",
      });
    });

    it("should handle comment not found", async () => {
      req.params = { commentId: "nonexistent-123" };
      req.body = { content: "Updated comment" };

      commentModel.findCommentById.mockResolvedValue(null);

      await commentsController.updateComment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Comment not found",
      });
    });
  });

  describe("deleteComment", () => {
    it("should delete comment successfully", async () => {
      const mockComment = {
        id: "comment-123",
        content: "Comment to delete",
        ad_id: "ad-123",
        user_id: "user-123",
      };

      req.params = { commentId: "comment-123" };

      commentModel.findCommentById.mockResolvedValue(mockComment);
      commentModel.deleteComment.mockResolvedValue(true);

      await commentsController.deleteComment(req, res);

      expect(commentModel.deleteComment).toHaveBeenCalledWith("comment-123");
      expect(res.json).toHaveBeenCalledWith({
        message: "Comment deleted successfully",
      });
    });

    it("should prevent deleting other users comments", async () => {
      const mockComment = {
        id: "comment-123",
        content: "Comment to delete",
        ad_id: "ad-123",
        user_id: "other-user-123", // Different user
      };

      req.params = { commentId: "comment-123" };

      commentModel.findCommentById.mockResolvedValue(mockComment);

      await commentsController.deleteComment(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "You can only delete your own comments",
      });
    });

    it("should handle comment not found", async () => {
      req.params = { commentId: "nonexistent-123" };

      commentModel.findCommentById.mockResolvedValue(null);

      await commentsController.deleteComment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Comment not found",
      });
    });
  });

  describe("Security Features", () => {
    it("should validate UUID format for comment IDs", async () => {
      req.params = { commentId: "invalid-uuid" };
      req.body = { content: "Test content" };

      await commentsController.updateComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid comment ID format",
      });
    });

    it("should limit comment length", async () => {
      req.body = {
        content: "x".repeat(2001), // Assuming 2000 char limit
        ad_id: "ad-123",
      };

      await commentsController.createComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Comment content is too long",
      });
    });

    it("should prevent empty comments after sanitization", async () => {
      const { XSSProtection } = require("../../../src/utils/xssProtection");
      XSSProtection.sanitizeUserInput.mockReturnValue(""); // Sanitized to empty

      req.body = {
        content: '<script>alert("xss")</script>',
        ad_id: "ad-123",
      };

      await commentsController.createComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Comment content is required",
      });
    });

    it("should log security violations", async () => {
      const logger = require("../../../src/utils/logger");

      req.user = null; // Unauthenticated
      req.body = {
        content: "Attempting to post without auth",
        ad_id: "ad-123",
      };

      await commentsController.createComment(req, res);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Unauthorized comment attempt")
      );
    });
  });

  describe("Pagination", () => {
    it("should support pagination for comments", async () => {
      req.params = { adId: "ad-123" };
      req.query = { page: "2", limit: "5" };

      const mockComments = Array.from({ length: 5 }, (_, i) => ({
        id: `comment-${i + 6}`,
        content: `Comment ${i + 6}`,
        ad_id: "ad-123",
        user_id: "user-123",
      }));

      commentModel.getCommentsByAdId.mockResolvedValue(mockComments);

      await commentsController.getCommentsByAdId(req, res);

      expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
        "ad-123",
        5, // limit
        5 // offset (page 2, 5 per page)
      );
    });

    it("should handle invalid pagination parameters", async () => {
      req.params = { adId: "ad-123" };
      req.query = { page: "invalid", limit: "invalid" };

      const mockComments = [];
      commentModel.getCommentsByAdId.mockResolvedValue(mockComments);

      await commentsController.getCommentsByAdId(req, res);

      // Should use defaults
      expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
        "ad-123",
        10, // default limit
        0 // default offset
      );
    });
  });
});
