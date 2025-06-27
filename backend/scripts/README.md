# Backend Database Scripts

This directory contains database initialization and management scripts for the Onde Tem application.

## 📋 Overview

The scripts handle database setup, schema management, and environment validation for both development and test environments.

## 📁 Files

### Core Database Scripts

#### `setup.sql`

**Primary database schema file** - Creates all tables and relationships.

**Tables Created:**

- `users` - User accounts with UUID primary keys
- `ads` - Advertisement listings with full contact information
- `ad_images` - Image attachments for ads (up to 5 per ad)
- `favorites` - User favorites system
- `comments` - Comment system with user information and timestamps

**Features:**

- UUID primary keys for better scalability
- Proper foreign key relationships with CASCADE deletes
- Indexes for performance optimization
- Triggers for automatic timestamp updates
- PostgreSQL extensions (pgcrypto for UUID generation)

#### `init_db.js`

**Development/Production database initializer**

```bash
# Initialize development database
node scripts/init_db.js
```

- Uses `.env` configuration
- Connects to main database (usually `ondetemdb`)
- Executes `setup.sql` to create all tables
- Safe to run multiple times (uses `IF NOT EXISTS`)

#### `init_test_db.js`

**Test database initializer** for E2E testing

```bash
# Initialize test database
NODE_ENV=test node scripts/init_test_db.js
```

- Uses `.env.test` configuration
- Connects to test database (`ondetemdb_test`)
- Executes `setup.sql` to create all tables
- Used by E2E test setup automation

#### `validate-test-env.js`

**Test environment safety validator**

```bash
# Validate test environment
node scripts/validate-test-env.js
```

- Ensures test database is properly configured
- Prevents accidental testing against production data
- Used by `npm run start:test` command
- Part of E2E testing safety system

## 🚀 Usage

### First-Time Database Setup

#### 1. Create PostgreSQL Database and User

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create admin user
CREATE USER admin WITH PASSWORD 'admin';
ALTER USER admin SUPERUSER;

-- Create development database
CREATE DATABASE ondetemdb;
GRANT ALL PRIVILEGES ON DATABASE ondetemdb TO admin;

-- Create test database
CREATE DATABASE ondetemdb_test;
GRANT ALL PRIVILEGES ON DATABASE ondetemdb_test TO admin;

\q
```

#### 2. Configure Environment Files

**`.env` (Development/Production):**

```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/ondetemdb
NODE_ENV=development
```

**`.env.test` (Testing):**

```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/ondetemdb_test
NODE_ENV=test
```

#### 3. Initialize Database Schema

```bash
# For development
cd backend
node scripts/init_db.js

# For testing
NODE_ENV=test node scripts/init_test_db.js
```

### Daily Development Workflow

```bash
# Start development server (auto-validates environment)
npm run dev

# Start test server (validates test environment)
npm run start:test

# Reset test database (used by E2E tests)
NODE_ENV=test node scripts/init_test_db.js
```

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  nickname VARCHAR(50),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  photo_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Ads Table

```sql
CREATE TABLE ads (
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
  comments INTEGER,
  likes INTEGER,
  rating SMALLINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Supporting Tables

- **`ad_images`** - Stores image filenames (1-5 per ad)
- **`favorites`** - User favorites with unique constraints
- **`comments`** - Comments with auto-updating timestamps

## 🛡️ Safety Features

### Test Environment Protection

- `validate-test-env.js` ensures test database usage
- Environment-specific configurations prevent data loss
- E2E tests automatically use separate test database

### Database Reset Safety

- Scripts use `IF NOT EXISTS` for safe re-execution
- Proper DROP order prevents foreign key conflicts
- Indexes and triggers are recreated cleanly

## 🔧 Troubleshooting

### Common Issues

#### "Database does not exist"

```bash
# Create the missing database
psql -U postgres -c "CREATE DATABASE ondetemdb;"
psql -U postgres -c "CREATE DATABASE ondetemdb_test;"
```

#### "Permission denied"

```bash
# Grant privileges to admin user
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ondetemdb TO admin;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ondetemdb_test TO admin;"
```

#### "Connection refused"

```bash
# Check if PostgreSQL is running
# Windows: Check Services for PostgreSQL
# Linux/Mac: sudo systemctl status postgresql
```

#### Foreign Key Violations

```bash
# Reset database completely
node scripts/init_db.js
# This drops all tables and recreates them in proper order
```

### Debug Commands

```bash
# Test database connection
psql -U admin -d ondetemdb -c "SELECT version();"

# Check tables exist
psql -U admin -d ondetemdb -c "\dt"

# View table structure
psql -U admin -d ondetemdb -c "\d users"
```

## 📝 Development Notes

### Schema Evolution

- All tables use UUID primary keys for better scalability
- Foreign keys use proper CASCADE deletes
- Comments table fixed to use UUID (was INTEGER before)
- Indexes added for performance on frequently queried columns

### File History

- Migration files (`add_comments_*`, `add_favorites_*`) were consolidated into `setup.sql`
- Empty/obsolete files removed during cleanup
- All current files are actively used and essential

### Best Practices

- Always use `init_test_db.js` for test database setup
- Run `validate-test-env.js` before starting test servers
- Use environment-specific `.env` files
- Regular backups recommended before schema changes

## 🔗 Related Documentation

- **Frontend E2E Tests**: `frontend/tests-e2e/README.md`
- **API Documentation**: `backend/src/README.md`
- **Safety Guide**: `frontend/tests-e2e/utils/e2e-guide.js`
- **Error Handling**: `ERROR_HANDLING_SUMMARY.md`
- **SQL Security**: `SQL_INJECTION_PREVENTION.md` - Comprehensive SQL injection prevention implementation
