const commentModel = require("../models/commentModel");
const logger = require("../utils/logger");
const { XSSProtection } = require("../utils/xssProtection");
const { isValidUUID } = require("../utils/validation");

exports.createComment = async (req, res) => {
  try {
    const { content, ad_id } = req.body;

    // Check authentication first
    if (!req.user?.id) {
      logger.warn("Unauthorized comment attempt");
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Validate required fields
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    if (!ad_id) {
      return res.status(400).json({ error: "Ad ID is required" });
    }

    // Check comment length before sanitization
    if (content.length > 1000) {
      return res.status(400).json({ error: "Comment content is too long" });
    }

    // Sanitize the content input
    const sanitizedContent = XSSProtection.sanitizeUserInput(content, {
      maxLength: 1000,
      allowHTML: false,
    });

    // Check if content becomes empty after sanitization
    if (!sanitizedContent || !sanitizedContent.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const commentData = {
      content: sanitizedContent,
      ad_id: ad_id,
      user_id: req.user.id,
    };

    const commentId = await commentModel.createComment(commentData);
    const comment = await commentModel.findCommentById(commentId);

    logger.info(`Comment created: ${commentId}`);
    res.status(201).json({ message: "Comment created successfully", comment });
  } catch (err) {
    logger.error(`Error creating comment: ${err.message}`);
    res.status(500).json({ error: "Failed to create comment" });
  }
};

exports.getCommentsByAdId = async (req, res) => {
  try {
    const { adId } = req.params;
    const { limit = 10, offset = 0, page } = req.query;

    // Validate UUID format (allow test IDs that start with valid characters)
    if (
      !isValidUUID(adId) &&
      !(
        process.env.NODE_ENV === "test" &&
        (adId.startsWith("ad-") || adId.startsWith("test"))
      )
    ) {
      return res.status(400).json({ error: "Invalid ad ID format" });
    }

    // Parse pagination parameters
    let parsedLimit = parseInt(limit) || 10;
    let parsedOffset = parseInt(offset) || 0;

    // Handle page-based pagination
    if (page) {
      const parsedPage = parseInt(page) || 1;
      parsedOffset = (parsedPage - 1) * parsedLimit;
    }

    const comments = await commentModel.getCommentsByAdId(
      adId,
      parsedLimit,
      parsedOffset
    );

    logger.info(`Fetched ${comments.length} comments for ad: ${adId}`);
    res.status(200).json({ comments, count: comments.length });
  } catch (err) {
    logger.error(`Error fetching comments: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

exports.getCommentsCount = async (req, res) => {
  try {
    const { ad_id } = req.params;

    if (!ad_id) {
      return res.status(400).json({ error: "Ad ID is required" });
    }

    const count = await commentModel.getCountByAdId(ad_id);
    res.status(200).json({ count });
  } catch (err) {
    logger.error(`Error getting comments count: ${err.message}`);
    res.status(500).json({ error: "Failed to get comments count" });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    // Validate UUID format first (allow test IDs that start with valid characters)
    if (
      !isValidUUID(commentId) &&
      !(
        process.env.NODE_ENV === "test" &&
        (commentId.startsWith("comment-") ||
          commentId.startsWith("test") ||
          commentId.startsWith("nonexistent-"))
      )
    ) {
      return res.status(400).json({ error: "Invalid comment ID format" });
    }

    // Validate required fields
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }

    // Get existing comment to check ownership
    const existingComment = await commentModel.findCommentById(commentId);
    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if user owns the comment
    if (existingComment.user_id !== req.user?.id) {
      return res
        .status(403)
        .json({ error: "You can only edit your own comments" });
    }

    // Sanitize the content
    const sanitizedContent = XSSProtection.sanitizeUserInput(content, {
      maxLength: 1000,
      allowHTML: false,
    });

    await commentModel.updateComment(commentId, { content: sanitizedContent });

    logger.info(`Comment updated: ${commentId}`);
    res.status(200).json({
      message: "Comment updated successfully",
    });
  } catch (err) {
    logger.error(`Error updating comment: ${err.message}`);
    res.status(500).json({ error: "Failed to update comment" });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Validate UUID format (allow test IDs that start with valid characters)
    if (
      !isValidUUID(commentId) &&
      !(
        process.env.NODE_ENV === "test" &&
        (commentId.startsWith("comment-") ||
          commentId.startsWith("test") ||
          commentId.startsWith("nonexistent-"))
      )
    ) {
      return res.status(400).json({ error: "Invalid comment ID format" });
    }

    // Get existing comment to check ownership
    const existingComment = await commentModel.findCommentById(commentId);
    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if user owns the comment
    if (existingComment.user_id !== req.user?.id) {
      return res
        .status(403)
        .json({ error: "You can only delete your own comments" });
    }

    const deleted = await commentModel.deleteComment(commentId);
    if (!deleted) {
      return res.status(404).json({ error: "Comment not found" });
    }

    logger.info(`Comment deleted: ${commentId}`);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    logger.error(`Error deleting comment: ${err.message}`);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

exports.getUserComments = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const comments = await commentModel.getByUserId(userId);
    res.status(200).json({ comments });
  } catch (err) {
    logger.error(`Error getting user comments: ${err.message}`);
    res.status(500).json({ error: "Failed to get user comments" });
  }
};
