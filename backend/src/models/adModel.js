const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.getAllAds = async () => {
  const result = await pool.query(`SELECT * FROM ads ORDER BY created_at DESC`);
  const ads = result.rows;

  // Get images for each ad
  for (const ad of ads) {
    const imagesResult = await pool.query(
      `SELECT filename FROM ad_images WHERE ad_id = $1`,
      [ad.id]
    );
    ad.images = imagesResult.rows.map((row) => row.filename);
  }

  return ads;
};

exports.getAdById = async (id) => {
  const result = await pool.query(`SELECT * FROM ads WHERE id = $1`, [id]);
  const ad = result.rows[0] || null;

  if (ad) {
    // Get images for this ad
    const imagesResult = await pool.query(
      `SELECT filename FROM ad_images WHERE ad_id = $1`,
      [ad.id]
    );
    ad.images = imagesResult.rows.map((row) => row.filename);
  }

  return ad;
};

exports.getUserAds = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM ads WHERE user_id = $1 ORDER BY title`,
    [userId]
  );
  return result.rows;
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

  const result = await pool.query(
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
    ]
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
  const result = await pool.query(
    `UPDATE ads SET ${setClause} WHERE id = $${idx}`,
    values
  );
  return result.rowCount > 0;
};

exports.deleteAd = async (id) => {
  const result = await pool.query(`DELETE FROM ads WHERE id = $1`, [id]);
  return result.rowCount > 0;
};

exports.addAdImage = async (adId, filename) => {
  const result = await pool.query(
    `INSERT INTO ad_images (ad_id, filename) VALUES ($1, $2) RETURNING id`,
    [adId, filename]
  );
  return result.rows[0].id;
};

exports.getAdImages = async (adId) => {
  const result = await pool.query(
    `SELECT filename FROM ad_images WHERE ad_id = $1`,
    [adId]
  );
  return result.rows.map((row) => row.filename);
};

exports.deleteAdImage = async (adId, filename) => {
  const result = await pool.query(
    `DELETE FROM ad_images WHERE ad_id = $1 AND filename = $2`,
    [adId, filename]
  );
  return result.rowCount > 0;
};
