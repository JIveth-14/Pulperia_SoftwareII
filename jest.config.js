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
  // e2e/ son pruebas de Playwright (se corren con `npm run test:e2e`).
  testPathIgnorePatterns: ['<rootDir>/e2e/', '<rootDir>/node_modules/'],
  // Debe coincidir con sonar.sources/sonar.coverage.exclusions: un archivo que
  // Sonar analiza pero no aparece en lcov.info cuenta como 0 % cubierto.
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'MORA_APP/backend/**/*.{js,jsx,ts,tsx}',
    'MORA_APP/frontend/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{js,jsx,ts,tsx}',
    '!**/__tests__/**',
    '!**/?(*.)+(spec|test).[jt]s?(x)',
    '!src/app/**/page.tsx',
    '!src/app/**/layout.tsx',
    '!src/app/presentacion/**',
    '!src/repositories/**',
    '!src/types/**',
    '!src/lib/cache/index.ts',
    '!src/lib/cache/redis.ts',
    '!src/lib/supabase/index.ts',
    '!src/lib/supabase/sql/**',
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
