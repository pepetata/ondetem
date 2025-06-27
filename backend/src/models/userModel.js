const { safePool } = require("../utils/sqlSecurity");

exports.getAllUsers = async () => {
  const result = await safePool.safeQuery(
    `SELECT id, full_name, nickname, email, photo_path FROM users`,
    [],
    "get_all_users"
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
  const result = await safePool.safeQuery(
    `SELECT id, full_name, nickname, email, photo_path FROM users WHERE id = $1`,
    [id],
    "get_user_by_id"
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
  const result = await safePool.safeQuery(
    "SELECT * FROM users WHERE email = $1",
    [email],
    "get_user_by_email"
  );
  return result.rows[0];
};

exports.createUser = async ({
  fullName,
  nickname,
  email,
  passwordHash,
  photoPath,
}) => {
  const result = await safePool.safeQuery(
    `INSERT INTO users (full_name, nickname, email, password_hash, photo_path)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [fullName, nickname, email, passwordHash, photoPath],
    "create_user"
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

  if (fields.length === 0) {
    logger.warn("No fields to update");
    throw new Error("No fields to update");
  }

  const setClause = fields.join(", ");
  console.log(
    `Updating user ==> UPDATE users SET ${setClause} WHERE id = ${userId}`
  );
  await safePool.safeQuery(
    `UPDATE users SET ${setClause} WHERE id = $${idx}`,
    values,
    "update_user"
  );
};

exports.findUserByEmail = async (email) => {
  const result = await safePool.safeQuery(
    "SELECT * FROM users WHERE email = $1",
    [email],
    "find_user_by_email"
  );
  return result.rows[0];
};

exports.deleteUser = async (id) => {
  const result = await safePool.safeQuery(
    "DELETE FROM users WHERE id = $1 RETURNING id",
    [id],
    "delete_user"
  );
  return result.rowCount > 0;
};
