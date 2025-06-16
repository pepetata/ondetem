const express = require("express");
const multer = require("multer");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
if (!pool) {
  console.error("Database connection pool not initialized");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable not set");
  process.exit(1);
}
// if (!process.env.JWT_SECRET) {
//   console.error("JWT_SECRET environment variable not set");
//   process.exit(1);
// }
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const { fullName, nickname, email, password } = req.body;
    const photoPath = req.file ? req.file.path : null;
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (full_name, nickname, email, password_hash, photo_path)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [fullName, nickname, email, passwordHash, photoPath]
    );

    res.status(201).json({ userId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

module.exports = router;
