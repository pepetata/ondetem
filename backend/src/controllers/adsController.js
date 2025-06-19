const adsModel = require("../models/adModel");
const logger = require("../utils/logger");

// Get all ads
exports.getAllAds = async (req, res) => {
  try {
    const ads = await adsModel.getAllAds();
    logger.info(`Fetched ${ads.length} ads`);
    res.status(200).json(ads);
  } catch (err) {
    logger.error(`Error fetching ads: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch ads" });
  }
};

// Get ad by ID
exports.getAdById = async (req, res) => {
  try {
    const adId = req.params.id;
    const ad = await adsModel.getAdById(adId);
    if (!ad) {
      logger.warn(`Ad not found: ${adId}`);
      return res.status(404).json({ error: "Ad not found" });
    }
    logger.info(`Fetched ad: ${adId}`);
    res.status(200).json(ad);
  } catch (err) {
    logger.error(`Error fetching ad: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch ad" });
  }
};

// Create a new ad
exports.createAd = async (req, res) => {
  try {
    const adData = req.body;
    const adId = await adsModel.createAd(adData);
    logger.info(`Ad created: ${adId}`);
    res.status(201).json({ adId });
  } catch (err) {
    logger.error(`Error creating ad: ${err.message}`);
    res.status(500).json({ error: "Failed to create ad" });
  }
};

// Update an ad by ID
exports.updateAd = async (req, res) => {
  try {
    const adId = req.params.id;
    const adData = req.body;
    const updated = await adsModel.updateAd(adId, adData);
    if (!updated) {
      logger.warn(`Ad not found for update: ${adId}`);
      return res.status(404).json({ error: "Ad not found" });
    }
    logger.info(`Ad updated: ${adId}`);
    res.status(200).json({ message: "Ad updated" });
  } catch (err) {
    logger.error(`Error updating ad: ${err.message}`);
    res.status(500).json({ error: "Failed to update ad" });
  }
};

// Delete an ad by ID
exports.deleteAd = async (req, res) => {
  try {
    const adId = req.params.id;
    const deleted = await adsModel.deleteAd(adId);
    if (!deleted) {
      return res.status(404).json({ error: "Ad not found" });
    }
    logger.info(`Ad deleted: ${adId}`);
    res.status(200).json({ message: "Ad deleted" });
  } catch (err) {
    logger.error(`Error deleting ad: ${err.message}`);
    res.status(500).json({ error: "Failed to delete ad" });
  }
};
