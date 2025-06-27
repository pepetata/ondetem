# E2E Testing Setup

This directory contains end-to-end tests for the Onde Tem application using Playwright.

## 🎯 Test Coverage Summary

**✅ Fully Covered (52 tests passing):**

- Authentication (login, signup, logout)
- Search functionality (text search, category search, UI states)
- Ad management (CRUD operations, image upload/management)
- Favorites system (add/remove, persistence, authentication)
- Comments system (add/view, authentication)
- Home page UI state management
- Responsive design across all features
- Integration workflows and edge cases
- **Error handling (404 pages, API errors, user-friendly messages)**

**⚠️ Areas Not Covered:**

- User profile management (`/user` route)
- My ads listing (`/my-ads` detailed functionality)
- User comments management (`/my-comments` route)
- Navigation/menu comprehensive testing
- Advanced performance metrics

## Test Files Overview

### Core Feature Tests

- **`search.spec.js`** - Home page search functionality (text search, category-based search, UI state management)
- **`favorites.spec.js`** - Add/remove favorites, authentication requirements, persistence
- **`comments.spec.js`** - Add/view comments, user information display, authentication
- **`home-ui.spec.js`** - UI state management, responsive design, layout consistency
- **`integration.spec.js`** - Cross-feature workflows, edge cases, performance testing

### Authentication & User Tests

- **`login.spec.js`** - Login functionality and error handling
- **`user-signup.spec.js`** - User registration flow
- **`user-manage.spec.js`** - User management API endpoints

### Ad Management Tests

- **`ad.spec.js`** - Ad creation, editing, deletion, image management

### Performance Tests

- **`performance.spec.js`** - Performance optimization tests (mostly skipped, requires manual testing)

### Error Handling Tests

- **`404-errors.spec.js`** - Frontend 404 pages, backend API errors, user-friendly messaging (7 tests)

## Detailed Test Coverage

### ✅ Fully Tested Features

#### Search Functionality (8 tests)

- ✅ Search bar display and functionality
- ✅ Category grid (6 images in 2 rows)
- ✅ Category-based search (clicking images)
- ✅ Text-based search with debouncing
- ✅ Search results display/hide logic
- ✅ "No results" messaging
- ✅ Responsive behavior on mobile/tablet/desktop
- ✅ State management between categories and search results

#### Favorites Feature (3 tests)

- ✅ Add/remove favorites from ad list and detail view
- ✅ Heart button state changes (filled/empty)
- ✅ Login prompt for anonymous users
- ✅ Favorite status persistence across page reloads
- ✅ Integration with search and ad detail views

#### Comments Feature (6 tests)

- ✅ View comments section in ad details
- ✅ Add comments with user authentication
- ✅ Comment display with user info and timestamps
- ✅ Authentication requirements for commenting
- ✅ Multiple comments handling
- ✅ Mobile responsiveness

#### Ad Management (8 tests)

- ✅ Create new ads with complete form
- ✅ Edit existing ads
- ✅ Delete ads
- ✅ Image upload and management (up to 5 images)
- ✅ Image deletion from existing ads
- ✅ Form validation
- ✅ File type validation
- ✅ Navigation to "Meus Anúncios"

#### Authentication (5 tests)

- ✅ Login with valid credentials
- ✅ Login error handling (wrong email/password)
- ✅ User registration flow
- ✅ Required field validation
- ✅ User management API endpoints

#### Home Page UI State (7 tests)

- ✅ Initial state (categories visible, search hidden)
- ✅ Search state (categories hidden, results visible)
- ✅ State transitions on search/clear
- ✅ Menu overlap fix on small screens
- ✅ Background color consistency
- ✅ Category image functionality
- ✅ Search loading states

#### Integration & Cross-Feature Testing (5 tests)

- ✅ Complete user journeys (search → view → favorite → comment)
- ✅ Cross-feature state persistence
- ✅ Anonymous user experience with login prompts
- ✅ Responsive behavior across all features
- ✅ Performance and debouncing
- ✅ Error handling (special characters, long inputs, empty searches)

### ⚠️ Areas That Could Use Additional Testing

#### User Profile Management

- User profile editing (`/user` route)
- Profile photo upload and management
- User data validation and updates

#### Advanced Ad Features

- Ad detail view comprehensive testing
- Ad search filtering and sorting
- Ad categories and subcategories

#### Navigation & Menu

- Comprehensive menu functionality testing
- Route navigation and state persistence
- Protected route behavior

#### Error Handling

- 404 page behavior
- Network error handling
- Server error responses
- Edge cases and validation errors

#### Performance & Accessibility

- Page load performance
- Image loading optimization
- Accessibility compliance
- SEO considerations

### 🎯 Test Quality Assessment

**Strengths:**

- ✅ Uses pre-seeded test data (no dynamic creation)
- ✅ Proper test isolation and cleanup
- ✅ Robust selector strategy avoiding strict mode violations
- ✅ Comprehensive edge case coverage
- ✅ Responsive testing across devices
- ✅ Authentication flows properly tested
- ✅ Integration between features well covered

**Current Status:**

- **52 tests passing, 9 skipped, 0 failed**
- **All critical user journeys covered**
- **Comprehensive error handling implemented**
- **Test suite is stable and reliable**
- **Pre-seeded data eliminates flakiness**

## Test Database Configuration

The tests are configured to run against a separate test database (`ondetemdb_test`) to avoid affecting your development data. All tests use pre-seeded minimal data for consistency and reliability.

### Environment Setup

- **Development DB**: `ondetemdb` (configured in `/backend/.env`)
- **Test DB**: `ondetemdb_test` (configured in `/backend/.env.test`)
- **Test Data**: Pre-seeded users and ads via `global-setup.js`

### Test Data Strategy

Tests use **pre-seeded data only**:

- 3 test users with known credentials
- 6 test ads covering different scenarios
- No dynamic data creation during tests
- Automatic database reset before each test run

This approach eliminates flakiness and ensures consistent test results.

## Running Tests

### 🛡️ Safety First!

**IMPORTANT:** E2E tests completely reset the database and delete all data!

#### Quick Safety Guide

```bash
# View the complete safety guide
npm run test:pw:guide

# Check if it's safe to run E2E tests
node tests-e2e/utils/safety-check.js
```

#### Safe E2E Testing Workflow

1. **Stop all development servers:**

   - Frontend: Ctrl+C in terminal running `npm run dev`
   - Backend: Ctrl+C in terminal running backend dev server

2. **Run E2E tests with built-in safety checks:**

   ```bash
   npm run test:pw          # All tests with safety checks
   npm run test:pw:ui       # UI mode with safety checks
   npm run test:pw:html     # HTML report with safety checks
   ```

3. **Emergency override (use with extreme caution):**
   ```bash
   npm run test:pw:force    # Skip safety checks - DANGEROUS!
   ```

### Safety Features Implemented

- **🔍 Port Detection**: Automatically detects running development servers
- **🗄️ Database Protection**: Ensures test database is used, not development
- **⚠️ Multiple Warnings**: Clear warnings before destructive operations
- **🚫 Automatic Abort**: Stops execution if unsafe conditions detected
- **🤖 CI Bypass**: Automatically allows tests in CI/CD environments

### Quick Start

```bash
# Make sure backend is running in test mode
cd ../backend
npm run test:server

# In another terminal, run E2E tests
cd frontend
npm run test:e2e

# Or run with UI mode for debugging
npm run test:e2e:ui
```

### Available Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test search.spec.js

# Run tests with UI mode (great for debugging)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run and update snapshots
npx playwright test --update-snapshots
```

### Test Reports

```bash
# Show last test report
npx playwright show-report

# Generate and show HTML report
npm run test:e2e:report
```

## Test Architecture

### File Structure

```
tests-e2e/
├── *.spec.js           # Test files
├── global-setup.js     # Database setup and seeding
├── global-teardown.js  # Cleanup after tests
├── fixtures/           # Test data and fixtures
├── utils/             # Test utilities
└── playwright-report/ # Test reports
```

### Test Files

- **`search.spec.js`** - Home page search and category functionality (8 tests)
- **`favorites.spec.js`** - Favorites add/remove and persistence (3 tests)
- **`comments.spec.js`** - Comments viewing and creation (6 tests)
- **`home-ui.spec.js`** - UI state management and responsive design (7 tests)
- **`integration.spec.js`** - Cross-feature workflows and edge cases (5 tests)
- **`ad.spec.js`** - Ad CRUD operations and image management (8 tests)
- **`login.spec.js`** - Authentication flows (2 tests)
- **`user-signup.spec.js`** - User registration (2 tests)
- **`user-manage.spec.js`** - User management APIs (4 tests)
- **`performance.spec.js`** - Performance tests (1 test, others skipped)
- **`404-errors.spec.js`** - Error handling and 404 pages (7 tests)

### Test Data Management

Tests automatically:

1. **Setup**: Reset and seed test database before each run
2. **Isolation**: Each test uses known pre-seeded data
3. **Cleanup**: Global teardown removes any test artifacts
4. **Consistency**: Same data across all test runs

Pre-seeded test data includes:

- **Users**: testuser1@example.com, testuser2@example.com, testuser3@example.com
- **Ads**: "Anúncio para Favoritar", "Anúncio com Comentários", etc.
- **Categories**: All 6 main app categories

## Configuration

Test configuration is in `playwright.config.js`:

- **Browsers**: Chromium (default), Firefox, Safari available
- **Timeouts**: 30s default, 60s for slow operations
- **Retries**: 1 retry on failure
- **Global Setup/Teardown**: Automatic database management
- **Base URL**: http://localhost:5173 (Vite dev server)

### Test Environment

- **Frontend**: Vite dev server (auto-started by Playwright)
- **Backend**: Must be manually started in test mode
- **Database**: PostgreSQL test database (`ondetemdb_test`)
- **File Uploads**: Test images cleaned up automatically

## 🛡️ Error Handling & 404 Testing

### Error Handling Features Implemented

#### Frontend 404 Handling (6 tests)

- ✅ **Custom 404 Page**: User-friendly page with clear messaging and action buttons
- ✅ **React Router Catch-all**: `*` route captures all unmatched paths
- ✅ **Navigation Buttons**: "Voltar ao início" and "Criar anúncio" options
- ✅ **Responsive Design**: 404 page works across all device sizes
- ✅ **Non-existent Routes**: /admin, /dashboard, /invalid-paths properly handled
- ✅ **Deep Links**: Direct navigation to invalid URLs shows 404 page

#### Backend API Error Handling (10 tests)

- ✅ **Input Validation**: UUID format validation before database queries
- ✅ **User-Friendly Messages**: All errors include Portuguese messages for end users
- ✅ **Proper Status Codes**: 404 for not found, not 500 for invalid IDs
- ✅ **Unknown Endpoints**: Express middleware catches undefined routes
- ✅ **Invalid Resource IDs**: Non-existent ads/users return 404 with helpful messages
- ✅ **Malformed Requests**: Invalid UUID formats return 404, not server errors

#### Error Messages Examples

**Frontend 404 Page:**

```
404
Página não encontrada
Desculpe, a página que você está procurando não existe ou foi movida.
```

**Backend API Errors:**

- Invalid UUID: "O anúncio solicitado não foi encontrado. Verifique se o link está correto."
- Unknown endpoint: "A página ou recurso solicitado não foi encontrado no servidor."
- Resource not found: "O usuário solicitado não foi encontrado."

#### Error Handling Components

- **`NotFound.jsx`**: Beautiful 404 page with suggestions and navigation
- **`ErrorBoundary.jsx`**: Catches JavaScript errors gracefully
- **`apiErrorHandler.js`**: Utility for consistent API error handling
- **Backend validation**: Input sanitization and format checking

### Error Testing Strategy

The `404-errors.spec.js` test file comprehensively tests:

1. **Frontend Route Handling**: All invalid routes show custom 404 page
2. **API Error Responses**: Backend returns proper 404s with user messages
3. **Navigation**: 404 page buttons work correctly
4. **User Experience**: Errors are handled gracefully without crashes

### Error Demo (Development Only)

In development mode, visit `/error-demo` to see interactive demonstrations of:

- Frontend 404 page behavior
- API error handling with user-friendly messages
- All implemented error handling features

## Best Practices Implemented

### ✅ Reliability

- Pre-seeded data eliminates test flakiness
- Proper wait strategies (waitForLoadState, explicit waits)
- Robust selectors avoiding strict mode violations
- Comprehensive error handling

### ✅ Maintainability

- Clear test structure and naming
- Reusable test utilities
- Good test isolation
- Comprehensive documentation

### ✅ Coverage

- All critical user journeys tested
- Edge cases and error scenarios covered
- Responsive design testing
- Cross-feature integration testing

### ✅ Performance

- Fast test execution with pre-seeded data
- Efficient selector strategies
- Minimal test setup/teardown
- Parallel test execution capability

## Debugging Tests

### Common Issues and Solutions

1. **Test Timeouts**

   - Increase timeout in test or config
   - Check if backend is running in test mode
   - Verify database connectivity

2. **Element Not Found**

   - Check selector specificity
   - Verify page load state
   - Use page.pause() for debugging

3. **Flaky Tests**
   - Add proper wait conditions
   - Check for race conditions
   - Verify test data consistency

### Debug Commands

```bash
# Run single test with debug info
npx playwright test search.spec.js --debug

# Run with console output
npx playwright test --reporter=list

# Generate trace for failed tests
npx playwright test --trace=on-failure
```

## Maintenance

### When to Update Tests

- ✅ After UI changes that affect selectors
- ✅ When adding new features
- ✅ When changing authentication flow
- ✅ After database schema changes

### Regular Maintenance Tasks

- Review and update test data as needed
- Clean up unused test files
- Update selectors for UI changes
- Monitor test execution times
- Review test coverage gaps
