const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const logger = require("../utils/logger");
const { XSSProtection } = require("../utils/xssProtection");
const { isValidEmail } = require("../utils/validation");

exports.login = async (req, res) => {
  try {
    console.log(`authController login attempt`, req.body);
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // Sanitize input
    const sanitizedEmail = XSSProtection.sanitizeUserInput(email, {
      maxLength: 100,
      allowHTML: false,
    });

    const user = await userModel.findUserByEmail(sanitizedEmail);
    if (!user) {
      logger.warn(`Login failed for email: ${sanitizedEmail}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(
      password,
      user.password || user.password_hash
    );
    if (!valid) {
      logger.warn(`Invalid password for email: ${sanitizedEmail}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Map DB fields to frontend fields
    // Remove sensitive fields
    const userSafe = {
      id: user.id,
      fullName: user.fullName || user.full_name,
      nickname: user.nickname,
      email: user.email,
      photoPath: user.photoPath || user.photo_path,
    };

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "24h" }
    );

    // Log successful login
    logger.info(`User ${user.email} logged in successfully`);
    res.json({
      message: "Login successful",
      token,
      user: userSafe,
    });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("token");
    req.session?.destroy?.();
    res.json({ message: "Logout successful" });
  } catch (err) {
    logger.error(`Logout error: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "24h" }
    );

    res.json({ message: "Token refreshed successfully", token });
  } catch (err) {
    logger.error(`Token refresh error: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ valid: false, error: "Invalid token" });
    }

    res.json({ valid: true, user: req.user });
  } catch (err) {
    logger.error(`Token verification error: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};
