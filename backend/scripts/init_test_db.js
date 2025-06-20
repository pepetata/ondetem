require("dotenv").config({ path: ".env.test" });
const { Pool } = require("pg");
const fs = require("fs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = fs.readFileSync("./scripts/setup_test.sql", "utf8");

pool
  .query(sql)
  .then(() => {
    console.log("TEST database initialized!");
    pool.end();
  })
  .catch((err) => {
    console.error("Error initializing database:", err);
    pool.end();
  });
