const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

class Comment {
  constructor(ad_id, user_id, content, id = null) {
    this.id = id || uuidv4();
    this.ad_id = ad_id;
    this.user_id = user_id;
    this.content = content;
  }

  // Create a new comment
  async save() {
    try {
      const query = `
        INSERT INTO comments (id, ad_id, user_id, content, created_at, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const result = await pool.query(query, [
        this.id,
        this.ad_id,
        this.user_id,
        this.content,
      ]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating comment: ${error.message}`);
    }
  }

  // Get all comments for a specific ad
  static async getByAdId(ad_id) {
    try {
      const query = `
        SELECT 
          c.*,
          u.full_name,
          u.nickname,
          u.email
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.ad_id = $1
        ORDER BY c.created_at DESC
      `;

      const result = await pool.query(query, [ad_id]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching comments: ${error.message}`);
    }
  }

  // Get a specific comment by ID
  static async getById(id) {
    try {
      const query = `
        SELECT 
          c.*,
          u.full_name,
          u.nickname,
          u.email
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = $1
      `;

      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching comment: ${error.message}`);
    }
  }

  // Update a comment
  static async update(id, content) {
    try {
      const query = `
        UPDATE comments 
        SET content = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [content, id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating comment: ${error.message}`);
    }
  }

  // Delete a comment
  static async delete(id) {
    try {
      const query = "DELETE FROM comments WHERE id = $1 RETURNING *";
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error deleting comment: ${error.message}`);
    }
  }

  // Get comments count for an ad
  static async getCountByAdId(ad_id) {
    try {
      const query = "SELECT COUNT(*) as count FROM comments WHERE ad_id = $1";
      const result = await pool.query(query, [ad_id]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Error counting comments: ${error.message}`);
    }
  }

  // Get all comments by a user
  static async getByUserId(user_id) {
    try {
      const query = `
        SELECT 
          c.*,
          a.title as ad_title
        FROM comments c
        JOIN ads a ON c.ad_id = a.id
        WHERE c.user_id = $1
        ORDER BY c.created_at DESC
      `;

      const result = await pool.query(query, [user_id]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching user comments: ${error.message}`);
    }
  }
}

module.exports = Comment;
