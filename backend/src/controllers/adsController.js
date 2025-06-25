const path = require("path");
const fs = require("fs");
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

// Search ads
exports.searchAds = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      // If no search term, return all ads
      const ads = await adsModel.getAllAds();
      logger.info(`Fetched ${ads.length} ads (no search term)`);
      return res.status(200).json(ads);
    }

    const ads = await adsModel.searchAds(q.trim());
    logger.info(`Searched for "${q}" and found ${ads.length} ads`);
    res.status(200).json(ads);
  } catch (err) {
    logger.error(`Error searching ads: ${err.message}`);
    res.status(500).json({ error: "Failed to search ads" });
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
    const adData = Object.assign({}, req.body);
    // console.log(`Creating ad with data:`, adData);
    // console.log(`User from token:`, req.user);
    // get user from token
    if (!req.user || !req.user.id) {
      logger.error("User not authenticated");
      return res.status(401).json({ error: "User not authenticated" });
    }

    adData.user_id = req.user.id;
    adData.radius = +adData.radius || 0;
    adData.created_at = new Date();
    // Convert empty strings to null for date fields
    if (adData.startdate === "") adData.startdate = null;
    if (adData.finishdate === "") adData.finishdate = null;
    // console.log(`Creating ad with data:`, adData);

    adData.id = await adsModel.createAd(adData);
    // console.log(`Created ad with data:`, adData);
    logger.info(`Ad created: ${adData.id}`);
    res.status(201).json(adData);
  } catch (err) {
    console.log(`Error creating ad: ${err}`);
    logger.error(`Error creating ad: ${err.message}`);
    res.status(500).json({ error: "Failed to create ad" });
  }
};

// Update an ad by ID
exports.updateAd = async (req, res) => {
  try {
    const adId = req.params.id;
    console.log(`Updating ad: ${adId}`);
    if (!adId) {
      logger.error("No ad ID provided for update");
      return res.status(400).json({ error: "Ad ID is required" });
    }
    const adData = req.body;
    adData.user_id = req.user.id;
    adData.radius = +adData.radius || 0;
    adData.created_at = new Date();
    // Convert empty strings to null for date fields
    if (adData.startdate === "") adData.startdate = null;
    if (adData.finishdate === "") adData.finishdate = null;
    // console.log(`Updating ad with data:`, adData);

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

    // 1. Get all image filenames for this ad
    const images = await adsModel.getAdImages(adId);

    // 2. Delete each file from disk
    const adImagesDir = path.join(__dirname, "../../uploads/ad_images");
    images.forEach((filename) => {
      const safeFilename = path.basename(filename);
      const filePath = path.join(adImagesDir, safeFilename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted image file: ${filePath}`);
      } else {
        logger.warn(`Image file not found: ${filePath}`);
      }
    });

    // 3. Delete the ad (DB will cascade to ad_images)
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

// Get ads created by the authenticated user
exports.getUserAds = async (req, res) => {
  console.log(`Fetching user ads for: ${req.user.id}`);
  try {
    const userId = req.user.id;
    console.log(`Fetching ads for user: ${userId}`);
    const ads = await adsModel.getUserAds(userId);
    logger.info(`Fetched ${ads.length} ads for user: ${userId}`);
    res.status(200).json(ads);
  } catch (err) {
    logger.error(`Error fetching user ads: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch user ads" });
  }
};

// Upload image
exports.uploadImage = async (req, res) => {
  try {
    const adId = req.params.id;
    console.log("uploadImage req.file:", req.file); // <--- Add this
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Limit to 5 images per ad
    const images = await adsModel.getAdImages(adId);
    if (images.length >= 5) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Maximum 5 images per ad" });
    }

    await adsModel.addAdImage(adId, req.file.filename);
    res.status(201).json({ filename: req.file.filename });
  } catch (err) {
    console.error("uploadImage error:", err);
    res.status(500).json({ error: "Failed to upload image" });
  }
};

// Get ad images
exports.getImages = async (req, res) => {
  try {
    const adId = req.params.id;
    const images = await adsModel.getAdImages(adId);
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch images" });
  }
};

// Delete image
exports.deleteImage = async (req, res) => {
  try {
    const adId = req.params.id;
    const filename = req.params.filename;
    const deleted = await adsModel.deleteAdImage(adId, filename);
    if (deleted) {
      // Remove file from disk
      const safeFilename = path.basename(filename);
      const filePath = path.join(
        __dirname,
        "../../uploads/ad_images",
        safeFilename
      );
      console.log("Trying to delete file:", filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("File deleted:", filePath);
      } else {
        console.log("File not found:", filePath);
      }
      res.json({ message: "Image deleted" });
    } else {
      res.status(404).json({ error: "Image not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to delete image" });
  }
};
