const Comment = require("../../../src/models/commentModel");
const { safePool } = require("../../../src/utils/sqlSecurity");
const { v4: uuidv4 } = require("uuid");

// Mock dependencies
jest.mock("../../../src/utils/sqlSecurity");
jest.mock("uuid");

describe("Comment Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uuidv4.mockReturnValue("mock-uuid-123");
  });

  describe("Constructor", () => {
    it("should create comment with provided id", () => {
      const comment = new Comment(
        "ad-123",
        "user-123",
        "Test content",
        "comment-123"
      );

      expect(comment.id).toBe("comment-123");
      expect(comment.ad_id).toBe("ad-123");
      expect(comment.user_id).toBe("user-123");
      expect(comment.content).toBe("Test content");
    });

    it("should create comment with generated UUID when no id provided", () => {
      const comment = new Comment("ad-123", "user-123", "Test content");

      expect(comment.id).toBe("mock-uuid-123");
      expect(comment.ad_id).toBe("ad-123");
      expect(comment.user_id).toBe("user-123");
      expect(comment.content).toBe("Test content");
    });
  });

  describe("save", () => {
    it("should save comment successfully", async () => {
      const mockResult = {
        rows: [
          {
            id: "comment-123",
            ad_id: "ad-123",
            user_id: "user-123",
            content: "Test content",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const comment = new Comment("ad-123", "user-123", "Test content");
      const result = await comment.save();

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO comments"),
        ["mock-uuid-123", "ad-123", "user-123", "Test content"],
        "create_comment"
      );
      expect(result).toEqual(mockResult.rows[0]);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      safePool.safeQuery.mockRejectedValue(error);

      const comment = new Comment("ad-123", "user-123", "Test content");

      await expect(comment.save()).rejects.toThrow(
        "Error creating comment: Database connection failed"
      );
    });
  });

  describe("getByAdId", () => {
    it("should get comments by ad ID successfully", async () => {
      const mockResult = {
        rows: [
          {
            id: "comment-1",
            ad_id: "ad-123",
            content: "Comment 1",
            full_name: "John Doe",
            nickname: "john",
            email: "john@example.com",
          },
          {
            id: "comment-2",
            ad_id: "ad-123",
            content: "Comment 2",
            full_name: "Jane Doe",
            nickname: "jane",
            email: "jane@example.com",
          },
        ],
      };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await Comment.getByAdId("ad-123");

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        ["ad-123"],
        "get_comments_by_ad"
      );
      expect(result).toEqual(mockResult.rows);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      safePool.safeQuery.mockRejectedValue(error);

      await expect(Comment.getByAdId("ad-123")).rejects.toThrow(
        "Error fetching comments: Database connection failed"
      );
    });
  });

  describe("getById", () => {
    it("should get comment by ID successfully", async () => {
      const mockResult = {
        rows: [
          {
            id: "comment-123",
            ad_id: "ad-123",
            content: "Test content",
            full_name: "John Doe",
            nickname: "john",
            email: "john@example.com",
          },
        ],
      };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await Comment.getById("comment-123");

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        ["comment-123"],
        "get_comment_by_id"
      );
      expect(result).toEqual(mockResult.rows[0]);
    });

    it("should return null when comment not found", async () => {
      const mockResult = { rows: [] };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await Comment.getById("nonexistent-id");

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      safePool.safeQuery.mockRejectedValue(error);

      await expect(Comment.getById("comment-123")).rejects.toThrow(
        "Error fetching comment: Database connection failed"
      );
    });
  });

  describe("update", () => {
    it("should update comment successfully", async () => {
      const mockResult = {
        rows: [
          {
            id: "comment-123",
            content: "Updated content",
            updated_at: new Date(),
          },
        ],
      };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await Comment.update("comment-123", "Updated content");

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE comments"),
        ["Updated content", "comment-123"],
        "update_comment"
      );
      expect(result).toEqual(mockResult.rows[0]);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      safePool.safeQuery.mockRejectedValue(error);

      await expect(
        Comment.update("comment-123", "Updated content")
      ).rejects.toThrow("Error updating comment: Database connection failed");
    });
  });

  describe("delete", () => {
    it("should delete comment successfully", async () => {
      const mockResult = {
        rows: [
          {
            id: "comment-123",
            ad_id: "ad-123",
            content: "Deleted content",
          },
        ],
      };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await Comment.delete("comment-123");

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        "DELETE FROM comments WHERE id = $1 RETURNING *",
        ["comment-123"],
        "delete_comment"
      );
      expect(result).toEqual(mockResult.rows[0]);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      safePool.safeQuery.mockRejectedValue(error);

      await expect(Comment.delete("comment-123")).rejects.toThrow(
        "Error deleting comment: Database connection failed"
      );
    });
  });

  describe("getCountByAdId", () => {
    it("should get comments count successfully", async () => {
      const mockResult = { rows: [{ count: "5" }] };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await Comment.getCountByAdId("ad-123");

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        "SELECT COUNT(*) as count FROM comments WHERE ad_id = $1",
        ["ad-123"],
        "get_comments_count"
      );
      expect(result).toBe(5);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      safePool.safeQuery.mockRejectedValue(error);

      await expect(Comment.getCountByAdId("ad-123")).rejects.toThrow(
        "Error counting comments: Database connection failed"
      );
    });
  });

  describe("getByUserId", () => {
    it("should get comments by user ID successfully", async () => {
      const mockResult = {
        rows: [
          {
            id: "comment-1",
            user_id: "user-123",
            content: "Comment 1",
            ad_title: "Test Ad 1",
          },
          {
            id: "comment-2",
            user_id: "user-123",
            content: "Comment 2",
            ad_title: "Test Ad 2",
          },
        ],
      };
      safePool.safeQuery.mockResolvedValue(mockResult);

      const result = await Comment.getByUserId("user-123");

      expect(safePool.safeQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        ["user-123"],
        "get_comments_by_user"
      );
      expect(result).toEqual(mockResult.rows);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      safePool.safeQuery.mockRejectedValue(error);

      await expect(Comment.getByUserId("user-123")).rejects.toThrow(
        "Error fetching user comments: Database connection failed"
      );
    });
  });
});
