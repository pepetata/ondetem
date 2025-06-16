const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

exports.getUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
};

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

exports.updateUser = async ({
  userId,
  fullName,
  nickname,
  email,
  passwordHash,
  photoPath,
}) => {
  // Build dynamic query based on which fields are present
  const fields = [];
  const values = [];
  let idx = 1;

  if (fullName) {
    fields.push(`full_name = $${idx++}`);
    values.push(fullName);
  }
  if (nickname) {
    fields.push(`nickname = $${idx++}`);
    values.push(nickname);
  }
  if (email) {
    fields.push(`email = $${idx++}`);
    values.push(email);
  }
  if (passwordHash) {
    fields.push(`password_hash = $${idx++}`);
    values.push(passwordHash);
  }
  if (photoPath) {
    fields.push(`photo_path = $${idx++}`);
    values.push(photoPath);
  }
  values.push(userId);

  const setClause = fields.join(", ");
  await pool.query(`UPDATE users SET ${setClause} WHERE id = $${idx}`, values);
};
