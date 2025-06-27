const bcrypt = require("bcrypt");
const logger = require("../utils/logger");
const userModel = require("../models/userModel");
const { buildJoiSchema } = require("./buildJoiSchema");
const { userFormFields } = require("../formfields/userFieldsValidation");
const { isValidUUID, isValidEmail } = require("../utils/validation");
const { XSSProtection } = require("../utils/xssProtection");
const e = require("express");
const { token } = require("morgan");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    logger.info(`Fetched ${users.length} users`);
    res.status(200).json(users);
  } catch (err) {
    logger.error(`Error fetching users: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate UUID format
    if (!isValidUUID(userId)) {
      logger.warn(`Invalid user ID format: ${userId}`);
      return res.status(404).json({
        error: "User not found",
        message:
          "O usuário solicitado não foi encontrado. Verifique se o link está correto.",
      });
    }

    const user = await userModel.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "O usuário solicitado não foi encontrado.",
      });
    }

    logger.info(`Fetched user: ${user.email}`);
    res.status(200).json(user);
  } catch (err) {
    console.log(`Error fetching user: ${err}`);
    logger.error(`Error fetching user: ${err.message}`);
    res.status(500).json({
      error: "Failed to fetch user",
      message: "Erro interno do servidor. Tente novamente mais tarde.",
    });
  }
};

exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    // Validate email format
    if (!isValidEmail(email)) {
      logger.warn(`Invalid email format: ${email}`);
      return res.status(404).json({
        error: "User not found",
        message:
          "O usuário solicitado não foi encontrado. Verifique se o email está correto.",
      });
    }

    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "O usuário solicitado não foi encontrado.",
      });
    }
    logger.info(`Fetched user by email: ${email}`);
    res.status(200).json(user);
  } catch (err) {
    logger.error(`Error fetching user by email: ${err.message}`);
    res.status(500).json({
      error: "Failed to fetch user by email",
      message: "Erro interno do servidor. Tente novamente mais tarde.",
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming userId is set in the request by authentication middleware
    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    logger.info(`Fetched current user: ${user.email}`);
    res.status(200).json(user);
  } catch (err) {
    logger.error(`Error fetching current user: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch current user" });
  }
};

exports.createUser = async (req, res) => {
  if (!req.body) {
    logger.error("No body received in request");
    return res.status(400).json({ error: "No data received" });
  }

  // Sanitize input before validation
  const sanitizedBody = {
    fullName: XSSProtection.sanitizeUserInput(req.body.fullName, {
      maxLength: 100,
      allowHTML: false,
    }),
    nickname: XSSProtection.sanitizeUserInput(req.body.nickname, {
      maxLength: 50,
      allowHTML: false,
    }),
    email: XSSProtection.sanitizeUserInput(req.body.email, {
      maxLength: 100,
      allowHTML: false,
    }),
    password: req.body.password, // Don't sanitize password, just validate length
  };

  const userSchema = buildJoiSchema(userFormFields);
  const { error } = userSchema.validate(sanitizedBody);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const { fullName, nickname, email, password } = sanitizedBody;
    const photoPath = req.file ? req.file.path : null;

    // Additional email validation
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Formato de email inválido" });
    }

    // Check if user already exists
    const existingUser = await userModel.findUserByEmail(email.toLowerCase());
    if (existingUser) {
      logger.warn(`Attempt to register existing email: ${email}`);
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }

    let passwordHash;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const userId = await userModel.createUser({
      fullName,
      nickname,
      email: email.toLowerCase(),
      passwordHash,
      photoPath,
    });

    logger.info(`User created: ${email}`);
    res.status(201).json({ userId });
  } catch (err) {
    logger.error(`Error creating user: ${err.message}`);
    res.status(500).json({ error: `Erro ao criar usuário: ${err.message}` });
  }
};

exports.updateUser = async (req, res) => {
  // pw can be empty if updating other fields
  // Clone userFormFields and set password.required = false
  console.log(`updateUser`);
  const token = req.token;
  if (!token) {
    logger.warn("Unauthorized access attempt to update user");
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!req.params.id) {
    logger.warn("User ID not provided for update");
    return res.status(400).json({ error: "User ID is required" });
  }
  const updateFields = {};
  for (const key in userFormFields) {
    updateFields[key] = { ...userFormFields[key], required: false };
  }
  updateFields.password = { ...userFormFields.password, required: false };
  const updateSchema = buildJoiSchema(updateFields);

  const { error } = updateSchema.validate(req.body);
  if (error) {
    logger.warn(`Validation error on user update: ${error.details[0].message}`);
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const userId = req.params.id;
    const { fullName, nickname, email, password } = req.body;
    const photoPath = req.file ? req.file.path : null;

    // Optionally: check if email is being changed to an existing one

    let passwordHash;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    await userModel.updateUser({
      userId,
      fullName,
      nickname,
      email,
      passwordHash,
      photoPath,
    });

    // Fetch the updated user
    const updatedUser = await userModel.getUserById(userId);
    if (!updatedUser) {
      logger.warn(`User not found for update: ${userId}`);
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`User updated:`, updatedUser);
    logger.info(`User updated: ${email}`);
    res.status(200).json(updatedUser);
  } catch (err) {
    console.log(`Error updating user:`, err);
    logger.error(`Error updating user: ${err.message}`);
    res
      .status(500)
      .json({ error: `Erro ao atualizar usuário: ${err.message}` });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      logger.warn("User ID not provided for deletion");
      return res.status(400).json({ error: "User ID is required" });
    }
    const token = req.token;
    if (!token) {
      logger.warn("Unauthorized access attempt to delete user");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const deleted = await userModel.deleteUser(userId);
    if (!deleted) {
      logger.warn(`User not found for deletion: ${userId}`);
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    logger.error(`Error deleting user: ${err.message}`);
    res.status(500).json({ error: "Failed to delete user" });
  }
};
