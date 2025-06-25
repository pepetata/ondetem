const express = require("express");
const router = express.Router();
const favoritesController = require("../controllers/favoritesController");
const { authenticateToken } = require("../utils/middleware");

// All favorites routes require authentication
router.use(authenticateToken);

// GET /api/favorites - Get user's favorite ads
router.get("/", favoritesController.getUserFavorites);

// GET /api/favorites/ids - Get user's favorite ad IDs only
router.get("/ids", favoritesController.getFavoriteIds);

// POST /api/favorites/:adId - Add ad to favorites
router.post("/:adId", favoritesController.addFavorite);

// DELETE /api/favorites/:adId - Remove ad from favorites
router.delete("/:adId", favoritesController.removeFavorite);

// GET /api/favorites/:adId/check - Check if ad is favorited
router.get("/:adId/check", favoritesController.checkFavorite);

module.exports = router;
