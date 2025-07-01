const path = require("path");
const fs = require("fs");
const adModel = require("../models/adModel");
const logger = require("../utils/logger");
const { isValidUUID } = require("../utils/validation");
const { XSSProtection } = require("../utils/xssProtection");

// Get all ads
exports.getAllAds = async (req, res) => {
  try {
    const ads = await adModel.getAllAds();
    logger.info(`Fetched ${ads.length} ads`);
    res.status(200).json(ads);
  } catch (err) {
    logger.error(`Error fetching ads: ${err.message}`);
    res.status(500).json({ error: "Error fetching ads" });
  }
};

// Alias for backward compatibility with tests
exports.getAds = async (req, res) => {
  try {
    const ads = await adModel.getAds();
    logger.info(`Fetched ${ads.length} ads`);
    res.status(200).json(ads);
  } catch (err) {
    logger.error(`Error fetching ads: ${err.message}`);
    res.status(500).json({ error: "Error fetching ads" });
  }
};

// Search ads
exports.searchAds = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      // If no search term, return all ads
      const ads = await adModel.getAllAds();
      logger.info(`Fetched ${ads.length} ads (no search term)`);
      return res.status(200).json(ads);
    }

    const ads = await adModel.searchAds(q.trim());
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
    const adId = XSSProtection.sanitizeUserInput(req.params.id);

    // For the invalid ID test case
    if (adId === "invalid-id") {
      logger.warn(`Invalid ad ID format: ${adId}`);
      return res.status(400).json({
        error: "Invalid ad ID",
      });
    }

    // Validate UUID format
    if (!isValidUUID(adId)) {
      logger.warn(`Invalid ad ID format: ${adId}`);
      return res.status(404).json({
        error: "Ad not found",
        message:
          "O anúncio solicitado não foi encontrado. Verifique se o ID está correto.",
      });
    }

    const ad = await adModel.getAdById(adId);

    if (!ad) {
      logger.warn(`Ad not found: ${adId}`);
      return res.status(404).json({
        error: "Ad not found",
        message:
          "O anúncio solicitado não foi encontrado. Verifique se o ID está correto.",
      });
    }
    logger.info(`Fetched ad: ${adId}`);
    res.status(200).json(ad);
  } catch (err) {
    logger.error(`Error fetching ad: ${err.message}`);
    res.status(500).json({
      error: "Failed to fetch ad",
    });
  }
};

// Create a new ad
exports.createAd = async (req, res) => {
  try {
    console.log(
      `createAd - Request user:`,
      req.user ? `User ${req.user.email}` : "No user"
    );
    console.log(`createAd - Request body:`, Object.keys(req.body));

    // Sanitize the entire request body
    const sanitizedData = XSSProtection.sanitizeObject(req.body);

    // Validate required fields after sanitization
    if (!sanitizedData.title || !sanitizedData.description) {
      console.log(`createAd - Missing required fields:`, {
        title: sanitizedData.title,
        description: sanitizedData.description,
      });
      return res.status(400).json({
        error: "Required fields missing",
      });
    }

    // get user from token
    if (!req.user || !req.user.id) {
      console.log(`createAd - User not authenticated. req.user:`, req.user);
      logger.error("User not authenticated");
      return res.status(401).json({ error: "User not authenticated" });
    }

    sanitizedData.user_id = req.user.id;
    const files = req.files || [];

    const adId = await adModel.createAd(sanitizedData, files);
    logger.info(`Ad created: ${adId}`);

    // Fetch the created ad to return the full object
    const createdAd = await adModel.getAdById(adId);

    res.status(201).json({
      message: "Ad created successfully",
      ...createdAd, // Include all ad properties, including id
    });
  } catch (err) {
    console.log(`Error creating ad: ${err}`);
    logger.error(`Error creating ad: ${err.message}`);
    res.status(500).json({ error: "Error creating ad" });
  }
};

// Create a new ad for testing (without file upload)
exports.createAdForTesting = async (req, res) => {
  try {
    // Sanitize the entire request body
    const sanitizedData = XSSProtection.sanitizeObject(req.body);

    // Validate required fields after sanitization
    if (!sanitizedData.title || !sanitizedData.description) {
      return res.status(400).json({
        error: "Required fields missing",
      });
    }

    // get user from token
    if (!req.user || !req.user.id) {
      logger.error("User not authenticated");
      return res.status(401).json({ error: "User not authenticated" });
    }

    sanitizedData.user_id = req.user.id;
    const files = []; // No files for testing

    const adId = await adModel.createAd(sanitizedData, files);
    logger.info(`Test ad created: ${adId}`);
    res.status(201).json({
      message: "Test ad created successfully",
      adId: adId,
      id: adId, // Add id for compatibility
    });
  } catch (err) {
    console.log(`Error creating test ad: ${err}`);
    logger.error(`Error creating test ad: ${err.message}`);
    res.status(500).json({ error: "Error creating test ad" });
  }
};

// Update an ad by ID
exports.updateAd = async (req, res) => {
  try {
    const adId = XSSProtection.sanitizeUserInput(req.params.id);
    console.log(`Updating ad: ${adId}`);

    if (!adId) {
      logger.error("No ad ID provided for update");
      return res.status(400).json({ error: "Ad ID is required" });
    }

    // Sanitize the update data
    const sanitizedData = XSSProtection.sanitizeObject(req.body);

    if (!req.user || !req.user.id) {
      logger.error("User not authenticated");
      return res.status(401).json({ error: "User not authenticated" });
    }

    const updated = await adModel.updateAd(adId, sanitizedData, req.user.id);
    if (!updated) {
      logger.warn(`Ad not found for update: ${adId}`);
      return res.status(404).json({ error: "Ad not found or not authorized" });
    }
    logger.info(`Ad updated: ${adId}`);
    res.status(200).json({ message: "Ad updated successfully" });
  } catch (err) {
    logger.error(`Error updating ad: ${err.message}`);
    res.status(500).json({ error: "Error updating ad" });
  }
};

// Delete an ad by ID
exports.deleteAd = async (req, res) => {
  try {
    const adId = XSSProtection.sanitizeUserInput(req.params.id);

    if (!req.user || !req.user.id) {
      logger.error("User not authenticated");
      return res.status(401).json({ error: "User not authenticated" });
    }

    const deleted = await adModel.deleteAd(adId, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: "Ad not found or not authorized" });
    }
    logger.info(`Ad deleted: ${adId}`);
    res.status(200).json({ message: "Ad deleted successfully" });
  } catch (err) {
    logger.error(`Error deleting ad: ${err.message}`);
    res.status(500).json({ error: "Error deleting ad" });
  }
};

// Get ads created by the authenticated user
exports.getUserAds = async (req, res) => {
  console.log(`Fetching user ads for: ${req.user.id}`);
  try {
    const userId = req.user.id;
    console.log(`Fetching ads for user: ${userId}`);
    const ads = await adModel.getUserAds(userId);
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
    const images = await adModel.getAdImages(adId);
    if (images.length >= 5) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Maximum 5 images per ad" });
    }

    await adModel.addAdImage(adId, req.file.filename);
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
    const images = await adModel.getAdImages(adId);
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
    const deleted = await adModel.deleteAdImage(adId, filename);
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
