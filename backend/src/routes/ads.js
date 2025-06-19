const express = require("express");
const adsController = require("../controllers/adsController");

const router = express.Router();

// Gets
router.get("/", adsController.getAllAds);
router.get("/:id", adsController.getAdById);
// Creates a new ad
router.post("/", adsController.createAd);

// Updates an ad by ID
router.put("/:id", adsController.updateAd);

// Deletes an ad by ID
router.delete("/:id", adsController.deleteAd);

module.exports = router;
