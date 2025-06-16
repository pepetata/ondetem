const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.createUser = async ({
  fullName,
  nickname,
  email,
  passwordHash,
  photoPath,
}) => {
  const result = await pool.query(
    `INSERT INTO users (full_name, nickname, email, password_hash, photo_path)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [fullName, nickname, email, passwordHash, photoPath]
  );
  return result.rows[0].id;
};
