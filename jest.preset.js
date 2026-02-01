module.exports = {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  transform: {
    '^.+\\.(ts|js|html)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageReporters: ['html', 'text', 'lcov'],
  passWithNoTests: true,
  collectCoverageFrom: [
    '**/*.{js,ts}',
    '!**/*.spec.{js,ts}',
    '!**/*.test.{js,ts}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts}',
    '!**/jest.config.{js,ts}',
  ],
  moduleNameMapper: {
    '^@snh/database$': '<rootDir>/../../libs/database/src/index.ts',
    '^@snh/shared-types$': '<rootDir>/../../libs/shared-types/src/index.ts',
  },
  // Better test output
  verbose: true,
  testEnvironment: 'node',
};
