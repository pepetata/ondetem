-- setup_test.sql
-- Run this as a superuser (e.g., postgres) to create the test DB and user
--
-- run as: 
--      psql -U admin -d postgres -c "CREATE DATABASE ondetemdb_test;"
--      psql -U admin -d ondetemdb_test -f scripts/setup_test.sql


-- then to create the tables, run this script from backend directory as:
--   node scripts/init_db.js 
-- or
--   psql -U <username> -d <database_name> -f setup.sql
