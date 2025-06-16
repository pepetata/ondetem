const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const logger = require("../utils/logger");

exports.createUser = async (req, res) => {
  try {
    const { fullName, nickname, email, password } = req.body;
    const photoPath = req.file ? req.file.path : null;
    const passwordHash = await bcrypt.hash(password, 10);

    const userId = await userModel.createUser({
      fullName,
      nickname,
      email,
      passwordHash,
      photoPath,
    });

    res.status(201).json({ userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await userModel.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};
