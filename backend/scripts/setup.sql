-- setup.sql
-- for development and production environments


-- first create the database, then run this script to set up the initial schema
--
--    psql -U postgres # pw=admin
--    CREATE USER admin WITH PASSWORD 'admin';
--    ALTER USER admin SUPERUSER;
--    CREATE DATABASE ondetemdb;
--    GRANT ALL PRIVILEGES ON DATABASE ondetemdb TO admin;
--    \q
-- then to create the tables, run this script from backend directory as:
--   node scripts/init_db.js 
-- or
--   psql -U <username> -d <database_name> -f setup.sql


-- for TEST environments

-- first create the database, then run this script to set up the initial schema
--    psql -U postgres # pw=admin
--    CREATE USER admin WITH PASSWORD 'admin';
--    ALTER USER admin SUPERUSER;
--    CREATE DATABASE ondetemdb_test;
--    GRANT ALL PRIVILEGES ON DATABASE ondetemdb_test TO admin;
--    \q
-- then to create the tables, run this script from backend directory as:
--   node scripts/init_db.js 
-- or
--   psql -U <username> -d <database_name> -f setup.sql


-- Drop existing tables if they exist to start fresh
-- Drop tables in reverse order of dependencies to avoid foreign key conflicts
DROP INDEX IF EXISTS idx_comments_ad_id;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS ad_images;
DROP TABLE IF EXISTS ads;
DROP TABLE IF EXISTS users;


-- Enable the pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop the existing table

-- Create the new table with a UUID primary key
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  nickname VARCHAR(50),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  photo_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- Drop the ads table if it exists

-- Create the ads table with columns matching AdForm fields
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    short VARCHAR(255),
    description TEXT,
    tags VARCHAR(255),
    zipcode VARCHAR(9),
    city VARCHAR(30),
    state VARCHAR(2),
    address1 VARCHAR(100),
    streetnumber VARCHAR(20),
    address2 VARCHAR(100),
    radius INTEGER,
    phone1 VARCHAR(20),
    phone2 VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(100),
    startdate DATE,
    finishdate DATE,
    timetext TEXT,
    comments integer,
    likes integer,
    rating smallint,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DROP TABLE IF EXISTS ad_images;

-- Create the ad_images table to store filenames of ad images
CREATE TABLE ad_images (
  id SERIAL PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  -- ad_id INTEGER REFERENCES ads(id) ON DELETE CASCADE,
  filename TEXT NOT NULL
);

-- DROP TABLE IF EXISTS favorites;

-- Create the favorites table to store user favorites
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ad_id)
);



-- Add comments table to the database
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance when querying comments by ad_id
CREATE INDEX IF NOT EXISTS idx_comments_ad_id ON comments(ad_id);

-- Create index for better performance when querying comments by user_id
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE
    ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();