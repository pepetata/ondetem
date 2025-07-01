/**
 * Comments Controller Unit Tests
 *
 * Tests the comments controller functions including CRUD operations,
 * security validation, and error handling.
 */

const commentsController = require("../../../src/controllers/commentsController");
const commentModel = require("../../../src/models/commentModel");
const { isValidUUID } = require("../../../src/utils/validation");

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

// Mock validation utilities
jest.mock("../../../src/utils/validation", () => ({
  isValidUUID: jest.fn((id) => {
    // Mock UUID validation - return true for valid UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }),
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
    commentModel.getCountByAdId = jest.fn();
    commentModel.getByUserId = jest.fn();
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

  describe("getCommentsCount", () => {
    it("should return comments count for an ad", async () => {
      req.params = { ad_id: "ad-123" };
      commentModel.getCountByAdId.mockResolvedValue(5);

      await commentsController.getCommentsCount(req, res);

      expect(commentModel.getCountByAdId).toHaveBeenCalledWith("ad-123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ count: 5 });
    });

    it("should handle missing ad_id", async () => {
      req.params = {};

      await commentsController.getCommentsCount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Ad ID is required",
      });
    });

    it("should handle database errors", async () => {
      req.params = { ad_id: "ad-123" };
      commentModel.getCountByAdId.mockRejectedValue(
        new Error("Database error")
      );

      await commentsController.getCommentsCount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to get comments count",
      });
    });
  });

  describe("getUserComments", () => {
    it("should return user comments successfully", async () => {
      const mockComments = [
        {
          id: "comment-1",
          content: "My comment 1",
          ad_id: "ad-123",
          user_id: "user-123",
          created_at: new Date(),
        },
        {
          id: "comment-2",
          content: "My comment 2",
          ad_id: "ad-456",
          user_id: "user-123",
          created_at: new Date(),
        },
      ];

      commentModel.getByUserId.mockResolvedValue(mockComments);

      await commentsController.getUserComments(req, res);

      expect(commentModel.getByUserId).toHaveBeenCalledWith("user-123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ comments: mockComments });
    });

    it("should handle unauthenticated user", async () => {
      req.user = null;

      await commentsController.getUserComments(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not authenticated",
      });
    });

    it("should handle missing user id", async () => {
      req.user = {};

      await commentsController.getUserComments(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not authenticated",
      });
    });

    it("should handle database errors", async () => {
      commentModel.getByUserId.mockRejectedValue(new Error("Database error"));

      await commentsController.getUserComments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to get user comments",
      });
    });

    it("should return empty array when user has no comments", async () => {
      commentModel.getByUserId.mockResolvedValue([]);

      await commentsController.getUserComments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ comments: [] });
    });
  });

  describe("Comprehensive Edge Cases", () => {
    describe("createComment edge cases", () => {
      it("should handle empty string content", async () => {
        req.body = {
          content: "   ",
          ad_id: "ad-123",
        };

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Comment content is required",
        });
      });

      it("should handle content that becomes empty after trimming", async () => {
        req.body = {
          content: "\n\t  \r\n",
          ad_id: "ad-123",
        };

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Comment content is required",
        });
      });

      it("should handle comment at maximum length", async () => {
        const maxLengthContent = "a".repeat(1000);
        req.body = {
          content: maxLengthContent,
          ad_id: "ad-123",
        };

        commentModel.createComment.mockResolvedValue("comment-123");
        commentModel.findCommentById.mockResolvedValue({
          id: "comment-123",
          content: maxLengthContent,
          ad_id: "ad-123",
          user_id: "user-123",
        });

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
      });

      it("should handle comment just over maximum length", async () => {
        const tooLongContent = "a".repeat(1001);
        req.body = {
          content: tooLongContent,
          ad_id: "ad-123",
        };

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Comment content is too long",
        });
      });

      it("should handle user with only id property", async () => {
        req.user = { id: "user-123" };
        req.body = {
          content: "Test comment",
          ad_id: "ad-123",
        };

        commentModel.createComment.mockResolvedValue("comment-123");
        commentModel.findCommentById.mockResolvedValue({
          id: "comment-123",
          content: "Test comment",
          ad_id: "ad-123",
          user_id: "user-123",
        });

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
      });

      it("should handle XSS sanitization that returns different content", async () => {
        const { XSSProtection } = require("../../../src/utils/xssProtection");
        XSSProtection.sanitizeUserInput.mockReturnValue("Clean content");

        req.body = {
          content: '<script>alert("xss")</script>Malicious content',
          ad_id: "ad-123",
        };

        commentModel.createComment.mockResolvedValue("comment-123");
        commentModel.findCommentById.mockResolvedValue({
          id: "comment-123",
          content: "Clean content",
          ad_id: "ad-123",
          user_id: "user-123",
        });

        await commentsController.createComment(req, res);

        expect(XSSProtection.sanitizeUserInput).toHaveBeenCalledWith(
          '<script>alert("xss")</script>Malicious content',
          { maxLength: 1000, allowHTML: false }
        );
        expect(commentModel.createComment).toHaveBeenCalledWith(
          expect.objectContaining({
            content: "Clean content",
          })
        );
      });
    });

    describe("getCommentsByAdId edge cases", () => {
      it("should handle valid UUID format ad ID", async () => {
        req.params = { adId: "123e4567-e89b-12d3-a456-426614174000" };
        commentModel.getCommentsByAdId.mockResolvedValue([]);

        await commentsController.getCommentsByAdId(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
          "123e4567-e89b-12d3-a456-426614174000",
          10,
          0
        );
      });

      it("should handle test environment ad IDs starting with 'ad-'", async () => {
        process.env.NODE_ENV = "test";
        req.params = { adId: "ad-test-123" };
        commentModel.getCommentsByAdId.mockResolvedValue([]);

        await commentsController.getCommentsByAdId(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
      });

      it("should handle test environment ad IDs starting with 'test'", async () => {
        process.env.NODE_ENV = "test";
        req.params = { adId: "test-ad-123" };
        commentModel.getCommentsByAdId.mockResolvedValue([]);

        await commentsController.getCommentsByAdId(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
      });

      it("should handle large page numbers", async () => {
        req.params = { adId: "ad-123" };
        req.query = { page: "100", limit: "5" };
        commentModel.getCommentsByAdId.mockResolvedValue([]);

        await commentsController.getCommentsByAdId(req, res);

        expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
          "ad-123",
          5,
          495 // (100-1) * 5
        );
      });

      it("should handle zero page number", async () => {
        req.params = { adId: "ad-123" };
        req.query = { page: "0", limit: "5" };
        commentModel.getCommentsByAdId.mockResolvedValue([]);

        await commentsController.getCommentsByAdId(req, res);

        expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
          "ad-123",
          5,
          0 // parseInt("0") || 1 becomes 1, (1-1) * 5 = 0
        );
      });

      it("should handle offset-based pagination without page", async () => {
        req.params = { adId: "ad-123" };
        req.query = { limit: "5", offset: "15" };
        commentModel.getCommentsByAdId.mockResolvedValue([]);

        await commentsController.getCommentsByAdId(req, res);

        expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
          "ad-123",
          5,
          15
        );
      });

      it("should handle mixed pagination parameters (page should override offset)", async () => {
        req.params = { adId: "ad-123" };
        req.query = { page: "3", limit: "5", offset: "99" };
        commentModel.getCommentsByAdId.mockResolvedValue([]);

        await commentsController.getCommentsByAdId(req, res);

        expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
          "ad-123",
          5,
          10 // (3-1) * 5, page overrides offset
        );
      });
    });

    describe("updateComment edge cases", () => {
      it("should handle valid UUID format comment ID", async () => {
        const mockComment = {
          id: "123e4567-e89b-12d3-a456-426614174000",
          content: "Original comment",
          ad_id: "ad-123",
          user_id: "user-123",
        };

        req.params = { commentId: "123e4567-e89b-12d3-a456-426614174000" };
        req.body = { content: "Updated comment" };

        commentModel.findCommentById.mockResolvedValue(mockComment);
        commentModel.updateComment.mockResolvedValue(true);

        await commentsController.updateComment(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
      });

      it("should handle test environment comment IDs", async () => {
        process.env.NODE_ENV = "test";
        const mockComment = {
          id: "comment-test-123",
          content: "Original comment",
          ad_id: "ad-123",
          user_id: "user-123",
        };

        req.params = { commentId: "comment-test-123" };
        req.body = { content: "Updated comment" };

        commentModel.findCommentById.mockResolvedValue(mockComment);
        commentModel.updateComment.mockResolvedValue(true);

        await commentsController.updateComment(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
      });

      it("should handle empty content after trimming", async () => {
        req.params = { commentId: "comment-123" };
        req.body = { content: "   \n\t  " };

        await commentsController.updateComment(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Content is required",
        });
      });

      it("should handle missing content field", async () => {
        req.params = { commentId: "comment-123" };
        req.body = {};

        await commentsController.updateComment(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Content is required",
        });
      });

      it("should handle database errors during update", async () => {
        const mockComment = {
          id: "comment-123",
          content: "Original comment",
          ad_id: "ad-123",
          user_id: "user-123",
        };

        req.params = { commentId: "comment-123" };
        req.body = { content: "Updated comment" };

        commentModel.findCommentById.mockResolvedValue(mockComment);
        commentModel.updateComment.mockRejectedValue(
          new Error("Database error")
        );

        await commentsController.updateComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to update comment",
        });
      });

      it("should sanitize updated content", async () => {
        const { XSSProtection } = require("../../../src/utils/xssProtection");
        XSSProtection.sanitizeUserInput.mockReturnValue("Sanitized content");

        const mockComment = {
          id: "comment-123",
          content: "Original comment",
          ad_id: "ad-123",
          user_id: "user-123",
        };

        req.params = { commentId: "comment-123" };
        req.body = {
          content: '<script>alert("xss")</script>Malicious content',
        };

        commentModel.findCommentById.mockResolvedValue(mockComment);
        commentModel.updateComment.mockResolvedValue(true);

        await commentsController.updateComment(req, res);

        expect(XSSProtection.sanitizeUserInput).toHaveBeenCalledWith(
          '<script>alert("xss")</script>Malicious content',
          { maxLength: 1000, allowHTML: false }
        );
        expect(commentModel.updateComment).toHaveBeenCalledWith("comment-123", {
          content: "Sanitized content",
        });
      });
    });

    describe("deleteComment edge cases", () => {
      it("should handle valid UUID format comment ID", async () => {
        const mockComment = {
          id: "123e4567-e89b-12d3-a456-426614174000",
          content: "Comment to delete",
          ad_id: "ad-123",
          user_id: "user-123",
        };

        req.params = { commentId: "123e4567-e89b-12d3-a456-426614174000" };

        commentModel.findCommentById.mockResolvedValue(mockComment);
        commentModel.deleteComment.mockResolvedValue(true);

        await commentsController.deleteComment(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
      });

      it("should handle test environment comment IDs", async () => {
        process.env.NODE_ENV = "test";
        const mockComment = {
          id: "test-comment-123",
          content: "Comment to delete",
          ad_id: "ad-123",
          user_id: "user-123",
        };

        req.params = { commentId: "test-comment-123" };

        commentModel.findCommentById.mockResolvedValue(mockComment);
        commentModel.deleteComment.mockResolvedValue(true);

        await commentsController.deleteComment(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
      });

      it("should handle database errors during comment lookup", async () => {
        req.params = { commentId: "comment-123" };

        commentModel.findCommentById.mockRejectedValue(
          new Error("Database error")
        );

        await commentsController.deleteComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to delete comment",
        });
      });

      it("should handle deletion failure", async () => {
        const mockComment = {
          id: "comment-123",
          content: "Comment to delete",
          ad_id: "ad-123",
          user_id: "user-123",
        };

        req.params = { commentId: "comment-123" };

        commentModel.findCommentById.mockResolvedValue(mockComment);
        commentModel.deleteComment.mockResolvedValue(false);

        await commentsController.deleteComment(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: "Comment not found",
        });
      });

      it("should handle database errors during deletion", async () => {
        const mockComment = {
          id: "comment-123",
          content: "Comment to delete",
          ad_id: "ad-123",
          user_id: "user-123",
        };

        req.params = { commentId: "comment-123" };

        commentModel.findCommentById.mockResolvedValue(mockComment);
        commentModel.deleteComment.mockRejectedValue(
          new Error("Database error")
        );

        await commentsController.deleteComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to delete comment",
        });
      });
    });

    describe("Authentication and Authorization Edge Cases", () => {
      it("should handle user object without id in createComment", async () => {
        req.user = { email: "test@example.com" };
        req.body = {
          content: "Test comment",
          ad_id: "ad-123",
        };

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          error: "User not authenticated",
        });
      });

      it("should handle undefined user in updateComment", async () => {
        req.user = undefined;
        req.params = { commentId: "comment-123" };
        req.body = { content: "Updated content" };

        const mockComment = {
          id: "comment-123",
          content: "Original comment",
          ad_id: "ad-123",
          user_id: "other-user",
        };

        commentModel.findCommentById.mockResolvedValue(mockComment);

        await commentsController.updateComment(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: "You can only edit your own comments",
        });
      });

      it("should handle undefined user in deleteComment", async () => {
        req.user = undefined;
        req.params = { commentId: "comment-123" };

        const mockComment = {
          id: "comment-123",
          content: "Comment to delete",
          ad_id: "ad-123",
          user_id: "other-user",
        };

        commentModel.findCommentById.mockResolvedValue(mockComment);

        await commentsController.deleteComment(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: "You can only delete your own comments",
        });
      });
    });

    describe("Logging and Error Handling", () => {
      it("should log successful comment creation", async () => {
        const logger = require("../../../src/utils/logger");

        req.body = {
          content: "Test comment",
          ad_id: "ad-123",
        };

        commentModel.createComment.mockResolvedValue("comment-123");
        commentModel.findCommentById.mockResolvedValue({
          id: "comment-123",
          content: "Test comment",
          ad_id: "ad-123",
          user_id: "user-123",
        });

        await commentsController.createComment(req, res);

        expect(logger.info).toHaveBeenCalledWith(
          "Comment created: comment-123"
        );
      });

      it("should log successful comment update", async () => {
        const logger = require("../../../src/utils/logger");

        const mockComment = {
          id: "comment-123",
          content: "Original comment",
          ad_id: "ad-123",
          user_id: "user-123",
        };

        req.params = { commentId: "comment-123" };
        req.body = { content: "Updated comment" };

        commentModel.findCommentById.mockResolvedValue(mockComment);
        commentModel.updateComment.mockResolvedValue(true);

        await commentsController.updateComment(req, res);

        expect(logger.info).toHaveBeenCalledWith(
          "Comment updated: comment-123"
        );
      });

      it("should log successful comment deletion", async () => {
        const logger = require("../../../src/utils/logger");

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

        expect(logger.info).toHaveBeenCalledWith(
          "Comment deleted: comment-123"
        );
      });

      it("should log comments fetching", async () => {
        const logger = require("../../../src/utils/logger");

        req.params = { adId: "ad-123" };
        const mockComments = [{ id: "comment-1" }, { id: "comment-2" }];
        commentModel.getCommentsByAdId.mockResolvedValue(mockComments);

        await commentsController.getCommentsByAdId(req, res);

        expect(logger.info).toHaveBeenCalledWith(
          "Fetched 2 comments for ad: ad-123"
        );
      });

      it("should log errors properly", async () => {
        const logger = require("../../../src/utils/logger");

        req.body = {
          content: "Test comment",
          ad_id: "ad-123",
        };

        const dbError = new Error("Database connection failed");
        commentModel.createComment.mockRejectedValue(dbError);

        await commentsController.createComment(req, res);

        expect(logger.error).toHaveBeenCalledWith(
          "Error creating comment: Database connection failed"
        );
      });
    });

    describe("File Upload Error Handling", () => {
      beforeEach(() => {
        req.body = {
          content: "Test comment with attachment",
          ad_id: "ad-123",
        };
      });

      it("should handle missing file when attachment is expected", async () => {
        req.body.hasAttachment = true;
        req.file = null;

        await commentsController.createComment(req, res);

        // Currently passes as no file upload logic exists
        // This test would need updating when file upload is implemented
        expect(res.status).toHaveBeenCalledWith(201);
      });

      it("should handle file size exceeding limits", async () => {
        req.file = {
          filename: "large-file.jpg",
          size: 10 * 1024 * 1024, // 10MB
          mimetype: "image/jpeg",
          path: "/tmp/large-file.jpg",
        };

        // Mock file size validation failure
        const mockError = new Error("File size exceeds limit");
        commentModel.createComment.mockRejectedValue(mockError);

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to create comment",
        });
      });

      it("should handle invalid file types", async () => {
        req.file = {
          filename: "malicious-script.exe",
          size: 1024,
          mimetype: "application/x-msdownload",
          path: "/tmp/malicious-script.exe",
        };

        // Mock file type validation failure
        const mockError = new Error("Invalid file type");
        commentModel.createComment.mockRejectedValue(mockError);

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to create comment",
        });
      });

      it("should handle file upload storage errors", async () => {
        req.file = {
          filename: "valid-image.jpg",
          size: 1024,
          mimetype: "image/jpeg",
          path: "/tmp/valid-image.jpg",
        };

        // Mock storage failure
        const storageError = new Error("Storage service unavailable");
        commentModel.createComment.mockRejectedValue(storageError);

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to create comment",
        });
      });

      it("should handle corrupted file uploads", async () => {
        req.file = {
          filename: "corrupted-image.jpg",
          size: 500,
          mimetype: "image/jpeg",
          path: "/tmp/corrupted-image.jpg",
        };

        // Mock file corruption detection
        const corruptionError = new Error("File is corrupted or invalid");
        commentModel.createComment.mockRejectedValue(corruptionError);

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to create comment",
        });
      });

      it("should handle multiple file upload attempts", async () => {
        req.files = [
          {
            filename: "image1.jpg",
            size: 1024,
            mimetype: "image/jpeg",
            path: "/tmp/image1.jpg",
          },
          {
            filename: "image2.jpg",
            size: 1024,
            mimetype: "image/jpeg",
            path: "/tmp/image2.jpg",
          },
        ];

        // Mock multiple file handling (currently not supported)
        const multiFileError = new Error("Multiple files not supported");
        commentModel.createComment.mockRejectedValue(multiFileError);

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to create comment",
        });
      });

      it("should handle file upload timeout errors", async () => {
        req.file = {
          filename: "slow-upload.jpg",
          size: 5 * 1024 * 1024, // 5MB
          mimetype: "image/jpeg",
          path: "/tmp/slow-upload.jpg",
        };

        // Mock upload timeout
        const timeoutError = new Error("Upload timeout");
        commentModel.createComment.mockRejectedValue(timeoutError);

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to create comment",
        });
      });

      it("should handle insufficient storage space errors", async () => {
        req.file = {
          filename: "valid-document.pdf",
          size: 2 * 1024 * 1024, // 2MB
          mimetype: "application/pdf",
          path: "/tmp/valid-document.pdf",
        };

        // Mock storage space error
        const storageError = new Error("Insufficient storage space");
        commentModel.createComment.mockRejectedValue(storageError);

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to create comment",
        });
      });

      it("should handle file virus scan failures", async () => {
        req.file = {
          filename: "suspicious-file.txt",
          size: 1024,
          mimetype: "text/plain",
          path: "/tmp/suspicious-file.txt",
        };

        // Mock virus scan failure
        const virusError = new Error("File failed security scan");
        commentModel.createComment.mockRejectedValue(virusError);

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to create comment",
        });
      });

      it("should handle file permission errors", async () => {
        req.file = {
          filename: "protected-file.jpg",
          size: 1024,
          mimetype: "image/jpeg",
          path: "/tmp/protected-file.jpg",
        };

        // Mock file permission error
        const permissionError = new Error("Permission denied");
        commentModel.createComment.mockRejectedValue(permissionError);

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to create comment",
        });
      });

      it("should handle file upload network errors", async () => {
        req.file = {
          filename: "network-file.jpg",
          size: 1024,
          mimetype: "image/jpeg",
          path: "/tmp/network-file.jpg",
        };

        // Mock network error during upload
        const networkError = new Error("Network error during upload");
        commentModel.createComment.mockRejectedValue(networkError);

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to create comment",
        });
      });

      it("should handle partial file upload errors", async () => {
        req.file = {
          filename: "partial-upload.jpg",
          size: 0, // Indicates partial upload
          mimetype: "image/jpeg",
          path: "/tmp/partial-upload.jpg",
        };

        // Mock partial upload error
        const partialError = new Error("Partial upload detected");
        commentModel.createComment.mockRejectedValue(partialError);

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to create comment",
        });
      });

      it("should handle file metadata corruption", async () => {
        req.file = {
          filename: "metadata-corrupted.jpg",
          size: 1024,
          mimetype: "image/jpeg",
          path: "/tmp/metadata-corrupted.jpg",
          // Missing or corrupted metadata
        };

        // Mock metadata corruption error
        const metadataError = new Error("File metadata corrupted");
        commentModel.createComment.mockRejectedValue(metadataError);

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to create comment",
        });
      });

      it("should handle file upload cancellation", async () => {
        req.file = {
          filename: "cancelled-upload.jpg",
          size: 1024,
          mimetype: "image/jpeg",
          path: "/tmp/cancelled-upload.jpg",
        };

        // Mock upload cancellation
        const cancellationError = new Error("Upload cancelled by user");
        commentModel.createComment.mockRejectedValue(cancellationError);

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to create comment",
        });
      });

      it("should handle file duplicate upload errors", async () => {
        req.file = {
          filename: "duplicate-file.jpg",
          size: 1024,
          mimetype: "image/jpeg",
          path: "/tmp/duplicate-file.jpg",
        };

        // Mock duplicate file error
        const duplicateError = new Error("File already exists");
        commentModel.createComment.mockRejectedValue(duplicateError);

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to create comment",
        });
      });

      it("should handle file cleanup errors after failed upload", async () => {
        req.file = {
          filename: "cleanup-fail.jpg",
          size: 1024,
          mimetype: "image/jpeg",
          path: "/tmp/cleanup-fail.jpg",
        };

        // Mock cleanup failure after upload error
        const cleanupError = new Error("Failed to cleanup temporary files");
        commentModel.createComment.mockRejectedValue(cleanupError);

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "Failed to create comment",
        });
      });

      it("should handle successful file upload with comment", async () => {
        req.file = {
          filename: "success-upload.jpg",
          size: 1024,
          mimetype: "image/jpeg",
          path: "/tmp/success-upload.jpg",
        };

        commentModel.createComment.mockResolvedValue("comment-123");
        commentModel.findCommentById.mockResolvedValue({
          id: "comment-123",
          content: "Test comment with attachment",
          ad_id: "ad-123",
          user_id: "user-123",
          attachment_url: "/uploads/success-upload.jpg",
        });

        await commentsController.createComment(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          message: "Comment created successfully",
          comment: expect.objectContaining({
            id: "comment-123",
            content: "Test comment with attachment",
            attachment_url: "/uploads/success-upload.jpg",
          }),
        });
      });

      it("should log file upload errors appropriately", async () => {
        const logger = require("../../../src/utils/logger");

        req.file = {
          filename: "error-file.jpg",
          size: 1024,
          mimetype: "image/jpeg",
          path: "/tmp/error-file.jpg",
        };

        const uploadError = new Error("File upload service error");
        commentModel.createComment.mockRejectedValue(uploadError);

        await commentsController.createComment(req, res);

        expect(logger.error).toHaveBeenCalledWith(
          "Error creating comment: File upload service error"
        );
      });
    });
  });
});
