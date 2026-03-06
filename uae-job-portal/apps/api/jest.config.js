/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterFramework: ['./tests/setup.ts'],
  setupFilesAfterFramework: undefined,
  globalSetup: undefined,
  setupFiles: ['./tests/setup.ts'],
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@uaejobs/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
};
