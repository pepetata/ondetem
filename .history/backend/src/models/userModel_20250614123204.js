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

exports.getAllUsers = async () => {
  const result = await pool.query(
    `SELECT id, full_name, nickname, email, photo_path FROM users`
  );
  return result.rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    nickname: row.nickname,
    email: row.email,
    photoPath: row.photo_path,
  }));
};

exports.getUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, full_name, nickname, email, photo_path FROM users WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    fullName: row.full_name,
    nickname: row.nickname,
    email: row.email,
    photoPath: row.photo_path,
  };
};

exports.findUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
};
