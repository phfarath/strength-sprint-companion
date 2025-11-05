// Test setup file
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';
process.env.PORT = '3001';

// Suppress console.error during tests unless needed
if (!process.env.VERBOSE_TESTS) {
  global.console.error = jest.fn();
  global.console.log = jest.fn();
}

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
