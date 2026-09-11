const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/frontend/(.*)$': '<rootDir>/MORA_APP/frontend/$1',
    '^@/middleware/(.*)$': '<rootDir>/MORA_APP/backend/middleware/$1',
    '^@/services/(.*)$': '<rootDir>/MORA_APP/backend/services/$1',
    '^@/api/(.*)$': '<rootDir>/MORA_APP/backend/api/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['<rootDir>/legacy/'],
  collectCoverageFrom: [
    'src/middleware.ts',
    'src/app/api/**/*.{js,jsx,ts,tsx}',
    'src/components/**/*.{js,jsx,ts,tsx}',
    'src/lib/cache/cacheKeys.ts',
    'src/lib/cache/cacheService.ts',
    'src/lib/supabase/**/*.{js,jsx,ts,tsx}',
    'src/utils/*.ts',
    'MORA_APP/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{js,jsx,ts,tsx}',
    '!**/__tests__/**',
    '!**/?(*.)+(spec|test).[jt]s?(x)',
    '!src/lib/cache/index.ts',
    '!src/lib/cache/redis.ts',
    '!src/lib/supabase/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 60,
      statements: 0,
    },
  },
  collectCoverage: true,
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],
  coverageDirectory: 'coverage',
}

module.exports = createJestConfig(config)
