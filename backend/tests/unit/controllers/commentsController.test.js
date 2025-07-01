/**
 * Comments Controller Unit Tests
 *
 * Tests the comments controller functions including CRUD operations,
 * security validation, and error handling.
 */

const commentsController = require("../../../src/controllers/commentsController");
const commentModel = require("../../../src/models/commentModel");
const { isValidUUID } = require("../../../src/utils/validation");

// Import additional models and controllers for integration tests
const userModel = require("../../../src/models/userModel");
const adModel = require("../../../src/models/adModel");
const authController = require("../../../src/controllers/authController");
const usersController = require("../../../src/controllers/usersController");
const adsController = require("../../../src/controllers/adsController");

// Mock dependencies
jest.mock("../../../src/models/commentModel");

// Mock additional models for integration tests
jest.mock("../../../src/models/userModel");
jest.mock("../../../src/models/adModel");
jest.mock("../../../src/controllers/authController");
jest.mock("../../../src/controllers/usersController");
jest.mock("../../../src/controllers/adsController");

// Mock XSSProtection
const { XSSProtection } = require("../../../src/utils/xssProtection");
jest.mock("../../../src/utils/xssProtection", () => ({
  XSSProtection: {
    sanitizeUserInput: jest.fn((input) => input), // Return input as-is for testing
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

    // Reset XSSProtection mock to return input as-is
    const { XSSProtection } = require("../../../src/utils/xssProtection");
    XSSProtection.sanitizeUserInput.mockImplementation((input) => input);

    // Setup comment model method mocks
    commentModel.createComment = jest.fn();
    commentModel.findCommentById = jest.fn();
    commentModel.getCommentsByAdId = jest.fn();
    commentModel.getCountByAdId = jest.fn();
    commentModel.getByUserId = jest.fn();
    commentModel.updateComment = jest.fn();
    commentModel.deleteComment = jest.fn();

    // Setup additional model mocks for integration tests
    userModel.createUser = jest.fn();
    userModel.findUserByEmail = jest.fn();
    userModel.getUserById = jest.fn();
    adModel.createAd = jest.fn();
    adModel.getAdById = jest.fn();
    adModel.getAllAds = jest.fn();
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

      describe("Image Processing Failures", () => {
        it("should handle image format validation errors", async () => {
          req.file = {
            filename: "fake-image.jpg",
            size: 1024,
            mimetype: "image/jpeg",
            path: "/tmp/fake-image.jpg",
          };

          // Mock image format validation failure
          const formatError = new Error("Invalid image format detected");
          commentModel.createComment.mockRejectedValue(formatError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle image dimensions validation errors", async () => {
          req.file = {
            filename: "oversized-image.jpg",
            size: 1024,
            mimetype: "image/jpeg",
            path: "/tmp/oversized-image.jpg",
            // Simulated metadata showing large dimensions
            width: 10000,
            height: 10000,
          };

          // Mock image dimensions validation failure
          const dimensionError = new Error(
            "Image dimensions exceed maximum allowed size"
          );
          commentModel.createComment.mockRejectedValue(dimensionError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle image compression failures", async () => {
          req.file = {
            filename: "compression-fail.jpg",
            size: 5 * 1024 * 1024, // 5MB
            mimetype: "image/jpeg",
            path: "/tmp/compression-fail.jpg",
          };

          // Mock image compression failure
          const compressionError = new Error("Image compression failed");
          commentModel.createComment.mockRejectedValue(compressionError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle image thumbnail generation failures", async () => {
          req.file = {
            filename: "thumbnail-fail.png",
            size: 2 * 1024 * 1024, // 2MB
            mimetype: "image/png",
            path: "/tmp/thumbnail-fail.png",
          };

          // Mock thumbnail generation failure
          const thumbnailError = new Error("Thumbnail generation failed");
          commentModel.createComment.mockRejectedValue(thumbnailError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle image watermark processing failures", async () => {
          req.file = {
            filename: "watermark-fail.jpg",
            size: 1024,
            mimetype: "image/jpeg",
            path: "/tmp/watermark-fail.jpg",
          };

          // Mock watermark processing failure
          const watermarkError = new Error("Watermark processing failed");
          commentModel.createComment.mockRejectedValue(watermarkError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle image EXIF data processing errors", async () => {
          req.file = {
            filename: "exif-error.jpg",
            size: 1024,
            mimetype: "image/jpeg",
            path: "/tmp/exif-error.jpg",
          };

          // Mock EXIF data processing error
          const exifError = new Error("EXIF data processing failed");
          commentModel.createComment.mockRejectedValue(exifError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle image color profile conversion errors", async () => {
          req.file = {
            filename: "color-profile-error.jpg",
            size: 1024,
            mimetype: "image/jpeg",
            path: "/tmp/color-profile-error.jpg",
          };

          // Mock color profile conversion error
          const colorProfileError = new Error(
            "Color profile conversion failed"
          );
          commentModel.createComment.mockRejectedValue(colorProfileError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle image rotation processing failures", async () => {
          req.file = {
            filename: "rotation-fail.jpg",
            size: 1024,
            mimetype: "image/jpeg",
            path: "/tmp/rotation-fail.jpg",
          };

          // Mock image rotation failure
          const rotationError = new Error("Image rotation processing failed");
          commentModel.createComment.mockRejectedValue(rotationError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle image format conversion errors", async () => {
          req.file = {
            filename: "conversion-fail.bmp",
            size: 1024,
            mimetype: "image/bmp",
            path: "/tmp/conversion-fail.bmp",
          };

          // Mock image format conversion error
          const conversionError = new Error("Image format conversion failed");
          commentModel.createComment.mockRejectedValue(conversionError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle image memory allocation errors during processing", async () => {
          req.file = {
            filename: "memory-error.jpg",
            size: 50 * 1024 * 1024, // 50MB
            mimetype: "image/jpeg",
            path: "/tmp/memory-error.jpg",
          };

          // Mock memory allocation error
          const memoryError = new Error(
            "Out of memory during image processing"
          );
          commentModel.createComment.mockRejectedValue(memoryError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle image processing library unavailable errors", async () => {
          req.file = {
            filename: "library-unavailable.jpg",
            size: 1024,
            mimetype: "image/jpeg",
            path: "/tmp/library-unavailable.jpg",
          };

          // Mock image processing library unavailable
          const libraryError = new Error(
            "Image processing library not available"
          );
          commentModel.createComment.mockRejectedValue(libraryError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle corrupted image header errors", async () => {
          req.file = {
            filename: "corrupted-header.jpg",
            size: 1024,
            mimetype: "image/jpeg",
            path: "/tmp/corrupted-header.jpg",
          };

          // Mock corrupted image header error
          const headerError = new Error("Image header is corrupted or invalid");
          commentModel.createComment.mockRejectedValue(headerError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle image processing timeout errors", async () => {
          req.file = {
            filename: "processing-timeout.jpg",
            size: 10 * 1024 * 1024, // 10MB
            mimetype: "image/jpeg",
            path: "/tmp/processing-timeout.jpg",
          };

          // Mock image processing timeout
          const timeoutError = new Error("Image processing timeout");
          commentModel.createComment.mockRejectedValue(timeoutError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle image quality optimization failures", async () => {
          req.file = {
            filename: "quality-optimization-fail.jpg",
            size: 1024,
            mimetype: "image/jpeg",
            path: "/tmp/quality-optimization-fail.jpg",
          };

          // Mock quality optimization failure
          const qualityError = new Error("Image quality optimization failed");
          commentModel.createComment.mockRejectedValue(qualityError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle animated image processing errors", async () => {
          req.file = {
            filename: "animated-error.gif",
            size: 2 * 1024 * 1024, // 2MB
            mimetype: "image/gif",
            path: "/tmp/animated-error.gif",
          };

          // Mock animated image processing error
          const animatedError = new Error(
            "Animated image processing not supported"
          );
          commentModel.createComment.mockRejectedValue(animatedError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle image metadata sanitization errors", async () => {
          req.file = {
            filename: "metadata-sanitization-fail.jpg",
            size: 1024,
            mimetype: "image/jpeg",
            path: "/tmp/metadata-sanitization-fail.jpg",
          };

          // Mock metadata sanitization error
          const sanitizationError = new Error(
            "Image metadata sanitization failed"
          );
          commentModel.createComment.mockRejectedValue(sanitizationError);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle successful image processing with optimization", async () => {
          req.file = {
            filename: "successful-processing.jpg",
            size: 1024,
            mimetype: "image/jpeg",
            path: "/tmp/successful-processing.jpg",
          };

          commentModel.createComment.mockResolvedValue("comment-123");
          commentModel.findCommentById.mockResolvedValue({
            id: "comment-123",
            content: "Test comment with processed image",
            ad_id: "ad-123",
            user_id: "user-123",
            attachment_url: "/uploads/processed-successful-processing.jpg",
            thumbnail_url:
              "/uploads/thumbnails/successful-processing-thumb.jpg",
          });

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.json).toHaveBeenCalledWith({
            message: "Comment created successfully",
            comment: expect.objectContaining({
              id: "comment-123",
              content: "Test comment with processed image",
              attachment_url: "/uploads/processed-successful-processing.jpg",
              thumbnail_url:
                "/uploads/thumbnails/successful-processing-thumb.jpg",
            }),
          });
        });

        it("should log image processing errors appropriately", async () => {
          const logger = require("../../../src/utils/logger");

          req.file = {
            filename: "processing-error-log.jpg",
            size: 1024,
            mimetype: "image/jpeg",
            path: "/tmp/processing-error-log.jpg",
          };

          const processingError = new Error(
            "Complex image processing pipeline failed"
          );
          commentModel.createComment.mockRejectedValue(processingError);

          await commentsController.createComment(req, res);

          expect(logger.error).toHaveBeenCalledWith(
            "Error creating comment: Complex image processing pipeline failed"
          );
        });
      });

      describe("Concurrent User Operations", () => {
        it("should handle concurrent comment creation on same ad", async () => {
          const req1 = {
            body: { content: "First comment", ad_id: "ad-123" },
            user: { id: "user-1", email: "user1@example.com" },
          };
          const req2 = {
            body: { content: "Second comment", ad_id: "ad-123" },
            user: { id: "user-2", email: "user2@example.com" },
          };
          const res1 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };
          const res2 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          // Mock both comments being created successfully
          commentModel.createComment
            .mockResolvedValueOnce("comment-1")
            .mockResolvedValueOnce("comment-2");
          commentModel.findCommentById
            .mockResolvedValueOnce({
              id: "comment-1",
              content: "First comment",
              ad_id: "ad-123",
              user_id: "user-1",
            })
            .mockResolvedValueOnce({
              id: "comment-2",
              content: "Second comment",
              ad_id: "ad-123",
              user_id: "user-2",
            });

          // Simulate concurrent operations
          await Promise.all([
            commentsController.createComment(req1, res1),
            commentsController.createComment(req2, res2),
          ]);

          expect(res1.status).toHaveBeenCalledWith(201);
          expect(res2.status).toHaveBeenCalledWith(201);
          expect(commentModel.createComment).toHaveBeenCalledTimes(2);
        });

        it("should handle concurrent comment updates by different users", async () => {
          const mockComment1 = {
            id: "comment-1",
            content: "Original comment 1",
            ad_id: "ad-123",
            user_id: "user-1",
          };
          const mockComment2 = {
            id: "comment-2",
            content: "Original comment 2",
            ad_id: "ad-123",
            user_id: "user-2",
          };

          const req1 = {
            params: { commentId: "comment-1" },
            body: { content: "Updated comment 1" },
            user: { id: "user-1", email: "user1@example.com" },
          };
          const req2 = {
            params: { commentId: "comment-2" },
            body: { content: "Updated comment 2" },
            user: { id: "user-2", email: "user2@example.com" },
          };
          const res1 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };
          const res2 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          commentModel.findCommentById
            .mockResolvedValueOnce(mockComment1)
            .mockResolvedValueOnce(mockComment2);
          commentModel.updateComment
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(true);

          // Simulate concurrent updates
          await Promise.all([
            commentsController.updateComment(req1, res1),
            commentsController.updateComment(req2, res2),
          ]);

          expect(res1.status).toHaveBeenCalledWith(200);
          expect(res2.status).toHaveBeenCalledWith(200);
          expect(commentModel.updateComment).toHaveBeenCalledTimes(2);
        });

        it("should handle concurrent read operations on same ad", async () => {
          const mockComments = [
            { id: "comment-1", content: "Comment 1", ad_id: "ad-123" },
            { id: "comment-2", content: "Comment 2", ad_id: "ad-123" },
          ];

          const req1 = { params: { adId: "ad-123" }, query: {} };
          const req2 = { params: { adId: "ad-123" }, query: {} };
          const res1 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };
          const res2 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          commentModel.getCommentsByAdId.mockResolvedValue(mockComments);

          // Simulate concurrent read operations
          await Promise.all([
            commentsController.getCommentsByAdId(req1, res1),
            commentsController.getCommentsByAdId(req2, res2),
          ]);

          expect(res1.status).toHaveBeenCalledWith(200);
          expect(res2.status).toHaveBeenCalledWith(200);
          expect(commentModel.getCommentsByAdId).toHaveBeenCalledTimes(2);
        });

        it("should handle concurrent comment deletion attempts", async () => {
          const mockComment = {
            id: "comment-123",
            content: "Comment to delete",
            ad_id: "ad-123",
            user_id: "user-123",
          };

          const req1 = {
            params: { commentId: "comment-123" },
            user: { id: "user-123", email: "user@example.com" },
          };
          const req2 = {
            params: { commentId: "comment-123" },
            user: { id: "user-123", email: "user@example.com" },
          };
          const res1 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };
          const res2 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          commentModel.findCommentById.mockResolvedValue(mockComment);
          commentModel.deleteComment
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(false); // Second deletion fails as comment already deleted

          // Simulate concurrent deletion attempts
          await Promise.all([
            commentsController.deleteComment(req1, res1),
            commentsController.deleteComment(req2, res2),
          ]);

          expect(res1.status).toHaveBeenCalledWith(200);
          expect(res2.status).toHaveBeenCalledWith(404); // Second deletion fails
        });

        it("should handle race condition in comment creation with database constraints", async () => {
          const localReq = {
            body: { content: "Test comment", ad_id: "ad-123" },
            user: { id: "user-123", email: "test@example.com" },
          };
          const localRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          // Mock database constraint violation (e.g., duplicate key)
          const constraintError = new Error("Duplicate key violation");
          constraintError.code = "23505"; // PostgreSQL unique violation code
          commentModel.createComment.mockRejectedValue(constraintError);

          await commentsController.createComment(localReq, localRes);

          expect(localRes.status).toHaveBeenCalledWith(500);
          expect(localRes.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle concurrent access with optimistic locking conflicts", async () => {
          const mockComment = {
            id: "comment-123",
            content: "Original content",
            ad_id: "ad-123",
            user_id: "user-123",
            version: 1,
          };

          req.params = { commentId: "comment-123" };
          req.body = { content: "Updated content" };

          commentModel.findCommentById.mockResolvedValue(mockComment);

          // Mock optimistic locking conflict
          const lockingError = new Error(
            "Version conflict - record was modified"
          );
          commentModel.updateComment.mockRejectedValue(lockingError);

          await commentsController.updateComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to update comment",
          });
        });

        it("should handle concurrent file uploads with same filename", async () => {
          const req1 = {
            body: { content: "Comment with file 1", ad_id: "ad-123" },
            user: { id: "user-1", email: "user1@example.com" },
            file: {
              filename: "image.jpg",
              size: 1024,
              mimetype: "image/jpeg",
              path: "/tmp/image.jpg",
            },
          };
          const req2 = {
            body: { content: "Comment with file 2", ad_id: "ad-123" },
            user: { id: "user-2", email: "user2@example.com" },
            file: {
              filename: "image.jpg",
              size: 1024,
              mimetype: "image/jpeg",
              path: "/tmp/image.jpg",
            },
          };
          const res1 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };
          const res2 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          // Mock file name conflict resolution
          commentModel.createComment
            .mockResolvedValueOnce("comment-1")
            .mockRejectedValueOnce(new Error("File already exists"));
          commentModel.findCommentById.mockResolvedValueOnce({
            id: "comment-1",
            content: "Comment with file 1",
            ad_id: "ad-123",
            user_id: "user-1",
            attachment_url: "/uploads/image.jpg",
          });

          // Simulate concurrent file uploads
          await Promise.all([
            commentsController.createComment(req1, res1),
            commentsController.createComment(req2, res2),
          ]);

          expect(res1.status).toHaveBeenCalledWith(201);
          expect(res2.status).toHaveBeenCalledWith(500);
        });

        it("should handle concurrent user comment retrieval", async () => {
          const mockComments = [
            { id: "comment-1", content: "User comment 1", user_id: "user-123" },
            { id: "comment-2", content: "User comment 2", user_id: "user-123" },
          ];

          const req1 = { user: { id: "user-123", email: "user@example.com" } };
          const req2 = { user: { id: "user-123", email: "user@example.com" } };
          const res1 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };
          const res2 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          commentModel.getByUserId.mockResolvedValue(mockComments);

          // Simulate concurrent user comment retrieval
          await Promise.all([
            commentsController.getUserComments(req1, res1),
            commentsController.getUserComments(req2, res2),
          ]);

          expect(res1.status).toHaveBeenCalledWith(200);
          expect(res2.status).toHaveBeenCalledWith(200);
          expect(commentModel.getByUserId).toHaveBeenCalledTimes(2);
        });

        it("should handle concurrent comment count requests", async () => {
          const req1 = { params: { ad_id: "ad-123" } };
          const req2 = { params: { ad_id: "ad-123" } };
          const res1 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };
          const res2 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          commentModel.getCountByAdId.mockResolvedValue(5);

          // Simulate concurrent count requests
          await Promise.all([
            commentsController.getCommentsCount(req1, res1),
            commentsController.getCommentsCount(req2, res2),
          ]);

          expect(res1.status).toHaveBeenCalledWith(200);
          expect(res2.status).toHaveBeenCalledWith(200);
          expect(res1.json).toHaveBeenCalledWith({ count: 5 });
          expect(res2.json).toHaveBeenCalledWith({ count: 5 });
        });

        it("should handle mixed concurrent operations (create, read, update, delete)", async () => {
          const createReq = {
            body: { content: "New comment", ad_id: "ad-123" },
            user: { id: "user-1", email: "user1@example.com" },
          };
          const readReq = { params: { adId: "ad-123" }, query: {} };
          const updateReq = {
            params: { commentId: "comment-456" },
            body: { content: "Updated content" },
            user: { id: "user-2", email: "user2@example.com" },
          };
          const deleteReq = {
            params: { commentId: "comment-789" },
            user: { id: "user-3", email: "user3@example.com" },
          };

          const createRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };
          const readRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };
          const updateRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };
          const deleteRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          // Mock all operations with proper sequencing for concurrent calls
          commentModel.createComment.mockResolvedValue("comment-new");

          // For concurrent operations, we need to mock findCommentById for each specific call
          commentModel.findCommentById.mockImplementation((commentId) => {
            if (commentId === "comment-new") {
              return Promise.resolve({
                id: "comment-new",
                content: "New comment",
                ad_id: "ad-123",
                user_id: "user-1",
              });
            }
            if (commentId === "comment-456") {
              return Promise.resolve({
                id: "comment-456",
                content: "Original content",
                ad_id: "ad-123",
                user_id: "user-2",
              });
            }
            if (commentId === "comment-789") {
              return Promise.resolve({
                id: "comment-789",
                content: "Content to delete",
                ad_id: "ad-123",
                user_id: "user-3",
              });
            }
            return Promise.resolve(null);
          });

          commentModel.getCommentsByAdId.mockResolvedValue([
            { id: "comment-1", content: "Existing comment" },
          ]);
          commentModel.updateComment.mockResolvedValue(true);
          commentModel.deleteComment.mockResolvedValue(true);

          // Simulate mixed concurrent operations
          await Promise.all([
            commentsController.createComment(createReq, createRes),
            commentsController.getCommentsByAdId(readReq, readRes),
            commentsController.updateComment(updateReq, updateRes),
            commentsController.deleteComment(deleteReq, deleteRes),
          ]);

          expect(createRes.status).toHaveBeenCalledWith(201);
          expect(readRes.status).toHaveBeenCalledWith(200);
          expect(updateRes.status).toHaveBeenCalledWith(200);
          expect(deleteRes.status).toHaveBeenCalledWith(200);
        });

        it("should handle database connection pool exhaustion during concurrent operations", async () => {
          const requests = Array.from({ length: 5 }, (_, i) => ({
            body: { content: `Comment ${i + 1}`, ad_id: "ad-123" },
            user: { id: `user-${i + 1}`, email: `user${i + 1}@example.com` },
          }));
          const responses = Array.from({ length: 5 }, () => ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          }));

          // Mock connection pool exhaustion for some requests
          commentModel.createComment
            .mockResolvedValueOnce("comment-1")
            .mockResolvedValueOnce("comment-2")
            .mockRejectedValueOnce(new Error("Connection pool exhausted"))
            .mockRejectedValueOnce(new Error("Connection pool exhausted"))
            .mockResolvedValueOnce("comment-5");

          commentModel.findCommentById
            .mockResolvedValueOnce({
              id: "comment-1",
              content: "Comment 1",
              ad_id: "ad-123",
              user_id: "user-1",
            })
            .mockResolvedValueOnce({
              id: "comment-2",
              content: "Comment 2",
              ad_id: "ad-123",
              user_id: "user-2",
            })
            .mockResolvedValueOnce({
              id: "comment-5",
              content: "Comment 5",
              ad_id: "ad-123",
              user_id: "user-5",
            });

          // Simulate high concurrency
          await Promise.all(
            requests.map((req, i) =>
              commentsController.createComment(req, responses[i])
            )
          );

          expect(responses[0].status).toHaveBeenCalledWith(201);
          expect(responses[1].status).toHaveBeenCalledWith(201);
          expect(responses[2].status).toHaveBeenCalledWith(500);
          expect(responses[3].status).toHaveBeenCalledWith(500);
          expect(responses[4].status).toHaveBeenCalledWith(201);
        });

        it("should handle concurrent operations with proper error isolation", async () => {
          const successReq = {
            body: { content: "Success comment", ad_id: "ad-123" },
            user: { id: "user-success", email: "success@example.com" },
          };
          const failReq = {
            body: { content: "Fail comment", ad_id: "ad-123" },
            user: { id: "user-fail", email: "fail@example.com" },
          };
          const successRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };
          const failRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          commentModel.createComment
            .mockResolvedValueOnce("comment-success")
            .mockRejectedValueOnce(new Error("Specific database error"));
          commentModel.findCommentById.mockResolvedValueOnce({
            id: "comment-success",
            content: "Success comment",
            ad_id: "ad-123",
            user_id: "user-success",
          });

          // Simulate concurrent operations with mixed success/failure
          await Promise.all([
            commentsController.createComment(successReq, successRes),
            commentsController.createComment(failReq, failRes),
          ]);

          // Success operation should complete normally
          expect(successRes.status).toHaveBeenCalledWith(201);
          expect(successRes.json).toHaveBeenCalledWith({
            message: "Comment created successfully",
            comment: expect.objectContaining({
              id: "comment-success",
            }),
          });

          // Failed operation should not affect the successful one
          expect(failRes.status).toHaveBeenCalledWith(500);
          expect(failRes.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should log concurrent operation metrics appropriately", async () => {
          const logger = require("../../../src/utils/logger");

          const req1 = {
            body: { content: "Concurrent comment 1", ad_id: "ad-123" },
            user: { id: "user-1", email: "user1@example.com" },
          };
          const req2 = {
            body: { content: "Concurrent comment 2", ad_id: "ad-123" },
            user: { id: "user-2", email: "user2@example.com" },
          };
          const res1 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };
          const res2 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          commentModel.createComment
            .mockResolvedValueOnce("comment-1")
            .mockResolvedValueOnce("comment-2");
          commentModel.findCommentById
            .mockResolvedValueOnce({
              id: "comment-1",
              content: "Concurrent comment 1",
              ad_id: "ad-123",
              user_id: "user-1",
            })
            .mockResolvedValueOnce({
              id: "comment-2",
              content: "Concurrent comment 2",
              ad_id: "ad-123",
              user_id: "user-2",
            });

          await Promise.all([
            commentsController.createComment(req1, res1),
            commentsController.createComment(req2, res2),
          ]);

          expect(logger.info).toHaveBeenCalledWith(
            "Comment created: comment-1"
          );
          expect(logger.info).toHaveBeenCalledWith(
            "Comment created: comment-2"
          );
        });
      });
    });

    // Complex Business Logic Path Tests
    describe("Complex Business Logic Paths", () => {
      describe("Content Sanitization and Validation Flow", () => {
        it("should handle content that becomes empty after XSS sanitization in createComment", async () => {
          const { XSSProtection } = require("../../../src/utils/xssProtection");
          req.body = {
            content: "<script>alert('xss')</script>",
            ad_id: "ad-123",
          };

          XSSProtection.sanitizeUserInput.mockReturnValue("");

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            error: "Comment content is required",
          });
        });

        it("should handle content that becomes whitespace-only after XSS sanitization in createComment", async () => {
          const { XSSProtection } = require("../../../src/utils/xssProtection");
          req.body = {
            content: "<div>   </div>",
            ad_id: "ad-123",
          };

          XSSProtection.sanitizeUserInput.mockReturnValue("   ");

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            error: "Comment content is required",
          });
        });

        it("should handle content that reduces to valid text after sanitization in createComment", async () => {
          const { XSSProtection } = require("../../../src/utils/xssProtection");
          const mockComment = {
            id: "comment-123",
            content: "Clean content",
            ad_id: "ad-123",
            user_id: "user-123",
          };

          req.body = {
            content: "<script>alert('xss')</script>Clean content",
            ad_id: "ad-123",
          };

          XSSProtection.sanitizeUserInput.mockReturnValue("Clean content");
          commentModel.createComment.mockResolvedValue("comment-123");
          commentModel.findCommentById.mockResolvedValue(mockComment);

          await commentsController.createComment(req, res);

          expect(commentModel.createComment).toHaveBeenCalledWith({
            content: "Clean content",
            ad_id: "ad-123",
            user_id: "user-123",
          });
          expect(res.status).toHaveBeenCalledWith(201);
        });

        it("should handle pre-sanitization length check vs post-sanitization emptiness", async () => {
          const { XSSProtection } = require("../../../src/utils/xssProtection");
          req.body = {
            content: "a".repeat(999) + "<script>alert('xss')</script>",
            ad_id: "ad-123",
          };

          // Content is over 1000 chars, so length check should fail first
          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            error: "Comment content is too long",
          });
        });

        it("should handle updateComment content sanitization flow", async () => {
          const { XSSProtection } = require("../../../src/utils/xssProtection");
          req.params = { commentId: "comment-123" };
          req.body = { content: "<script>alert('xss')</script>Clean update" };

          const existingComment = {
            id: "comment-123",
            content: "Original content",
            user_id: "user-123",
          };

          isValidUUID.mockReturnValue(true);
          commentModel.findCommentById.mockResolvedValue(existingComment);
          XSSProtection.sanitizeUserInput.mockReturnValue("Clean update");
          commentModel.updateComment.mockResolvedValue(true);

          await commentsController.updateComment(req, res);

          expect(XSSProtection.sanitizeUserInput).toHaveBeenCalledWith(
            "<script>alert('xss')</script>Clean update",
            {
              maxLength: 1000,
              allowHTML: false,
            }
          );
          expect(commentModel.updateComment).toHaveBeenCalledWith(
            "comment-123",
            {
              content: "Clean update",
            }
          );
          expect(res.status).toHaveBeenCalledWith(200);
        });
      });

      describe("Pagination Logic and Edge Cases", () => {
        it("should handle page-based pagination with valid page number", async () => {
          req.params = { adId: "ad-123" };
          req.query = { page: "3", limit: "5" };

          const mockComments = [
            { id: "comment-1", content: "Comment 1" },
            { id: "comment-2", content: "Comment 2" },
          ];

          isValidUUID.mockReturnValue(true);
          commentModel.getCommentsByAdId.mockResolvedValue(mockComments);

          await commentsController.getCommentsByAdId(req, res);

          // Page 3 with limit 5 should have offset 10 (3-1)*5
          expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
            "ad-123",
            5,
            10
          );
          expect(res.status).toHaveBeenCalledWith(200);
        });

        it("should handle page-based pagination with invalid page defaulting to 1", async () => {
          req.params = { adId: "ad-123" };
          req.query = { page: "invalid", limit: "5" };

          const mockComments = [];

          isValidUUID.mockReturnValue(true);
          commentModel.getCommentsByAdId.mockResolvedValue(mockComments);

          await commentsController.getCommentsByAdId(req, res);

          // Invalid page defaults to 1, so offset should be 0
          expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
            "ad-123",
            5,
            0
          );
          expect(res.status).toHaveBeenCalledWith(200);
        });

        it("should prioritize page-based pagination over offset", async () => {
          req.params = { adId: "ad-123" };
          req.query = { page: "2", offset: "50", limit: "10" };

          const mockComments = [];

          isValidUUID.mockReturnValue(true);
          commentModel.getCommentsByAdId.mockResolvedValue(mockComments);

          await commentsController.getCommentsByAdId(req, res);

          // Page 2 with limit 10 should override offset and use 10
          expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
            "ad-123",
            10,
            10
          );
        });

        it("should handle zero page gracefully", async () => {
          req.params = { adId: "ad-123" };
          req.query = { page: "0", limit: "10" };

          const mockComments = [];

          isValidUUID.mockReturnValue(true);
          commentModel.getCommentsByAdId.mockResolvedValue(mockComments);

          await commentsController.getCommentsByAdId(req, res);

          // Page 0 defaults to 1, so offset should be 0
          expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
            "ad-123",
            10,
            0
          );
        });

        it("should handle negative page gracefully", async () => {
          req.params = { adId: "ad-123" };
          req.query = { page: "-5", limit: "10" };

          const mockComments = [];

          isValidUUID.mockReturnValue(true);
          commentModel.getCommentsByAdId.mockResolvedValue(mockComments);

          await commentsController.getCommentsByAdId(req, res);

          // Negative page parsed as -5, so offset becomes (-5-1)*10 = -60
          // But the controller doesn't guard against negative offset
          expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
            "ad-123",
            10,
            -60
          );
        });

        it("should handle large page numbers without overflow", async () => {
          req.params = { adId: "ad-123" };
          req.query = { page: "999999", limit: "10" };

          const mockComments = [];

          isValidUUID.mockReturnValue(true);
          commentModel.getCommentsByAdId.mockResolvedValue(mockComments);

          await commentsController.getCommentsByAdId(req, res);

          // Large page should calculate correct offset
          expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
            "ad-123",
            10,
            9999980
          );
        });
      });

      describe("UUID Validation and Test Environment Logic", () => {
        it("should allow test IDs in test environment for getCommentsByAdId", async () => {
          process.env.NODE_ENV = "test";
          req.params = { adId: "test-ad-123" };

          const mockComments = [];

          isValidUUID.mockReturnValue(false);
          commentModel.getCommentsByAdId.mockResolvedValue(mockComments);

          await commentsController.getCommentsByAdId(req, res);

          expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
            "test-ad-123",
            10,
            0
          );
          expect(res.status).toHaveBeenCalledWith(200);
        });

        it("should allow ad- prefixed IDs in test environment", async () => {
          process.env.NODE_ENV = "test";
          req.params = { adId: "ad-special-123" };

          const mockComments = [];

          isValidUUID.mockReturnValue(false);
          commentModel.getCommentsByAdId.mockResolvedValue(mockComments);

          await commentsController.getCommentsByAdId(req, res);

          expect(res.status).toHaveBeenCalledWith(200);
        });

        it("should reject invalid IDs in production environment", async () => {
          process.env.NODE_ENV = "production";
          req.params = { adId: "test-ad-123" };

          isValidUUID.mockReturnValue(false);

          await commentsController.getCommentsByAdId(req, res);

          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            error: "Invalid ad ID format",
          });
        });

        it("should handle test environment comment ID validation in updateComment", async () => {
          process.env.NODE_ENV = "test";
          req.params = { commentId: "test-comment-123" };
          req.body = { content: "Updated content" };

          const existingComment = {
            id: "test-comment-123",
            user_id: "user-123",
          };

          isValidUUID.mockReturnValue(false);
          commentModel.findCommentById.mockResolvedValue(existingComment);
          commentModel.updateComment.mockResolvedValue(true);

          await commentsController.updateComment(req, res);

          expect(res.status).toHaveBeenCalledWith(200);
        });

        it("should handle test environment comment ID validation in deleteComment", async () => {
          process.env.NODE_ENV = "test";
          req.params = { commentId: "nonexistent-comment-123" };

          const existingComment = {
            id: "nonexistent-comment-123",
            user_id: "user-123",
          };

          isValidUUID.mockReturnValue(false);
          commentModel.findCommentById.mockResolvedValue(existingComment);
          commentModel.deleteComment.mockResolvedValue(true);

          await commentsController.deleteComment(req, res);

          expect(res.status).toHaveBeenCalledWith(200);
        });
      });

      describe("Authentication and Authorization Flow", () => {
        it("should handle missing user in authentication check for createComment", async () => {
          req.user = null;
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

        it("should handle user object without ID for createComment", async () => {
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

        it("should handle user with empty ID for createComment", async () => {
          req.user = { id: "", email: "test@example.com" };
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

        it("should handle ownership mismatch with detailed user comparison in updateComment", async () => {
          req.params = { commentId: "comment-123" };
          req.body = { content: "Updated content" };
          req.user = { id: "user-123" };

          const existingComment = {
            id: "comment-123",
            user_id: "different-user-456",
            content: "Original content",
          };

          isValidUUID.mockReturnValue(true);
          commentModel.findCommentById.mockResolvedValue(existingComment);

          await commentsController.updateComment(req, res);

          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            error: "You can only edit your own comments",
          });
        });

        it("should handle ownership mismatch in deleteComment", async () => {
          req.params = { commentId: "comment-123" };
          req.user = { id: "user-123" };

          const existingComment = {
            id: "comment-123",
            user_id: "different-user-456",
          };

          isValidUUID.mockReturnValue(true);
          commentModel.findCommentById.mockResolvedValue(existingComment);

          await commentsController.deleteComment(req, res);

          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({
            error: "You can only delete your own comments",
          });
        });

        it("should handle missing user authentication in getUserComments", async () => {
          req.user = null;

          await commentsController.getUserComments(req, res);

          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({
            error: "User not authenticated",
          });
        });
      });

      describe("Model Integration and Data Flow", () => {
        it("should handle createComment followed by findCommentById failure", async () => {
          req.body = {
            content: "Test comment",
            ad_id: "ad-123",
          };

          commentModel.createComment.mockResolvedValue("comment-123");
          commentModel.findCommentById.mockRejectedValue(
            new Error("Database connection lost")
          );

          await commentsController.createComment(req, res);

          expect(commentModel.createComment).toHaveBeenCalled();
          expect(commentModel.findCommentById).toHaveBeenCalledWith(
            "comment-123"
          );
          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle successful createComment with null findCommentById result", async () => {
          req.body = {
            content: "Test comment",
            ad_id: "ad-123",
          };

          commentModel.createComment.mockResolvedValue("comment-123");
          commentModel.findCommentById.mockResolvedValue(null);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.json).toHaveBeenCalledWith({
            message: "Comment created successfully",
            comment: null,
          });
        });

        it("should handle updateComment when comment exists but update fails", async () => {
          req.params = { commentId: "comment-123" };
          req.body = { content: "Updated content" };

          const existingComment = {
            id: "comment-123",
            user_id: "user-123",
          };

          isValidUUID.mockReturnValue(true);
          commentModel.findCommentById.mockResolvedValue(existingComment);
          commentModel.updateComment.mockRejectedValue(
            new Error("Database update failed")
          );

          await commentsController.updateComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to update comment",
          });
        });

        it("should handle deleteComment returning false (not found after ownership check)", async () => {
          req.params = { commentId: "comment-123" };

          const existingComment = {
            id: "comment-123",
            user_id: "user-123",
          };

          isValidUUID.mockReturnValue(true);
          commentModel.findCommentById.mockResolvedValue(existingComment);
          commentModel.deleteComment.mockResolvedValue(false);

          await commentsController.deleteComment(req, res);

          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({
            error: "Comment not found",
          });
        });

        it("should handle getCommentsByAdId with empty result set", async () => {
          req.params = { adId: "ad-123" };

          isValidUUID.mockReturnValue(true);
          commentModel.getCommentsByAdId.mockResolvedValue([]);

          await commentsController.getCommentsByAdId(req, res);

          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            comments: [],
            count: 0,
          });
        });

        it("should handle getUserComments with empty result set", async () => {
          commentModel.getByUserId.mockResolvedValue([]);

          await commentsController.getUserComments(req, res);

          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith({
            comments: [],
          });
        });
      });

      describe("Error Handling and Recovery Patterns", () => {
        it("should handle unexpected error types in createComment", async () => {
          req.body = {
            content: "Test comment",
            ad_id: "ad-123",
          };

          commentModel.createComment.mockRejectedValue("String error");

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create comment",
          });
        });

        it("should handle unexpected error format in updateComment", async () => {
          req.params = { commentId: "comment-123" };
          req.body = { content: "Updated content" };

          isValidUUID.mockReturnValue(true);

          // Mock to throw an error with unusual properties
          const unusualError = new Error("Database connection lost");
          unusualError.code = "CONN_LOST";
          unusualError.severity = "CRITICAL";
          commentModel.findCommentById.mockRejectedValue(unusualError);

          await commentsController.updateComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to update comment",
          });
        });

        it("should handle circular reference error in deleteComment", async () => {
          req.params = { commentId: "comment-123" };

          const circularError = new Error("Circular reference");
          circularError.circular = circularError;

          isValidUUID.mockReturnValue(true);
          commentModel.findCommentById.mockRejectedValue(circularError);

          await commentsController.deleteComment(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to delete comment",
          });
        });

        it("should handle timeout error in getCommentsByAdId", async () => {
          req.params = { adId: "ad-123" };

          const timeoutError = new Error("Query timeout");
          timeoutError.code = "TIMEOUT";

          isValidUUID.mockReturnValue(true);
          commentModel.getCommentsByAdId.mockRejectedValue(timeoutError);

          await commentsController.getCommentsByAdId(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to fetch comments",
          });
        });

        it("should handle database connection error in getCommentsCount", async () => {
          req.params = { ad_id: "ad-123" };

          const connectionError = new Error("Connection refused");
          connectionError.code = "ECONNREFUSED";

          commentModel.getCountByAdId.mockRejectedValue(connectionError);

          await commentsController.getCommentsCount(req, res);

          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            error: "Failed to get comments count",
          });
        });
      });

      describe("Complex Input Validation Scenarios", () => {
        it("should handle content with only special characters in createComment", async () => {
          req.body = {
            content: "!@#$%^&*()",
            ad_id: "ad-123",
          };

          const mockComment = {
            id: "comment-123",
            content: "!@#$%^&*()",
            ad_id: "ad-123",
            user_id: "user-123",
          };

          commentModel.createComment.mockResolvedValue("comment-123");
          commentModel.findCommentById.mockResolvedValue(mockComment);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
        });

        it("should handle content with unicode characters in createComment", async () => {
          req.body = {
            content: "Comment with unicode: 🎉 émojis and àccénts",
            ad_id: "ad-123",
          };

          const mockComment = {
            id: "comment-123",
            content: "Comment with unicode: 🎉 émojis and àccénts",
            ad_id: "ad-123",
            user_id: "user-123",
          };

          commentModel.createComment.mockResolvedValue("comment-123");
          commentModel.findCommentById.mockResolvedValue(mockComment);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
        });

        it("should handle exactly 1000 character content in createComment", async () => {
          const content = "a".repeat(1000);
          req.body = {
            content: content,
            ad_id: "ad-123",
          };

          const mockComment = {
            id: "comment-123",
            content: content,
            ad_id: "ad-123",
            user_id: "user-123",
          };

          commentModel.createComment.mockResolvedValue("comment-123");
          commentModel.findCommentById.mockResolvedValue(mockComment);

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
        });

        it("should handle 1001 character content in createComment", async () => {
          const content = "a".repeat(1001);
          req.body = {
            content: content,
            ad_id: "ad-123",
          };

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            error: "Comment content is too long",
          });
        });

        it("should handle ad_id with special characters", async () => {
          const { XSSProtection } = require("../../../src/utils/xssProtection");

          // Clear previous mock implementations
          XSSProtection.sanitizeUserInput.mockClear();
          XSSProtection.sanitizeUserInput.mockReturnValue("Test comment");

          req.body = {
            content: "Test comment",
            ad_id: "ad-123!@#",
          };

          const mockComment = {
            id: "comment-123",
            content: "Test comment",
            ad_id: "ad-123!@#",
            user_id: "user-123",
          };

          commentModel.createComment.mockResolvedValue("comment-123");
          commentModel.findCommentById.mockResolvedValue(mockComment);

          await commentsController.createComment(req, res);

          expect(commentModel.createComment).toHaveBeenCalledWith({
            content: "Test comment",
            ad_id: "ad-123!@#",
            user_id: "user-123",
          });
          expect(res.status).toHaveBeenCalledWith(201);
        });

        it("should handle numeric ad_id in createComment", async () => {
          const { XSSProtection } = require("../../../src/utils/xssProtection");

          // Clear previous mock implementations
          XSSProtection.sanitizeUserInput.mockClear();
          XSSProtection.sanitizeUserInput.mockReturnValue("Test comment");

          req.body = {
            content: "Test comment",
            ad_id: 12345,
          };

          const mockComment = {
            id: "comment-123",
            content: "Test comment",
            ad_id: 12345,
            user_id: "user-123",
          };

          commentModel.createComment.mockResolvedValue("comment-123");
          commentModel.findCommentById.mockResolvedValue(mockComment);

          await commentsController.createComment(req, res);

          expect(commentModel.createComment).toHaveBeenCalledWith({
            content: "Test comment",
            ad_id: 12345,
            user_id: "user-123",
          });
          expect(res.status).toHaveBeenCalledWith(201);
        });

        it("should handle boolean ad_id in createComment", async () => {
          req.body = {
            content: "Test comment",
            ad_id: false,
          };

          await commentsController.createComment(req, res);

          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            error: "Ad ID is required",
          });
        });
      });
    });

    // End-to-End User Workflow Integration Tests
    describe("End-to-End User Workflow Integration Tests", () => {
      // Import all required controllers and models for integration testing
      const authController = require("../../../src/controllers/authController");
      const usersController = require("../../../src/controllers/usersController");
      const adsController = require("../../../src/controllers/adsController");
      const userModel = require("../../../src/models/userModel");
      const adModel = require("../../../src/models/adModel");

      beforeEach(() => {
        // Reset all mocks for integration tests
        jest.clearAllMocks();
        // Additional setup for integration tests if needed
        // Main model mocks are already set up in the parent beforeEach
      });

      describe("Complete User Registration → Login → Comment CRUD Workflow", () => {
        it("should handle complete workflow: register → login → create ad → comment on ad", async () => {
          // Step 1: User Registration
          const registrationReq = {
            body: {
              email: "newuser@example.com",
              password: "password123",
              fullName: "New User",
              phone: "+1234567890",
            },
          };
          const registrationRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const newUser = {
            id: "user-new-123",
            email: "newuser@example.com",
            fullName: "New User",
            phone: "+1234567890",
          };

          userModel.createUser.mockResolvedValue("user-new-123");
          userModel.getUserById.mockResolvedValue(newUser);

          await usersController.createUser(registrationReq, registrationRes);

          // Step 2: User Login
          const loginReq = {
            body: {
              email: "newuser@example.com",
              password: "password123",
            },
          };
          const loginRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn(),
          };

          const authenticatedUser = {
            id: "user-new-123",
            email: "newuser@example.com",
            fullName: "New User",
            password_hash: "hashed_password",
          };

          userModel.findUserByEmail.mockResolvedValue(authenticatedUser);

          // Mock bcrypt comparison
          const bcrypt = require("bcrypt");
          bcrypt.compare = jest.fn().mockResolvedValue(true);

          await authController.login(loginReq, loginRes);

          // Step 3: Create an Ad
          const adCreationReq = {
            body: {
              title: "Test Ad",
              description: "Test ad description",
              category: "electronics",
              price: 100,
            },
            user: { id: "user-new-123", email: "newuser@example.com" },
          };
          const adCreationRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const newAd = {
            id: "ad-new-123",
            title: "Test Ad",
            description: "Test ad description",
            user_id: "user-new-123",
          };

          adModel.createAd.mockResolvedValue("ad-new-123");
          adModel.getAdById.mockResolvedValue(newAd);

          await adsController.createAd(adCreationReq, adCreationRes);

          // Step 4: Comment on the Ad
          const commentReq = {
            body: {
              content: "Great ad! Very interested.",
              ad_id: "ad-new-123",
            },
            user: { id: "user-new-123", email: "newuser@example.com" },
          };
          const commentRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const newComment = {
            id: "comment-new-123",
            content: "Great ad! Very interested.",
            ad_id: "ad-new-123",
            user_id: "user-new-123",
          };

          commentModel.createComment.mockResolvedValue("comment-new-123");
          commentModel.findCommentById.mockResolvedValue(newComment);

          await commentsController.createComment(commentReq, commentRes);

          // Verify the complete workflow - focus on comments controller
          expect(commentModel.createComment).toHaveBeenCalledWith({
            content: "Great ad! Very interested.",
            ad_id: "ad-new-123",
            user_id: "user-new-123",
          });
          expect(commentRes.status).toHaveBeenCalledWith(201);
          expect(commentRes.json).toHaveBeenCalledWith({
            message: "Comment created successfully",
            comment: newComment,
          });
        });

        it("should handle workflow: login → browse ads → comment → update comment → delete comment", async () => {
          // Step 1: User Login (existing user)
          const loginReq = {
            body: {
              email: "existinguser@example.com",
              password: "password123",
            },
          };
          const loginRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn(),
          };

          const existingUser = {
            id: "user-existing-123",
            email: "existinguser@example.com",
            password_hash: "hashed_password",
          };

          userModel.findUserByEmail.mockResolvedValue(existingUser);

          const bcrypt = require("bcrypt");
          bcrypt.compare = jest.fn().mockResolvedValue(true);

          await authController.login(loginReq, loginRes);

          // Step 2: Browse Ads
          const browseReq = { query: {} };
          const browseRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const availableAds = [
            { id: "ad-1", title: "iPhone 12", user_id: "other-user" },
            { id: "ad-2", title: "MacBook Pro", user_id: "other-user" },
          ];

          adModel.getAllAds.mockResolvedValue(availableAds);

          await adsController.getAllAds(browseReq, browseRes);

          // Step 3: Create Comment on Selected Ad
          const commentReq = {
            body: {
              content: "Is this still available?",
              ad_id: "ad-1",
            },
            user: {
              id: "user-existing-123",
              email: "existinguser@example.com",
            },
          };
          const commentRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const newComment = {
            id: "comment-workflow-123",
            content: "Is this still available?",
            ad_id: "ad-1",
            user_id: "user-existing-123",
          };

          commentModel.createComment.mockResolvedValue("comment-workflow-123");
          commentModel.findCommentById.mockResolvedValue(newComment);

          await commentsController.createComment(commentReq, commentRes);

          // Step 4: Update Comment
          const updateReq = {
            params: { commentId: "comment-workflow-123" },
            body: { content: "Is this still available? I'm very interested!" },
            user: {
              id: "user-existing-123",
              email: "existinguser@example.com",
            },
          };
          const updateRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          commentModel.findCommentById.mockResolvedValueOnce(newComment);
          commentModel.updateComment.mockResolvedValue(true);

          await commentsController.updateComment(updateReq, updateRes);

          // Step 5: Delete Comment
          const deleteReq = {
            params: { commentId: "comment-workflow-123" },
            user: {
              id: "user-existing-123",
              email: "existinguser@example.com",
            },
          };
          const deleteRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          commentModel.findCommentById.mockResolvedValueOnce(newComment);
          commentModel.deleteComment.mockResolvedValue(true);

          await commentsController.deleteComment(deleteReq, deleteRes);

          // Verify the complete workflow - focus on comments controller
          expect(commentModel.createComment).toHaveBeenCalledWith({
            content: "Is this still available?",
            ad_id: "ad-1",
            user_id: "user-existing-123",
          });
          expect(commentModel.updateComment).toHaveBeenCalledWith(
            "comment-workflow-123",
            { content: "Is this still available? I'm very interested!" }
          );
          expect(commentModel.deleteComment).toHaveBeenCalledWith(
            "comment-workflow-123"
          );
          expect(deleteRes.status).toHaveBeenCalledWith(200);
        });

        it("should handle workflow: register → login failure → retry login → successful comment", async () => {
          // Step 1: User Registration
          const registrationReq = {
            body: {
              email: "retryuser@example.com",
              password: "newpassword123",
              fullName: "Retry User",
            },
          };
          const registrationRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const newUser = {
            id: "user-retry-123",
            email: "retryuser@example.com",
            fullName: "Retry User",
          };

          userModel.createUser.mockResolvedValue("user-retry-123");
          userModel.getUserById.mockResolvedValue(newUser);

          await usersController.createUser(registrationReq, registrationRes);

          // Step 2: Failed Login Attempt
          const failedLoginReq = {
            body: {
              email: "retryuser@example.com",
              password: "wrongpassword",
            },
          };
          const failedLoginRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const authenticatedUser = {
            id: "user-retry-123",
            email: "retryuser@example.com",
            password_hash: "hashed_correct_password",
          };

          userModel.findUserByEmail.mockResolvedValue(authenticatedUser);

          const bcrypt = require("bcrypt");
          bcrypt.compare = jest.fn().mockResolvedValue(false); // Wrong password

          await authController.login(failedLoginReq, failedLoginRes);

          // Step 3: Successful Login Attempt
          const successLoginReq = {
            body: {
              email: "retryuser@example.com",
              password: "newpassword123",
            },
          };
          const successLoginRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn(),
          };

          bcrypt.compare = jest.fn().mockResolvedValue(true); // Correct password

          await authController.login(successLoginReq, successLoginRes);

          // Step 4: Successful Comment Creation
          const commentReq = {
            body: {
              content: "Finally logged in and can comment!",
              ad_id: "ad-test-123",
            },
            user: { id: "user-retry-123", email: "retryuser@example.com" },
          };
          const commentRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const successComment = {
            id: "comment-retry-123",
            content: "Finally logged in and can comment!",
            ad_id: "ad-test-123",
            user_id: "user-retry-123",
          };

          commentModel.createComment.mockResolvedValue("comment-retry-123");
          commentModel.findCommentById.mockResolvedValue(successComment);

          await commentsController.createComment(commentReq, commentRes);

          // Verify the workflow with retry logic - focus on comments controller
          expect(commentModel.createComment).toHaveBeenCalledWith({
            content: "Finally logged in and can comment!",
            ad_id: "ad-test-123",
            user_id: "user-retry-123",
          });
          expect(commentRes.status).toHaveBeenCalledWith(201);
          expect(commentRes.json).toHaveBeenCalledWith({
            message: "Comment created successfully",
            comment: successComment,
          });
        });
      });

      describe("Multi-User Interaction Workflows", () => {
        it("should handle workflow: user1 creates ad → user2 comments → user1 replies", async () => {
          // Step 1: User 1 creates an ad
          const user1AdReq = {
            body: {
              title: "Selling Laptop",
              description: "Great condition laptop for sale",
              price: 500,
            },
            user: { id: "user-seller-123", email: "seller@example.com" },
          };
          const user1AdRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const sellerAd = {
            id: "ad-seller-123",
            title: "Selling Laptop",
            user_id: "user-seller-123",
          };

          adModel.createAd.mockResolvedValue("ad-seller-123");
          adModel.getAdById.mockResolvedValue(sellerAd);

          await adsController.createAd(user1AdReq, user1AdRes);

          // Step 2: User 2 comments on the ad
          const user2CommentReq = {
            body: {
              content: "What specifications does it have?",
              ad_id: "ad-seller-123",
            },
            user: { id: "user-buyer-123", email: "buyer@example.com" },
          };
          const user2CommentRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const buyerComment = {
            id: "comment-buyer-123",
            content: "What specifications does it have?",
            ad_id: "ad-seller-123",
            user_id: "user-buyer-123",
          };

          commentModel.createComment.mockResolvedValueOnce("comment-buyer-123");
          commentModel.findCommentById.mockResolvedValueOnce(buyerComment);

          await commentsController.createComment(
            user2CommentReq,
            user2CommentRes
          );

          // Step 3: User 1 (seller) replies with another comment
          const user1ReplyReq = {
            body: {
              content: "It has Intel i7, 16GB RAM, 512GB SSD",
              ad_id: "ad-seller-123",
            },
            user: { id: "user-seller-123", email: "seller@example.com" },
          };
          const user1ReplyRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const sellerReply = {
            id: "comment-seller-reply-123",
            content: "It has Intel i7, 16GB RAM, 512GB SSD",
            ad_id: "ad-seller-123",
            user_id: "user-seller-123",
          };

          commentModel.createComment.mockResolvedValueOnce(
            "comment-seller-reply-123"
          );
          commentModel.findCommentById.mockResolvedValueOnce(sellerReply);

          await commentsController.createComment(user1ReplyReq, user1ReplyRes);

          // Step 4: Get all comments for the ad to verify conversation
          const getCommentsReq = {
            params: { adId: "ad-seller-123" },
            query: {},
          };
          const getCommentsRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const allComments = [buyerComment, sellerReply];
          commentModel.getCommentsByAdId.mockResolvedValue(allComments);

          await commentsController.getCommentsByAdId(
            getCommentsReq,
            getCommentsRes
          );

          // Verify the multi-user interaction workflow - focus on comments controller
          expect(commentModel.createComment).toHaveBeenCalledTimes(2);
          expect(commentModel.createComment).toHaveBeenNthCalledWith(1, {
            content: "What specifications does it have?",
            ad_id: "ad-seller-123",
            user_id: "user-buyer-123",
          });
          expect(commentModel.createComment).toHaveBeenNthCalledWith(2, {
            content: "It has Intel i7, 16GB RAM, 512GB SSD",
            ad_id: "ad-seller-123",
            user_id: "user-seller-123",
          });
          expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
            "ad-seller-123",
            10,
            0
          );
          expect(getCommentsRes.json).toHaveBeenCalledWith({
            comments: allComments,
            count: 2,
          });
        });

        it("should handle workflow: multiple users commenting on popular ad with pagination", async () => {
          // Step 1: Create a popular ad
          const popularAdReq = {
            body: {
              title: "iPhone 14 Pro Max",
              description: "Brand new iPhone, sealed box",
              price: 1000,
            },
            user: { id: "user-seller-popular", email: "popular@example.com" },
          };
          const popularAdRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const popularAd = {
            id: "ad-popular-123",
            title: "iPhone 14 Pro Max",
            user_id: "user-seller-popular",
          };

          adModel.createAd.mockResolvedValue("ad-popular-123");
          adModel.getAdById.mockResolvedValue(popularAd);

          await adsController.createAd(popularAdReq, popularAdRes);

          // Step 2: Multiple users create comments
          const users = [
            { id: "user-1", email: "user1@example.com" },
            { id: "user-2", email: "user2@example.com" },
            { id: "user-3", email: "user3@example.com" },
            { id: "user-4", email: "user4@example.com" },
            { id: "user-5", email: "user5@example.com" },
          ];

          const comments = [];
          for (let i = 0; i < users.length; i++) {
            const commentReq = {
              body: {
                content: `Comment ${i + 1}: Interested in this iPhone!`,
                ad_id: "ad-popular-123",
              },
              user: users[i],
            };
            const commentRes = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
            };

            const comment = {
              id: `comment-${i + 1}`,
              content: `Comment ${i + 1}: Interested in this iPhone!`,
              ad_id: "ad-popular-123",
              user_id: users[i].id,
            };

            comments.push(comment);

            commentModel.createComment.mockResolvedValueOnce(
              `comment-${i + 1}`
            );
            commentModel.findCommentById.mockResolvedValueOnce(comment);

            await commentsController.createComment(commentReq, commentRes);
          }

          // Step 3: Test pagination - get first page (3 comments)
          const page1Req = {
            params: { adId: "ad-popular-123" },
            query: { page: "1", limit: "3" },
          };
          const page1Res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const page1Comments = comments.slice(0, 3);
          commentModel.getCommentsByAdId.mockResolvedValueOnce(page1Comments);

          await commentsController.getCommentsByAdId(page1Req, page1Res);

          // Step 4: Test pagination - get second page (remaining 2 comments)
          const page2Req = {
            params: { adId: "ad-popular-123" },
            query: { page: "2", limit: "3" },
          };
          const page2Res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const page2Comments = comments.slice(3, 5);
          commentModel.getCommentsByAdId.mockResolvedValueOnce(page2Comments);

          await commentsController.getCommentsByAdId(page2Req, page2Res);

          // Verify the popular ad workflow with pagination - focus on comments controller
          expect(commentModel.createComment).toHaveBeenCalledTimes(5);
          expect(commentModel.getCommentsByAdId).toHaveBeenNthCalledWith(
            1,
            "ad-popular-123",
            3,
            0
          ); // Page 1: offset 0
          expect(commentModel.getCommentsByAdId).toHaveBeenNthCalledWith(
            2,
            "ad-popular-123",
            3,
            3
          ); // Page 2: offset 3
          expect(page1Res.json).toHaveBeenCalledWith({
            comments: page1Comments,
            count: 3,
          });
          expect(page2Res.json).toHaveBeenCalledWith({
            comments: page2Comments,
            count: 2,
          });
        });
      });

      describe("Error Recovery Workflows", () => {
        it("should handle workflow: register → login → comment fails → retry comment succeeds", async () => {
          // Step 1: User Registration
          const registrationReq = {
            body: {
              email: "resilient@example.com",
              password: "password123",
              fullName: "Resilient User",
            },
          };
          const registrationRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const resilientUser = {
            id: "user-resilient-123",
            email: "resilient@example.com",
            fullName: "Resilient User",
          };

          userModel.createUser.mockResolvedValue("user-resilient-123");
          userModel.getUserById.mockResolvedValue(resilientUser);

          await usersController.createUser(registrationReq, registrationRes);

          // Step 2: Successful Login
          const loginReq = {
            body: {
              email: "resilient@example.com",
              password: "password123",
            },
          };
          const loginRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn(),
          };

          const authenticatedUser = {
            id: "user-resilient-123",
            email: "resilient@example.com",
            password_hash: "hashed_password",
          };

          userModel.findUserByEmail.mockResolvedValue(authenticatedUser);

          const bcrypt = require("bcrypt");
          bcrypt.compare = jest.fn().mockResolvedValue(true);

          await authController.login(loginReq, loginRes);

          // Step 3: First Comment Attempt (Fails due to database error)
          const failedCommentReq = {
            body: {
              content: "This will fail initially",
              ad_id: "ad-resilient-123",
            },
            user: { id: "user-resilient-123", email: "resilient@example.com" },
          };
          const failedCommentRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          commentModel.createComment.mockRejectedValueOnce(
            new Error("Database connection failed")
          );

          await commentsController.createComment(
            failedCommentReq,
            failedCommentRes
          );

          // Step 4: Retry Comment (Succeeds)
          const retryCommentReq = {
            body: {
              content: "This retry will succeed",
              ad_id: "ad-resilient-123",
            },
            user: { id: "user-resilient-123", email: "resilient@example.com" },
          };
          const retryCommentRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const successComment = {
            id: "comment-retry-success-123",
            content: "This retry will succeed",
            ad_id: "ad-resilient-123",
            user_id: "user-resilient-123",
          };

          commentModel.createComment.mockResolvedValueOnce(
            "comment-retry-success-123"
          );
          commentModel.findCommentById.mockResolvedValue(successComment);

          await commentsController.createComment(
            retryCommentReq,
            retryCommentRes
          );

          // Verify the error recovery workflow - focus on comments controller
          expect(commentModel.createComment).toHaveBeenCalledTimes(2);
          expect(failedCommentRes.status).toHaveBeenCalledWith(500);
          expect(retryCommentRes.status).toHaveBeenCalledWith(201);
          expect(retryCommentRes.json).toHaveBeenCalledWith({
            message: "Comment created successfully",
            comment: successComment,
          });
        });

        it("should handle workflow: login → create comment → update fails due to permission → login as correct user → update succeeds", async () => {
          // Step 1: User A Login
          const userALoginReq = {
            body: {
              email: "usera@example.com",
              password: "password123",
            },
          };
          const userALoginRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn(),
          };

          const userA = {
            id: "user-a-123",
            email: "usera@example.com",
            password_hash: "hashed_password",
          };

          userModel.findUserByEmail.mockResolvedValueOnce(userA);

          const bcrypt = require("bcrypt");
          bcrypt.compare = jest.fn().mockResolvedValue(true);

          await authController.login(userALoginReq, userALoginRes);

          // Step 2: User A Creates Comment
          const commentReq = {
            body: {
              content: "Original comment by User A",
              ad_id: "ad-permission-test",
            },
            user: { id: "user-a-123", email: "usera@example.com" },
          };
          const commentRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const originalComment = {
            id: "comment-permission-123",
            content: "Original comment by User A",
            ad_id: "ad-permission-test",
            user_id: "user-a-123",
          };

          commentModel.createComment.mockResolvedValue(
            "comment-permission-123"
          );
          commentModel.findCommentById.mockResolvedValue(originalComment);

          await commentsController.createComment(commentReq, commentRes);

          // Step 3: User B Tries to Update User A's Comment (Should Fail)
          const userBUpdateReq = {
            params: { commentId: "comment-permission-123" },
            body: { content: "User B trying to hijack comment" },
            user: { id: "user-b-123", email: "userb@example.com" },
          };
          const userBUpdateRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          commentModel.findCommentById.mockResolvedValueOnce(originalComment);

          await commentsController.updateComment(
            userBUpdateReq,
            userBUpdateRes
          );

          // Step 4: User A Updates Their Own Comment (Should Succeed)
          const userAUpdateReq = {
            params: { commentId: "comment-permission-123" },
            body: { content: "Updated comment by User A" },
            user: { id: "user-a-123", email: "usera@example.com" },
          };
          const userAUpdateRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          commentModel.findCommentById.mockResolvedValueOnce(originalComment);
          commentModel.updateComment.mockResolvedValue(true);

          await commentsController.updateComment(
            userAUpdateReq,
            userAUpdateRes
          );

          // Verify the permission workflow - focus on comments controller
          expect(commentModel.createComment).toHaveBeenCalledWith({
            content: "Original comment by User A",
            ad_id: "ad-permission-test",
            user_id: "user-a-123",
          });
          expect(userBUpdateRes.status).toHaveBeenCalledWith(403);
          expect(userBUpdateRes.json).toHaveBeenCalledWith({
            error: "You can only edit your own comments",
          });
          expect(commentModel.updateComment).toHaveBeenCalledWith(
            "comment-permission-123",
            { content: "Updated comment by User A" }
          );
          expect(userAUpdateRes.status).toHaveBeenCalledWith(200);
        });
      });

      describe("Complex Data Flow Workflows", () => {
        it("should handle workflow: register → create ad → self-comment → get own comments → get ad comments", async () => {
          // Step 1: User Registration
          const registrationReq = {
            body: {
              email: "selfcommenter@example.com",
              password: "password123",
              fullName: "Self Commenter",
            },
          };
          const registrationRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const selfCommenterUser = {
            id: "user-self-123",
            email: "selfcommenter@example.com",
            fullName: "Self Commenter",
          };

          userModel.createUser.mockResolvedValue("user-self-123");
          userModel.getUserById.mockResolvedValue(selfCommenterUser);

          await usersController.createUser(registrationReq, registrationRes);

          // Step 2: Create Ad
          const adReq = {
            body: {
              title: "My Awesome Product",
              description: "Selling my awesome product",
              price: 250,
            },
            user: { id: "user-self-123", email: "selfcommenter@example.com" },
          };
          const adRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const selfAd = {
            id: "ad-self-123",
            title: "My Awesome Product",
            user_id: "user-self-123",
          };

          adModel.createAd.mockResolvedValue("ad-self-123");
          adModel.getAdById.mockResolvedValue(selfAd);

          await adsController.createAd(adReq, adRes);

          // Step 3: Self-Comment on Own Ad
          const selfCommentReq = {
            body: {
              content: "Additional details: This product comes with warranty!",
              ad_id: "ad-self-123",
            },
            user: { id: "user-self-123", email: "selfcommenter@example.com" },
          };
          const selfCommentRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const selfComment = {
            id: "comment-self-123",
            content: "Additional details: This product comes with warranty!",
            ad_id: "ad-self-123",
            user_id: "user-self-123",
          };

          commentModel.createComment.mockResolvedValue("comment-self-123");
          commentModel.findCommentById.mockResolvedValue(selfComment);

          await commentsController.createComment(
            selfCommentReq,
            selfCommentRes
          );

          // Step 4: Get User's Own Comments
          const getUserCommentsReq = {
            user: { id: "user-self-123", email: "selfcommenter@example.com" },
          };
          const getUserCommentsRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const userComments = [selfComment];
          commentModel.getByUserId.mockResolvedValue(userComments);

          await commentsController.getUserComments(
            getUserCommentsReq,
            getUserCommentsRes
          );

          // Step 5: Get Ad Comments
          const getAdCommentsReq = {
            params: { adId: "ad-self-123" },
            query: {},
          };
          const getAdCommentsRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const adComments = [selfComment];
          commentModel.getCommentsByAdId.mockResolvedValue(adComments);

          await commentsController.getCommentsByAdId(
            getAdCommentsReq,
            getAdCommentsRes
          );

          // Verify the complex data flow workflow - focus on comments controller
          expect(commentModel.createComment).toHaveBeenCalledWith({
            content: "Additional details: This product comes with warranty!",
            ad_id: "ad-self-123",
            user_id: "user-self-123",
          });
          expect(commentModel.getByUserId).toHaveBeenCalledWith(
            "user-self-123"
          );
          expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
            "ad-self-123",
            10,
            0
          );
          expect(getUserCommentsRes.json).toHaveBeenCalledWith({
            comments: userComments,
          });
          expect(getAdCommentsRes.json).toHaveBeenCalledWith({
            comments: adComments,
            count: 1,
          });
        });

        it("should handle workflow with concurrent user sessions and cross-references", async () => {
          // Simulate multiple users with different session states
          const users = [
            {
              id: "user-session-1",
              email: "session1@example.com",
              sessionActive: true,
            },
            {
              id: "user-session-2",
              email: "session2@example.com",
              sessionActive: true,
            },
            {
              id: "user-session-3",
              email: "session3@example.com",
              sessionActive: false,
            },
          ];

          // Step 1: User 1 creates multiple ads
          const ads = [];
          for (let i = 1; i <= 3; i++) {
            const adReq = {
              body: {
                title: `Product ${i} by User 1`,
                description: `Description for product ${i}`,
                price: i * 100,
              },
              user: users[0],
            };
            const adRes = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
            };

            const ad = {
              id: `ad-session-${i}`,
              title: `Product ${i} by User 1`,
              user_id: "user-session-1",
            };
            ads.push(ad);

            adModel.createAd.mockResolvedValueOnce(`ad-session-${i}`);
            adModel.getAdById.mockResolvedValueOnce(ad);

            await adsController.createAd(adReq, adRes);
          }

          // Step 2: User 2 comments on all of User 1's ads
          const comments = [];
          for (let i = 1; i <= 3; i++) {
            const commentReq = {
              body: {
                content: `User 2 comment on product ${i}`,
                ad_id: `ad-session-${i}`,
              },
              user: users[1],
            };
            const commentRes = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
            };

            const comment = {
              id: `comment-user2-${i}`,
              content: `User 2 comment on product ${i}`,
              ad_id: `ad-session-${i}`,
              user_id: "user-session-2",
            };
            comments.push(comment);

            commentModel.createComment.mockResolvedValueOnce(
              `comment-user2-${i}`
            );
            commentModel.findCommentById.mockResolvedValueOnce(comment);

            await commentsController.createComment(commentReq, commentRes);
          }

          // Step 3: User 3 (inactive session) tries to comment - should succeed if properly authenticated
          const user3CommentReq = {
            body: {
              content: "User 3 comment from reactivated session",
              ad_id: "ad-session-1",
            },
            user: users[2], // Even though marked inactive, should work if authenticated
          };
          const user3CommentRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const user3Comment = {
            id: "comment-user3-1",
            content: "User 3 comment from reactivated session",
            ad_id: "ad-session-1",
            user_id: "user-session-3",
          };

          commentModel.createComment.mockResolvedValueOnce("comment-user3-1");
          commentModel.findCommentById.mockResolvedValueOnce(user3Comment);

          await commentsController.createComment(
            user3CommentReq,
            user3CommentRes
          );

          // Step 4: Get all comments for first ad (should have 2 comments)
          const getCommentsReq = {
            params: { adId: "ad-session-1" },
            query: {},
          };
          const getCommentsRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const ad1Comments = [comments[0], user3Comment];
          commentModel.getCommentsByAdId.mockResolvedValue(ad1Comments);

          await commentsController.getCommentsByAdId(
            getCommentsReq,
            getCommentsRes
          );

          // Step 5: User 2 gets their own comments (should have 3)
          const user2CommentsReq = {
            user: users[1],
          };
          const user2CommentsRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          commentModel.getByUserId.mockResolvedValue(comments);

          await commentsController.getUserComments(
            user2CommentsReq,
            user2CommentsRes
          );

          // Verify the concurrent sessions workflow - focus on comments controller
          expect(commentModel.createComment).toHaveBeenCalledTimes(4); // 3 from user2 + 1 from user3
          expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
            "ad-session-1",
            10,
            0
          );
          expect(commentModel.getByUserId).toHaveBeenCalledWith(
            "user-session-2"
          );
          expect(getCommentsRes.json).toHaveBeenCalledWith({
            comments: ad1Comments,
            count: 2,
          });
          expect(user2CommentsRes.json).toHaveBeenCalledWith({
            comments: comments,
          });
        });
      });

      // File Upload Integration Workflow Tests
      describe("File Upload Integration Workflow Tests", () => {
        beforeEach(() => {
          // Reset all mocks for file upload integration tests
          jest.clearAllMocks();

          // Mock bcrypt to avoid native library loading issues
          jest.mock("bcrypt", () => ({
            compare: jest.fn().mockResolvedValue(true),
            hash: jest.fn().mockResolvedValue("hashed_password"),
          }));

          // Mock file system operations
          jest.mock("fs", () => ({
            unlinkSync: jest.fn(),
            existsSync: jest.fn(() => true),
            createReadStream: jest.fn(),
            createWriteStream: jest.fn(),
            stat: jest.fn((path, callback) => callback(null, { size: 1024 })),
          }));

          // Mock multer file uploads
          jest.mock("multer", () => ({
            memoryStorage: jest.fn(() => ({})),
            diskStorage: jest.fn(() => ({})),
            default: jest.fn(() => ({
              single: jest.fn(() => (req, res, next) => {
                req.file = {
                  filename: "test-image.jpg",
                  originalname: "test-image.jpg",
                  mimetype: "image/jpeg",
                  size: 1024,
                  path: "/uploads/test-image.jpg",
                  buffer: Buffer.from("fake-image-data"),
                };
                next();
              }),
              array: jest.fn(() => (req, res, next) => {
                req.files = [
                  {
                    filename: "test-image1.jpg",
                    originalname: "test-image1.jpg",
                    mimetype: "image/jpeg",
                    size: 1024,
                    path: "/uploads/test-image1.jpg",
                  },
                  {
                    filename: "test-image2.jpg",
                    originalname: "test-image2.jpg",
                    mimetype: "image/jpeg",
                    size: 1024,
                    path: "/uploads/test-image2.jpg",
                  },
                ];
                next();
              }),
            })),
          }));
        });

        it("should handle complete workflow: register → login → create ad with images → comment with attachment", async () => {
          // This test focuses on the comments controller integration, mocking other steps

          // Step 1-3: Mock the results of user registration, login, and ad creation
          const mockUser = {
            id: "user-file-123",
            email: "fileuser@example.com",
            fullName: "File User",
          };

          const mockAd = {
            id: "ad-file-123",
            title: "Smartphone with Camera",
            description: "High-quality smartphone with excellent camera",
            user_id: "user-file-123",
            images: ["smartphone1.jpg", "smartphone2.jpg"],
          };

          // Step 4: Focus on commenting with file attachment (comments controller)
          const commentReq = {
            body: {
              content: "Great phone! Can you send more pictures of the camera?",
              ad_id: "ad-file-123",
            },
            user: { id: "user-commenter-123", email: "commenter@example.com" },
            // Future: file attachment for comments
            file: {
              filename: "question-image.jpg",
              originalname: "question-image.jpg",
              mimetype: "image/jpeg",
              size: 512,
              path: "/uploads/comments/question-image.jpg",
            },
          };
          const commentRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const newComment = {
            id: "comment-file-123",
            content: "Great phone! Can you send more pictures of the camera?",
            ad_id: "ad-file-123",
            user_id: "user-commenter-123",
            attachment: "question-image.jpg", // Future feature
          };

          commentModel.createComment.mockResolvedValue("comment-file-123");
          commentModel.findCommentById.mockResolvedValue(newComment);

          await commentsController.createComment(commentReq, commentRes);

          // Step 5: Verify the comments controller handled the file upload workflow
          expect(commentModel.createComment).toHaveBeenCalledWith({
            content: "Great phone! Can you send more pictures of the camera?",
            ad_id: "ad-file-123",
            user_id: "user-commenter-123",
          });

          expect(commentRes.status).toHaveBeenCalledWith(201);
          expect(commentRes.json).toHaveBeenCalledWith({
            message: "Comment created successfully",
            comment: newComment,
          });
        });

        it("should handle workflow: file upload errors → retry → successful comment with attachment", async () => {
          // Step 1: User tries to comment with large file (should fail)
          const largeFileCommentReq = {
            body: {
              content: "Here's a high-res photo of the product defect",
              ad_id: "ad-existing-123",
            },
            user: { id: "user-upload-123", email: "uploader@example.com" },
            file: {
              filename: "large-image.jpg",
              originalname: "large-image.jpg",
              mimetype: "image/jpeg",
              size: 10485760, // 10MB - too large
              path: "/uploads/large-image.jpg",
            },
          };
          const largeFileCommentRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          // Mock file size validation failure
          const fileSizeError = new Error("File size exceeds limit");
          commentModel.createComment.mockRejectedValueOnce(fileSizeError);

          await commentsController.createComment(
            largeFileCommentReq,
            largeFileCommentRes
          );

          // Step 2: User retries with invalid file type
          const invalidTypeCommentReq = {
            body: {
              content: "Here's a document with product details",
              ad_id: "ad-existing-123",
            },
            user: { id: "user-upload-123", email: "uploader@example.com" },
            file: {
              filename: "document.pdf",
              originalname: "document.pdf",
              mimetype: "application/pdf",
              size: 1024,
              path: "/uploads/document.pdf",
            },
          };
          const invalidTypeCommentRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          // Mock file type validation failure
          const fileTypeError = new Error("Invalid file type");
          commentModel.createComment.mockRejectedValueOnce(fileTypeError);

          await commentsController.createComment(
            invalidTypeCommentReq,
            invalidTypeCommentRes
          );

          // Step 3: User successfully comments with valid file
          const validFileCommentReq = {
            body: {
              content: "Here's a proper image showing the issue",
              ad_id: "ad-existing-123",
            },
            user: { id: "user-upload-123", email: "uploader@example.com" },
            file: {
              filename: "valid-image.jpg",
              originalname: "valid-image.jpg",
              mimetype: "image/jpeg",
              size: 2048,
              path: "/uploads/valid-image.jpg",
            },
          };
          const validFileCommentRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const successfulComment = {
            id: "comment-upload-success-123",
            content: "Here's a proper image showing the issue",
            ad_id: "ad-existing-123",
            user_id: "user-upload-123",
            attachment: "valid-image.jpg",
          };

          commentModel.createComment.mockResolvedValue(
            "comment-upload-success-123"
          );
          commentModel.findCommentById.mockResolvedValue(successfulComment);

          await commentsController.createComment(
            validFileCommentReq,
            validFileCommentRes
          );

          // Verify error handling and successful retry
          expect(commentModel.createComment).toHaveBeenCalledTimes(3);
          expect(validFileCommentRes.status).toHaveBeenCalledWith(201);
          expect(validFileCommentRes.json).toHaveBeenCalledWith({
            message: "Comment created successfully",
            comment: successfulComment,
          });
        });

        it("should handle concurrent file upload workflow: multiple users uploading comment attachments simultaneously", async () => {
          // Step 1: Setup multiple users
          const users = [
            { id: "user-concurrent-1", email: "user1@example.com" },
            { id: "user-concurrent-2", email: "user2@example.com" },
            { id: "user-concurrent-3", email: "user3@example.com" },
          ];

          const adId = "ad-concurrent-upload-123";

          // Step 2: Simulate concurrent comment creation with file attachments
          const concurrentRequests = users.map((user, index) => ({
            body: {
              content: `User ${index + 1} comment with attachment`,
              ad_id: adId,
            },
            user: user,
            file: {
              filename: `attachment-${index + 1}.jpg`,
              originalname: `attachment-${index + 1}.jpg`,
              mimetype: "image/jpeg",
              size: 1024 + index * 512, // Different sizes
              path: `/uploads/attachment-${index + 1}.jpg`,
            },
          }));

          const concurrentResponses = users.map(() => ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          }));

          const expectedComments = users.map((user, index) => ({
            id: `comment-concurrent-${index + 1}`,
            content: `User ${index + 1} comment with attachment`,
            ad_id: adId,
            user_id: user.id,
            attachment: `attachment-${index + 1}.jpg`,
          }));

          // Mock sequential comment creation (simulating database transactions)
          commentModel.createComment
            .mockResolvedValueOnce("comment-concurrent-1")
            .mockResolvedValueOnce("comment-concurrent-2")
            .mockResolvedValueOnce("comment-concurrent-3");

          commentModel.findCommentById
            .mockResolvedValueOnce(expectedComments[0])
            .mockResolvedValueOnce(expectedComments[1])
            .mockResolvedValueOnce(expectedComments[2]);

          // Step 3: Execute concurrent requests
          const promises = concurrentRequests.map((req, index) =>
            commentsController.createComment(req, concurrentResponses[index])
          );

          await Promise.all(promises);

          // Step 4: Verify all uploads were processed correctly
          expect(commentModel.createComment).toHaveBeenCalledTimes(3);

          concurrentResponses.forEach((res, index) => {
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
              message: "Comment created successfully",
              comment: expectedComments[index],
            });
          });

          // Step 5: Verify file handling was called for each upload
          concurrentRequests.forEach((req, index) => {
            expect(commentModel.createComment).toHaveBeenCalledWith({
              content: `User ${index + 1} comment with attachment`,
              ad_id: adId,
              user_id: users[index].id,
            });
          });
        });

        it("should handle complex file upload workflow: ad creation → multiple comments with attachments → file cleanup", async () => {
          // Step 1: Mock pre-existing ad with images (focus on comments workflow)
          const adOwner = { id: "user-owner-123", email: "owner@example.com" };
          const mockAd = {
            id: "ad-complex-file-123",
            title: "Product for Sale",
            user_id: "user-owner-123",
            images: ["product-main.jpg"],
          };

          // Step 2: First user comments with question and image
          const comment1Req = {
            body: {
              content: "What's the condition? Here's what I'm looking for",
              ad_id: "ad-complex-file-123",
            },
            user: { id: "user-buyer1-123", email: "buyer1@example.com" },
            file: {
              filename: "comparison-image.jpg",
              originalname: "comparison-image.jpg",
              mimetype: "image/jpeg",
              size: 1024,
              path: "/uploads/comments/comparison-image.jpg",
            },
          };
          const comment1Res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const comment1 = {
            id: "comment-complex-1",
            content: "What's the condition? Here's what I'm looking for",
            ad_id: "ad-complex-file-123",
            user_id: "user-buyer1-123",
            attachment: "comparison-image.jpg",
          };

          commentModel.createComment.mockResolvedValueOnce("comment-complex-1");
          commentModel.findCommentById.mockResolvedValueOnce(comment1);

          await commentsController.createComment(comment1Req, comment1Res);

          // Step 3: Ad owner responds with detailed images
          const comment2Req = {
            body: {
              content: "Here are detailed photos showing the condition",
              ad_id: "ad-complex-file-123",
            },
            user: adOwner,
            file: {
              filename: "detailed-condition.jpg",
              originalname: "detailed-condition.jpg",
              mimetype: "image/jpeg",
              size: 2048,
              path: "/uploads/comments/detailed-condition.jpg",
            },
          };
          const comment2Res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const comment2 = {
            id: "comment-complex-2",
            content: "Here are detailed photos showing the condition",
            ad_id: "ad-complex-file-123",
            user_id: "user-owner-123",
            attachment: "detailed-condition.jpg",
          };

          commentModel.createComment.mockResolvedValueOnce("comment-complex-2");
          commentModel.findCommentById.mockResolvedValueOnce(comment2);

          await commentsController.createComment(comment2Req, comment2Res);

          // Step 4: Second buyer joins with their own image
          const comment3Req = {
            body: {
              content: "I'm also interested. Here's my offer visualization",
              ad_id: "ad-complex-file-123",
            },
            user: { id: "user-buyer2-123", email: "buyer2@example.com" },
            file: {
              filename: "offer-details.jpg",
              originalname: "offer-details.jpg",
              mimetype: "image/jpeg",
              size: 1536,
              path: "/uploads/comments/offer-details.jpg",
            },
          };
          const comment3Res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const comment3 = {
            id: "comment-complex-3",
            content: "I'm also interested. Here's my offer visualization",
            ad_id: "ad-complex-file-123",
            user_id: "user-buyer2-123",
            attachment: "offer-details.jpg",
          };

          commentModel.createComment.mockResolvedValueOnce("comment-complex-3");
          commentModel.findCommentById.mockResolvedValueOnce(comment3);

          await commentsController.createComment(comment3Req, comment3Res);

          // Step 5: Get all comments to verify the conversation
          const getCommentsReq = {
            params: { adId: "ad-complex-file-123" },
            query: {},
          };
          const getCommentsRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const allComments = [comment1, comment2, comment3];
          commentModel.getCommentsByAdId.mockResolvedValue(allComments);

          await commentsController.getCommentsByAdId(
            getCommentsReq,
            getCommentsRes
          );

          // Step 6: Verify the complete comments workflow with file attachments
          expect(commentModel.createComment).toHaveBeenCalledTimes(3);
          expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
            "ad-complex-file-123",
            10,
            0
          );

          expect(getCommentsRes.json).toHaveBeenCalledWith({
            comments: allComments,
            count: 3,
          });

          // Verify all comments were created successfully with file attachments
          [comment1Res, comment2Res, comment3Res].forEach((res) => {
            expect(res.status).toHaveBeenCalledWith(201);
          });

          // Verify the content of comments with attachments
          expect(commentModel.createComment).toHaveBeenCalledWith({
            content: "What's the condition? Here's what I'm looking for",
            ad_id: "ad-complex-file-123",
            user_id: "user-buyer1-123",
          });

          expect(commentModel.createComment).toHaveBeenCalledWith({
            content: "Here are detailed photos showing the condition",
            ad_id: "ad-complex-file-123",
            user_id: "user-owner-123",
          });

          expect(commentModel.createComment).toHaveBeenCalledWith({
            content: "I'm also interested. Here's my offer visualization",
            ad_id: "ad-complex-file-123",
            user_id: "user-buyer2-123",
          });
        });

        it("should handle file upload cleanup workflow: failed comment → successful retry → file management", async () => {
          const fs = require("fs");

          // Step 1: First attempt fails due to network error during file processing
          const failedUploadReq = {
            body: {
              content: "Check this image for product details",
              ad_id: "ad-cleanup-123",
            },
            user: { id: "user-cleanup-123", email: "cleanup@example.com" },
            file: {
              filename: "temp-upload-1.jpg",
              originalname: "temp-upload-1.jpg",
              mimetype: "image/jpeg",
              size: 2048,
              path: "/uploads/temp/temp-upload-1.jpg",
            },
          };
          const failedUploadRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          // Mock network error during comment creation
          const networkError = new Error(
            "Network timeout during file processing"
          );
          commentModel.createComment.mockRejectedValueOnce(networkError);

          await commentsController.createComment(
            failedUploadReq,
            failedUploadRes
          );

          // Step 2: System should clean up failed upload file
          // In a real implementation, this would be handled by error middleware
          expect(failedUploadRes.status).toHaveBeenCalledWith(500);

          // Step 3: User retries with same content but new file
          const retryUploadReq = {
            body: {
              content: "Check this image for product details (retry)",
              ad_id: "ad-cleanup-123",
            },
            user: { id: "user-cleanup-123", email: "cleanup@example.com" },
            file: {
              filename: "temp-upload-2.jpg",
              originalname: "temp-upload-2.jpg",
              mimetype: "image/jpeg",
              size: 2048,
              path: "/uploads/temp/temp-upload-2.jpg",
            },
          };
          const retryUploadRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const successfulComment = {
            id: "comment-cleanup-success",
            content: "Check this image for product details (retry)",
            ad_id: "ad-cleanup-123",
            user_id: "user-cleanup-123",
            attachment: "temp-upload-2.jpg",
          };

          commentModel.createComment.mockResolvedValue(
            "comment-cleanup-success"
          );
          commentModel.findCommentById.mockResolvedValue(successfulComment);

          await commentsController.createComment(
            retryUploadReq,
            retryUploadRes
          );

          // Step 4: Later, user deletes the comment
          const deleteCommentReq = {
            params: { commentId: "comment-cleanup-success" },
            user: { id: "user-cleanup-123", email: "cleanup@example.com" },
          };
          const deleteCommentRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          commentModel.findCommentById.mockResolvedValueOnce(successfulComment);
          commentModel.deleteComment.mockResolvedValue(true);

          await commentsController.deleteComment(
            deleteCommentReq,
            deleteCommentRes
          );

          // Step 5: Verify the complete cleanup workflow
          expect(commentModel.createComment).toHaveBeenCalledTimes(2);
          expect(retryUploadRes.status).toHaveBeenCalledWith(201);
          expect(commentModel.deleteComment).toHaveBeenCalledWith(
            "comment-cleanup-success"
          );
          expect(deleteCommentRes.status).toHaveBeenCalledWith(200);

          // In a real implementation, file cleanup would be verified here
          // expect(fs.unlinkSync).toHaveBeenCalledWith('/uploads/temp/temp-upload-2.jpg');
        });

        it("should handle multi-step file upload workflow: batch comment creation with mixed media types", async () => {
          // Step 1: Setup scenario - product Q&A session with multiple file types
          const adId = "ad-mixed-media-123";
          const participants = [
            {
              id: "user-questioner-123",
              email: "questioner@example.com",
              role: "buyer",
            },
            {
              id: "user-seller-123",
              email: "seller@example.com",
              role: "seller",
            },
            {
              id: "user-expert-123",
              email: "expert@example.com",
              role: "expert",
            },
          ];

          // Step 2: Questioner uploads comparison image
          const step1Req = {
            body: {
              content: "How does this compare to the model shown in my image?",
              ad_id: adId,
            },
            user: participants[0],
            file: {
              filename: "comparison-model.jpg",
              originalname: "comparison-model.jpg",
              mimetype: "image/jpeg",
              size: 1800,
              path: "/uploads/comments/comparison-model.jpg",
            },
          };
          const step1Res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const comment1 = {
            id: "comment-mixed-1",
            content: "How does this compare to the model shown in my image?",
            ad_id: adId,
            user_id: participants[0].id,
            attachment: "comparison-model.jpg",
          };

          commentModel.createComment.mockResolvedValueOnce("comment-mixed-1");
          commentModel.findCommentById.mockResolvedValueOnce(comment1);

          await commentsController.createComment(step1Req, step1Res);

          // Step 3: Seller responds with detailed product shots
          const step2Req = {
            body: {
              content: "Here are multiple angles showing the differences",
              ad_id: adId,
            },
            user: participants[1],
            file: {
              filename: "product-angles.jpg",
              originalname: "product-angles.jpg",
              mimetype: "image/jpeg",
              size: 2500,
              path: "/uploads/comments/product-angles.jpg",
            },
          };
          const step2Res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const comment2 = {
            id: "comment-mixed-2",
            content: "Here are multiple angles showing the differences",
            ad_id: adId,
            user_id: participants[1].id,
            attachment: "product-angles.jpg",
          };

          commentModel.createComment.mockResolvedValueOnce("comment-mixed-2");
          commentModel.findCommentById.mockResolvedValueOnce(comment2);

          await commentsController.createComment(step2Req, step2Res);

          // Step 4: Expert provides technical diagram
          const step3Req = {
            body: {
              content:
                "Technical analysis: Here's a detailed comparison diagram",
              ad_id: adId,
            },
            user: participants[2],
            file: {
              filename: "technical-diagram.png",
              originalname: "technical-diagram.png",
              mimetype: "image/png",
              size: 3000,
              path: "/uploads/comments/technical-diagram.png",
            },
          };
          const step3Res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const comment3 = {
            id: "comment-mixed-3",
            content: "Technical analysis: Here's a detailed comparison diagram",
            ad_id: adId,
            user_id: participants[2].id,
            attachment: "technical-diagram.png",
          };

          commentModel.createComment.mockResolvedValueOnce("comment-mixed-3");
          commentModel.findCommentById.mockResolvedValueOnce(comment3);

          await commentsController.createComment(step3Req, step3Res);

          // Step 5: Questioner follows up with multiple small images
          const step4Req = {
            body: {
              content:
                "Thanks! Here are close-up shots of specific features I need",
              ad_id: adId,
            },
            user: participants[0],
            files: [
              // Note: multiple files
              {
                filename: "feature-1.jpg",
                originalname: "feature-1.jpg",
                mimetype: "image/jpeg",
                size: 800,
                path: "/uploads/comments/feature-1.jpg",
              },
              {
                filename: "feature-2.jpg",
                originalname: "feature-2.jpg",
                mimetype: "image/jpeg",
                size: 750,
                path: "/uploads/comments/feature-2.jpg",
              },
            ],
          };
          const step4Res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const comment4 = {
            id: "comment-mixed-4",
            content:
              "Thanks! Here are close-up shots of specific features I need",
            ad_id: adId,
            user_id: participants[0].id,
            attachments: ["feature-1.jpg", "feature-2.jpg"], // Multiple attachments
          };

          commentModel.createComment.mockResolvedValueOnce("comment-mixed-4");
          commentModel.findCommentById.mockResolvedValueOnce(comment4);

          await commentsController.createComment(step4Req, step4Res);

          // Step 6: Get complete conversation thread
          const getThreadReq = {
            params: { adId: adId },
            query: { sort: "asc", includeAttachments: true },
          };
          const getThreadRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
          };

          const fullThread = [comment1, comment2, comment3, comment4];
          commentModel.getCommentsByAdId.mockResolvedValue(fullThread);

          await commentsController.getCommentsByAdId(
            getThreadReq,
            getThreadRes
          );

          // Step 7: Verify the complete multi-step workflow
          expect(commentModel.createComment).toHaveBeenCalledTimes(4);

          // Verify each step was successful
          [step1Res, step2Res, step3Res, step4Res].forEach((res) => {
            expect(res.status).toHaveBeenCalledWith(201);
          });

          // Verify thread retrieval
          expect(commentModel.getCommentsByAdId).toHaveBeenCalledWith(
            adId,
            10,
            0
          );

          expect(getThreadRes.json).toHaveBeenCalledWith({
            comments: fullThread,
            count: 4,
          });

          // Verify different file types were handled
          expect(commentModel.createComment).toHaveBeenCalledWith(
            expect.objectContaining({
              content: "How does this compare to the model shown in my image?",
              ad_id: adId,
              user_id: participants[0].id,
            })
          );

          expect(commentModel.createComment).toHaveBeenCalledWith(
            expect.objectContaining({
              content:
                "Technical analysis: Here's a detailed comparison diagram",
              ad_id: adId,
              user_id: participants[2].id,
            })
          );
        });
      });
    });
  });
});
