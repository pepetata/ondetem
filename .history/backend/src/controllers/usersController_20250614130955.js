const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const logger = require("../utils/logger");

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
    const userId = parseInt(req.params.id, 10);
    const user = await userModel.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    logger.info(`Fetched user: ${user.email}`);
    res.status(200).json(user);
  } catch (err) {
    logger.error(`Error fetching user: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { fullName, nickname, email, password } = req.body;
    const photoPath = req.file ? req.file.path : null;

    // Check if user already exists
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      logger.warn(`Attempt to register existing email: ${email}`);
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userId = await userModel.createUser({
      fullName,
      nickname,
      email,
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
  try {
    const userId = parseInt(req.params.id, 10);
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

    logger.info(`User updated: ${email}`);
    res.status(200).json({ message: "Usuário atualizado com sucesso!" });
  } catch (err) {
    logger.error(`Error updating user: ${err.message}`);
    res
      .status(500)
      .json({ error: `Erro ao atualizar usuário: ${err.message}` });
  }
};
