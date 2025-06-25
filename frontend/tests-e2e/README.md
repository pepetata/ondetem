# E2E Testing Setup

This directory contains end-to-end tests for the Onde Tem application using Playwright.

## Test Files Overview

### Core Feature Tests

- **`search.spec.js`** - Home page search functionality (text search, category-based search, UI state management)
- **`favorites.spec.js`** - Add/remove favorites, authentication requirements, persistence
- **`comments.spec.js`** - Add/view comments, user information display, authentication
- **`home-ui.spec.js`** - UI state management, responsive design, layout consistency
- **`integration.spec.js`** - Cross-feature workflows, edge cases, performance testing

### Existing Tests

- **`ad.spec.js`** - Ad creation, editing, viewing
- **`login.spec.js`** - Login functionality
- **`user-manage.spec.js`** - User management
- **`user-signup.spec.js`** - User registration

## Test Coverage

The new E2E tests cover:

### Search Functionality

- ✅ Search bar display and functionality
- ✅ Category grid (6 images in 2 rows)
- ✅ Category-based search (clicking images)
- ✅ Text-based search with debouncing
- ✅ Search results display/hide logic
- ✅ "No results" messaging
- ✅ Responsive behavior on mobile/tablet/desktop

### Favorites Feature

- ✅ Add/remove favorites from ad list and detail view
- ✅ Heart animation when adding favorites
- ✅ Login prompt for anonymous users
- ✅ Favorite status persistence across page reloads
- ✅ Visual state changes (filled/empty heart)

### Comments Feature

- ✅ View comments section in ad details
- ✅ Add comments with user authentication
- ✅ Comment display with user info and timestamps
- ✅ Authentication requirements for commenting
- ✅ Multiple comments handling
- ✅ Mobile responsiveness

### Home Page UI State

- ✅ Initial state (categories visible, search hidden)
- ✅ Search state (categories hidden, results visible)
- ✅ State transitions on search/clear
- ✅ Menu overlap fix on small screens
- ✅ Background color consistency ($bg-color)
- ✅ Image quality and cropping (object-fit: contain)
- ✅ Discrete search messaging

### Integration & Edge Cases

- ✅ Complete user journeys (search → view → favorite → comment)
- ✅ Cross-feature state persistence
- ✅ Anonymous user experience with login prompts
- ✅ Responsive behavior across all features
- ✅ Performance and debouncing
- ✅ Error handling (special characters, long inputs, empty searches)

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
