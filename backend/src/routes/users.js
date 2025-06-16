const express = require("express");
const multer = require("multer");
const usersController = require("../controllers/usersController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/", usersController.getAllUsers);
router.post("/", upload.single("photo"), usersController.createUser);
router.put("/:id", upload.single("photo"), usersController.updateUser);

module.exports = router;
