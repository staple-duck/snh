import type { Config } from 'jest';

export default (): Config => ({
  projects: [
    '<rootDir>/apps/api/jest.config.ts',
    '<rootDir>/apps/api-e2e/jest.config.cts',
    '<rootDir>/libs/database/jest.config.ts',
    '<rootDir>/libs/shared-types/jest.config.ts'
  ]
});
