const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const logger = require("../utils/logger");

exports.login = async (req, res) => {
  console.log(`authController login attempt`, req.body);
  const { email, password } = req.body;
  const user = await userModel.getUserByEmail(email);
  if (!user) {
    logger.warn(`Login failed for email: ${email}`);
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    logger.warn(`Invalid password for email: ${email}`);
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  // Map DB fields to frontend fields
  // Remove sensitive fields
  const userSafe = {
    id: user.id,
    fullName: user.full_name,
    nickname: user.nickname,
    email: user.email,
    photoPath: user.photo_path,
  };

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Log successful login
  logger.info(`User ${user.email} logged in successfully`);
  res.json({
    token,
    user: userSafe,
  });
};

exports.logout = (req, res) => {
  req.session?.destroy?.();
  res.json({ message: "Logged out" });
};
