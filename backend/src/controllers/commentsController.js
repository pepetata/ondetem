const Comment = require("../models/commentModel");
const logger = require("../utils/logger");

// Create a new comment
const createComment = async (req, res) => {
  try {
    const { ad_id, content } = req.body;
    const user_id = req.user.id;

    // Validate required fields
    if (!ad_id || !content) {
      return res.status(400).json({
        success: false,
        message: "Ad ID and content are required",
      });
    }

    // Validate content length
    if (content.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Comment content cannot be empty",
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment content cannot exceed 1000 characters",
      });
    }

    // Create the comment
    const comment = new Comment(ad_id, user_id, content.trim());
    const savedComment = await comment.save();

    // Get the comment with user info
    const commentWithUser = await Comment.getById(savedComment.id);

    logger.info(
      `Comment created: ${savedComment.id} by user ${user_id} on ad ${ad_id}`
    );

    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      comment: commentWithUser,
    });
  } catch (error) {
    logger.error("Error creating comment:", error);
    res.status(500).json({
      success: false,
      message: "Error creating comment",
      error: error.message,
    });
  }
};

// Get all comments for an ad
const getCommentsByAdId = async (req, res) => {
  try {
    const { ad_id } = req.params;

    if (!ad_id) {
      return res.status(400).json({
        success: false,
        message: "Ad ID is required",
      });
    }

    const comments = await Comment.getByAdId(ad_id);

    res.status(200).json({
      success: true,
      comments,
      count: comments.length,
    });
  } catch (error) {
    logger.error("Error fetching comments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching comments",
      error: error.message,
    });
  }
};

// Get comments count for an ad
const getCommentsCount = async (req, res) => {
  try {
    const { ad_id } = req.params;

    if (!ad_id) {
      return res.status(400).json({
        success: false,
        message: "Ad ID is required",
      });
    }

    const count = await Comment.getCountByAdId(ad_id);

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    logger.error("Error counting comments:", error);
    res.status(500).json({
      success: false,
      message: "Error counting comments",
      error: error.message,
    });
  }
};

// Update a comment
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    if (content.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Comment content cannot be empty",
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment content cannot exceed 1000 characters",
      });
    }

    // Check if comment exists and belongs to user
    const existingComment = await Comment.getById(id);
    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (existingComment.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own comments",
      });
    }

    // Update the comment
    const updatedComment = await Comment.update(id, content.trim());
    const commentWithUser = await Comment.getById(updatedComment.id);

    logger.info(`Comment updated: ${id} by user ${user_id}`);

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comment: commentWithUser,
    });
  } catch (error) {
    logger.error("Error updating comment:", error);
    res.status(500).json({
      success: false,
      message: "Error updating comment",
      error: error.message,
    });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Check if comment exists and belongs to user
    const existingComment = await Comment.getById(id);
    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (existingComment.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments",
      });
    }

    // Delete the comment
    await Comment.delete(id);

    logger.info(`Comment deleted: ${id} by user ${user_id}`);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting comment:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting comment",
      error: error.message,
    });
  }
};

// Get all comments by a user
const getUserComments = async (req, res) => {
  try {
    const user_id = req.user.id;

    const comments = await Comment.getByUserId(user_id);

    res.status(200).json({
      success: true,
      comments,
      count: comments.length,
    });
  } catch (error) {
    logger.error("Error fetching user comments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user comments",
      error: error.message,
    });
  }
};

module.exports = {
  createComment,
  getCommentsByAdId,
  getCommentsCount,
  updateComment,
  deleteComment,
  getUserComments,
};
