-- setup.sql
-- first create the database, then run this script to set up the initial schema
--    psql -U postgres # pw=admin
--    CREATE USER admin WITH PASSWORD 'admin';
--    ALTER USER admin SUPERUSER;
--    CREATE DATABASE ondetemdb;
--    GRANT ALL PRIVILEGES ON DATABASE ondetemdb TO admin;
--    \q
-- run as:
--   node scripts/init_db.js #from backend directory
-- or
--   psql -U <username> -d <database_name> -f setup.sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  nickname VARCHAR(50),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  photo_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add more CREATE TABLE statements here as needed