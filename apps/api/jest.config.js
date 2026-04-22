/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@reino-flor/database$': '<rootDir>/../../packages/database/src/index.ts',
    '^@reino-flor/auth$': '<rootDir>/../../packages/auth/src/index.ts',
    '^@/(.*)$': '<rootDir>/$1',
  },
}
