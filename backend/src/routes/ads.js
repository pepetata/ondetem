const express = require("express");
const adsController = require("../controllers/adsController");
const middleware = require("../utils/middleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const router = express.Router();

// Public: Get all ads and get ad by ID
router.get("/", adsController.getAllAds);
router.get(
  "/my",
  middleware.tokenExtractor,
  middleware.userExtractor,
  adsController.getUserAds
);
router.get("/:id", adsController.getAdById);

router.post(
  "/",
  upload.single("photo"),
  middleware.tokenExtractor,
  middleware.userExtractor,
  adsController.createAd
);

router.put(
  "/:id",
  upload.single("photo"),
  middleware.tokenExtractor,
  middleware.userExtractor,
  adsController.updateAd
);

router.delete(
  "/:id",
  middleware.tokenExtractor,
  middleware.userExtractor,
  adsController.deleteAd
);

module.exports = router;
