export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: [
    '**/platforms/**/*.test.js',
    '**/tests/**/*.test.js',
  ],
  collectCoverageFrom: [
    'platforms/**/*.js',
    'services/**/*.js',
    '!**/*.config.js',
    '!**/index.js',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
    },
  },
  moduleFileExtensions: ['js', 'mjs', 'json'],
  verbose: true,
  testTimeout: 30000,
};
