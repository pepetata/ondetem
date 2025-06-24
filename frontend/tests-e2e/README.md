# E2E Testing Setup

This directory contains end-to-end tests for the Onde Tem application using Playwright.

## Test Database Configuration

The tests are configured to run against a separate test database (`ondetemdb_test`) to avoid affecting your development data.

### Environment Setup

- **Development DB**: `ondetemdb` (configured in `/backend/.env`)
- **Test DB**: `ondetemdb_test` (configured in `/backend/.env.test`)

## Available Scripts

### Prerequisites

**✅ FULLY AUTOMATED!** No manual setup required.

When you run tests, Playwright automatically:

- Starts the backend server in test mode (using `ondetemdb_test`)
- Starts the frontend development server
- Runs all tests
- Cleans up test data
- Stops both servers

Just run the tests!

### Running Tests

```bash
# Run all E2E tests (fully automated!)
npm run test:pw

# Run tests with UI mode
npm run test:pw:ui
```

**That's it!** Everything is automatic - both backend and frontend start automatically.

### Database Management

```bash
# Initialize/reset test database (optional - tests handle this automatically)
npm run test:setup

# Manual cleanup if needed (optional - tests clean up automatically)
npm run test:cleanup
```

## Test Structure

- `ad.spec.js` - Tests for ad creation, editing, deletion, and image management
- `login.spec.js` - Tests for user authentication
- `user-manage.spec.js` - Tests for user management API endpoints
- `user-signup.spec.js` - Tests for user registration

## Utilities

- `utils/cleanup.js` - Test data cleanup utilities
- `utils/manual-cleanup.js` - Manual cleanup script
- `utils/test-setup.js` - Test environment setup script
- `global-teardown.js` - Automatic cleanup after test runs

## Test Data Management

Tests automatically:

1. Create their own test data (ads, users)
2. Clean up after themselves
3. Use isolated test database
4. Remove uploaded test images

The cleanup system has multiple strategies:

- **UI-based cleanup**: Uses Playwright to delete via the web interface
- **API-based cleanup**: Direct API calls as fallback
- **File system cleanup**: Removes test images from uploads directory

## Configuration

Test configuration is in `playwright.config.js`:

- **Frontend**: Automatically started by Playwright on port 5173
- **Backend**: Must be manually started in test mode (see Prerequisites above)
- Configures timeouts and retries
- Sets up global teardown for cleanup

**Important**: The backend is NOT automatically started by Playwright due to Windows PowerShell compatibility issues. You must start it manually in test mode to ensure it uses the test database (`ondetemdb_test`).
