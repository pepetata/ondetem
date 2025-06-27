const { safePool } = require("../utils/sqlSecurity");

exports.addFavorite = async (userId, adId) => {
  try {
    const result = await safePool.safeQuery(
      `INSERT INTO favorites (user_id, ad_id) VALUES ($1, $2) 
       ON CONFLICT (user_id, ad_id) DO NOTHING 
       RETURNING id`,
      [userId, adId],
      "add_favorite"
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error adding favorite:", error);
    throw error;
  }
};

exports.removeFavorite = async (userId, adId) => {
  try {
    const result = await safePool.safeQuery(
      `DELETE FROM favorites WHERE user_id = $1 AND ad_id = $2`,
      [userId, adId],
      "remove_favorite"
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error("Error removing favorite:", error);
    throw error;
  }
};

exports.getUserFavorites = async (userId) => {
  try {
    const result = await safePool.safeQuery(
      `SELECT 
        ads.*,
        f.created_at as favorited_at
       FROM favorites f
       JOIN ads ON f.ad_id = ads.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId],
      "get_user_favorites"
    );

    const favorites = result.rows;

    // Get images for each favorite ad
    for (const favorite of favorites) {
      const imagesResult = await safePool.safeQuery(
        `SELECT filename FROM ad_images WHERE ad_id = $1`,
        [favorite.id],
        "get_favorite_ad_images"
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
    const result = await safePool.safeQuery(
      `SELECT 1 FROM favorites WHERE user_id = $1 AND ad_id = $2`,
      [userId, adId],
      "check_is_favorite"
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking if favorite:", error);
    throw error;
  }
};

exports.getFavoriteIds = async (userId) => {
  try {
    const result = await safePool.safeQuery(
      `SELECT ad_id FROM favorites WHERE user_id = $1`,
      [userId],
      "get_favorite_ids"
    );
    return result.rows.map((row) => row.ad_id);
  } catch (error) {
    console.error("Error getting favorite IDs:", error);
    throw error;
  }
};
