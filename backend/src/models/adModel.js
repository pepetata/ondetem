const { safePool } = require("../utils/sqlSecurity");

exports.getAllAds = async (offset = 0, limit = 50) => {
  const result = await safePool.safeQuery(
    `SELECT * FROM ads ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
    "get_all_ads"
  );
  const ads = result.rows;

  // Get images for each ad
  for (const ad of ads) {
    const imagesResult = await safePool.safeQuery(
      `SELECT filename FROM ad_images WHERE ad_id = $1`,
      [ad.id],
      "get_ad_images"
    );
    ad.images = imagesResult.rows.map((row) => row.filename);
  }

  return ads;
};

exports.searchAds = async (searchTerm) => {
  const searchPattern = `%${searchTerm}%`;

  const result = await safePool.safeQuery(
    `SELECT * FROM ads 
     WHERE title ILIKE $1 
        OR description ILIKE $1 
        OR short ILIKE $1 
        OR city ILIKE $1
        OR state ILIKE $1
        OR address1 ILIKE $1
        OR tags ILIKE $1
     ORDER BY 
       CASE 
         WHEN title ILIKE $1 THEN 1
         WHEN short ILIKE $1 THEN 2
         WHEN description ILIKE $1 THEN 3
         ELSE 4
       END,
       created_at DESC`,
    [searchPattern],
    "search_ads"
  );

  const ads = result.rows;

  // Get images for each ad
  for (const ad of ads) {
    const imagesResult = await safePool.safeQuery(
      `SELECT filename FROM ad_images WHERE ad_id = $1`,
      [ad.id],
      "get_ad_images"
    );
    ad.images = imagesResult.rows.map((row) => row.filename);
  }

  return ads;
};

exports.getAdById = async (id) => {
  const result = await safePool.safeQuery(
    `SELECT * FROM ads WHERE id = $1`,
    [id],
    "get_ad_by_id"
  );
  const ad = result.rows[0] || null;

  if (ad) {
    // Get images for this ad
    const imagesResult = await safePool.safeQuery(
      `SELECT filename FROM ad_images WHERE ad_id = $1`,
      [ad.id],
      "get_ad_images"
    );
    ad.images = imagesResult.rows.map((row) => row.filename);
  }

  return ad;
};

exports.findAdById = async (id) => {
  const result = await safePool.safeQuery(
    `SELECT * FROM ads WHERE id = $1`,
    [id],
    "find_ad_by_id"
  );

  if (result.rows.length === 0) {
    return null;
  }

  const ad = result.rows[0];

  // Get images for the ad
  const imagesResult = await safePool.safeQuery(
    `SELECT filename FROM ad_images WHERE ad_id = $1`,
    [ad.id],
    "get_ad_images"
  );
  ad.images = imagesResult.rows.map((row) => row.filename);

  return ad;
};

exports.getUserAds = async (userId) => {
  const result = await safePool.safeQuery(
    `SELECT * FROM ads WHERE user_id = $1 ORDER BY title`,
    [userId],
    "get_user_ads"
  );
  return result.rows;
};

exports.getAdsByUserId = async (userId) => {
  const result = await safePool.safeQuery(
    `SELECT * FROM ads WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
    "get_ads_by_user"
  );

  const ads = result.rows;

  // Get images for each ad
  for (const ad of ads) {
    const imagesResult = await safePool.safeQuery(
      `SELECT filename FROM ad_images WHERE ad_id = $1`,
      [ad.id],
      "get_ad_images"
    );
    ad.images = imagesResult.rows.map((row) => row.filename);
  }

  return ads;
};

exports.getAdsByLocation = async (city, state) => {
  const result = await safePool.safeQuery(
    `SELECT * FROM ads WHERE city = $1 AND state = $2 ORDER BY created_at DESC`,
    [city, state],
    "get_ads_by_location"
  );

  const ads = result.rows;

  // Get images for each ad
  for (const ad of ads) {
    const imagesResult = await safePool.safeQuery(
      `SELECT filename FROM ad_images WHERE ad_id = $1`,
      [ad.id],
      "get_ad_images"
    );
    ad.images = imagesResult.rows.map((row) => row.filename);
  }

  return ads;
};

exports.createAd = async (adData) => {
  const {
    title,
    short,
    description,
    tags,
    zipcode,
    city,
    state,
    address1,
    streetnumber,
    address2,
    radius,
    phone1,
    phone2,
    whatsapp,
    email,
    website,
    startdate,
    finishdate,
    timetext,
    user_id,
  } = adData;

  // Handle integer fields - convert empty strings to null, and strings to integers
  const cleanStreetnumber =
    streetnumber === "" || streetnumber === undefined ? null : streetnumber;
  const cleanRadius =
    radius === "" || radius === undefined || radius === "0"
      ? null
      : parseInt(radius, 10);

  // Handle date fields - convert empty strings to null
  const cleanStartdate =
    startdate === "" || startdate === undefined ? null : startdate;
  const cleanFinishdate =
    finishdate === "" || finishdate === undefined ? null : finishdate;

  const result = await safePool.safeQuery(
    `INSERT INTO ads (
      title, short, description, tags, zipcode, city, state, address1, streetnumber, address2,
      radius, phone1, phone2, whatsapp, email, website, startdate, finishdate, timetext, user_id
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
    ) RETURNING id`,
    [
      title,
      short,
      description,
      tags,
      zipcode,
      city,
      state,
      address1,
      cleanStreetnumber,
      address2,
      cleanRadius,
      phone1,
      phone2,
      whatsapp,
      email,
      website,
      cleanStartdate,
      cleanFinishdate,
      timetext,
      user_id,
    ],
    "create_ad"
  );
  return result.rows[0].id;
};

exports.updateAd = async (id, adData) => {
  // Build dynamic query based on which fields are present
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(adData)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }
  if (fields.length === 0) return false;
  values.push(id);

  const setClause = fields.join(", ");
  console.log(`adModel = Updating ad: ${id}`, adData);
  const result = await safePool.safeQuery(
    `UPDATE ads SET ${setClause} WHERE id = $${idx}`,
    values,
    "update_ad"
  );
  return result.rowCount > 0;
};

exports.deleteAd = async (id) => {
  const result = await safePool.safeQuery(
    `DELETE FROM ads WHERE id = $1`,
    [id],
    "delete_ad"
  );
  return result.rowCount > 0;
};

exports.addAdImage = async (adId, filename) => {
  const result = await safePool.safeQuery(
    `INSERT INTO ad_images (ad_id, filename) VALUES ($1, $2) RETURNING id`,
    [adId, filename],
    "add_ad_image"
  );
  return result.rows[0].id;
};

exports.getAdImages = async (adId) => {
  const result = await safePool.safeQuery(
    `SELECT filename FROM ad_images WHERE ad_id = $1`,
    [adId],
    "get_ad_images"
  );
  return result.rows.map((row) => row.filename);
};

exports.deleteAdImage = async (adId, filename) => {
  const result = await safePool.safeQuery(
    `DELETE FROM ad_images WHERE ad_id = $1 AND filename = $2`,
    [adId, filename],
    "delete_ad_image"
  );
  return result.rowCount > 0;
};
