const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addCommentsTable() {
  try {
    console.log("Adding comments table...");

    // Read the SQL file
    const sqlPath = path.join(__dirname, "add_comments_table.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Execute the SQL
    await pool.query(sql);

    console.log("✅ Comments table added successfully!");

    // Test the table by checking if it exists
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'comments'
    `);

    if (result.rows.length > 0) {
      console.log("✅ Comments table verified - exists in database");

      // Check the table structure
      const structure = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'comments' 
        ORDER BY ordinal_position
      `);

      console.log("📋 Table structure:");
      structure.rows.forEach((col) => {
        console.log(
          ` - ${col.column_name}: ${col.data_type}${
            col.is_nullable === "NO" ? " NOT NULL" : ""
          }`
        );
      });
    } else {
      console.log("❌ Comments table was not created");
    }
  } catch (error) {
    console.error("❌ Error adding comments table:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
  } finally {
    await pool.end();
  }
}

// Run the migration
addCommentsTable();
