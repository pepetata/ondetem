const express = require("express");
const multer = require("multer");
const usersController = require("../controllers/usersController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("photo"), usersController.registerUser);

module.exports = router;
