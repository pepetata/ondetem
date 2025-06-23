const express = require("express");
const fs = require("fs");
const multer = require("multer");
const adsController = require("../controllers/adsController");
const middleware = require("../utils/middleware");

///////////////////////////////////////////////////////////////////
// Ensure the directory exists
const uploadDir = "uploads/ad_images";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Use unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });
/////////////////////////////////////////////////////////////////////

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
  upload.single("image"),
  middleware.tokenExtractor,
  middleware.userExtractor,
  adsController.createAd
);

router.put(
  "/:id",
  upload.single("image"),
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

// Images
router.post(
  "/:id/images",
  upload.single("image"),
  middleware.tokenExtractor,
  middleware.userExtractor,
  adsController.uploadImage
);

router.get("/:id/images", adsController.getImages);

router.delete(
  "/:id/images/:filename",
  middleware.tokenExtractor,
  middleware.userExtractor,
  adsController.deleteImage
);

module.exports = router;
