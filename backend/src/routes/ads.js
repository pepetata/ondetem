const express = require("express");
const adsController = require("../controllers/adsController");
const middleware = require("../utils/middleware");

const router = express.Router();

// Public: Get all ads and get ad by ID
router.get("/", adsController.getAllAds);
router.get("/:id", adsController.getAdById);

router.post("/", adsController.createAd);

router.put("/:id", middleware.tokenExtractor, adsController.updateAd);

router.delete("/:id", middleware.tokenExtractor, adsController.deleteAd);

module.exports = router;
