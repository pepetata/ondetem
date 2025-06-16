const express = require("express");
const multer = require("multer");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

const app = express();
const pool = new Pool({
  connectionString: "postgres://user:password@localhost:5432/yourdb",
});

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

app.use(express.json());

// User registration route
app.post("/api/users", upload.single("photo"), async (req, res) => {
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

app.listen(3001, () => console.log("Backend running on http://localhost:3001"));
