const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.addFavorite = async (userId, adId) => {
  try {
    const result = await pool.query(
      `INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2) 
       ON CONFLICT (user_id, ad_id) DO NOTHING 
       RETURNING id`,
      [userId, adId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error adding favorite:", error);
    throw error;
  }
};

exports.removeFavorite = async (userId, adId) => {
  try {
    const result = await pool.query(
      `DELETE FROM favorites WHERE user_id = $1 AND ad_id = $2`,
      [userId, adId]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error("Error removing favorite:", error);
    throw error;
  }
};

exports.getUserFavorites = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT 
        ads.*,
        f.created_at as favorited_at
       FROM favorites f
       JOIN ads ON f.ad_id = ads.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    const favorites = result.rows;

    // Get images for each favorite ad
    for (const favorite of favorites) {
      const imagesResult = await pool.query(
        `SELECT filename FROM ad_images WHERE ad_id = $1`,
        [favorite.id]
      );
      favorite.images = imagesResult.rows.map((row) => row.filename);
    }

    return favorites;
  } catch (error) {
    console.error("Error getting user favorites:", error);
    throw error;
  }
};

exports.isFavorite = async (userId, adId) => {
  try {
    const result = await pool.query(
      `SELECT 1 FROM favorites WHERE user_id = $1 AND ad_id = $2`,
      [userId, adId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking if favorite:", error);
    throw error;
  }
};

exports.getFavoriteIds = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT ad_id FROM favorites WHERE user_id = $1`,
      [userId]
    );
    return result.rows.map((row) => row.ad_id);
  } catch (error) {
    console.error("Error getting favorite IDs:", error);
    throw error;
  }
};
