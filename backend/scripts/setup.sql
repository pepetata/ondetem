-- setup.sql
-- first create the database, then run this script to set up the initial schema
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


-- Enable the pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop the existing table
DROP TABLE IF EXISTS users;

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
DROP TABLE IF EXISTS ads;

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);