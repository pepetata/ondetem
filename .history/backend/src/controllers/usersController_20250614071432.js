const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");

exports.registerUser = async (req, res) => {
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
