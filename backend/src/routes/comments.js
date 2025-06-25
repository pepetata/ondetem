const express = require("express");
const router = express.Router();
const {
  createComment,
  getCommentsByAdId,
  getCommentsCount,
  updateComment,
  deleteComment,
  getUserComments,
} = require("../controllers/commentsController");
const { authenticateToken } = require("../utils/middleware");

// Test route to check if comments API is working
router.get("/", (req, res) => {
  res.json({
    message: "Comments API is working",
    timestamp: new Date().toISOString(),
  });
});

// Create a new comment (requires authentication)
router.post("/", authenticateToken, createComment);

// Get all comments for a specific ad (public)
router.get("/ad/:ad_id", getCommentsByAdId);

// Get comments count for a specific ad (public)
router.get("/ad/:ad_id/count", getCommentsCount);

// Get all comments by the authenticated user
router.get("/user", authenticateToken, getUserComments);

// Update a comment (requires authentication and ownership)
router.put("/:id", authenticateToken, updateComment);

// Delete a comment (requires authentication and ownership)
router.delete("/:id", authenticateToken, deleteComment);

module.exports = router;
