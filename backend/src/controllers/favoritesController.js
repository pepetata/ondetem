const favoriteModel = require("../models/favoriteModel");
const logger = require("../utils/logger");

exports.addFavorite = async (req, res) => {
  try {
    const { adId } = req.params;
    const userId = req.user.id;

    const added = await favoriteModel.addFavorite(userId, adId);

    if (added) {
      logger.info(`User ${userId} added ad ${adId} to favorites`);
      res.status(201).json({ message: "Anúncio adicionado aos favoritos" });
    } else {
      logger.warn(
        `User ${userId} tried to add ad ${adId} to favorites, but it already exists`
      );
      res.status(200).json({ message: "Anúncio já está nos favoritos" });
    }
  } catch (error) {
    logger.error(`Error adding favorite for user ${req.user.id}:`, error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const { adId } = req.params;
    const userId = req.user.id;

    const removed = await favoriteModel.removeFavorite(userId, adId);

    if (removed) {
      logger.info(`User ${userId} removed ad ${adId} from favorites`);
      res.status(200).json({ message: "Anúncio removido dos favoritos" });
    } else {
      logger.warn(
        `User ${userId} tried to remove ad ${adId} from favorites, but it does not exist`
      );
      res.status(404).json({ error: "Favorito não encontrado" });
    }
  } catch (error) {
    logger.error(`Error removing favorite for user ${req.user.id}:`, error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

exports.getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await favoriteModel.getUserFavorites(userId);
    res.json(favorites);
  } catch (error) {
    logger.error(`Error fetching favorites for user ${req.user.id}:`, error);
    console.error("Error in getUserFavorites:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

exports.checkFavorite = async (req, res) => {
  try {
    const { adId } = req.params;
    const userId = req.user.id;

    const isFavorite = await favoriteModel.isFavorite(userId, adId);
    res.json({ isFavorite });
  } catch (error) {
    logger.error(`Error checking favorite for user ${req.user.id}:`, error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

exports.getFavoriteIds = async (req, res) => {
  try {
    const userId = req.user.id;
    const favoriteIds = await favoriteModel.getFavoriteIds(userId);
    res.json(favoriteIds);
  } catch (error) {
    logger.error(`Error fetching favorite IDs for user ${req.user.id}:`, error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};
