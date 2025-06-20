const express = require("express");
const usersController = require("../controllers/usersController");
const middleware = require("../utils/middleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.get("/", usersController.getAllUsers);
router.get("/:id", usersController.getUserById);
router.get("/email/:email", usersController.getUserByEmail);
router.get(
  "/me",
  middleware.tokenExtractor,
  middleware.userExtractor,
  usersController.getCurrentUser
);

// Use multer for multipart/form-data
router.post("/", upload.single("photo"), usersController.createUser);

router.put(
  "/:id",
  middleware.tokenExtractor,
  middleware.userExtractor,
  upload.single("photo"),
  usersController.updateUser
);

router.delete(
  "/:id",
  middleware.tokenExtractor,
  middleware.userExtractor,
  usersController.deleteUser
);

module.exports = router;
