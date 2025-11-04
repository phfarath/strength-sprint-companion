module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/test/**/*.test.js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    '!**/node_modules/**',
    '!**/test/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  verbose: true
};
