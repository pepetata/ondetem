-- setup_test.sql
-- Run this as a superuser (e.g., postgres) to create the test DB and user
--
-- run as: 
--      psql -U admin -d postgres -c "CREATE DATABASE ondetemdb_test;"
--      psql -U admin -d ondetemdb_test -f scripts/setup_test.sql


-- then to create the tables, run this script from backend directory as:
--   node scripts/init_test_db.js
-- or
--   psql -U <username> -d <database_name> -f setup.sql


-- Enable the pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop the existing table
-- DROP TABLE IF EXISTS users;

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
-- DROP TABLE IF EXISTS ads;

-- Create the ads table with columns matching AdForm fields
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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