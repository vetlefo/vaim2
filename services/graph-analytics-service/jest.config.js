module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@analytics/(.*)$': '<rootDir>/src/analytics/$1',
    '^@integration/(.*)$': '<rootDir>/src/integration/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@neo4j/(.*)$': '<rootDir>/src/neo4j/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/rate-limit-setup.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^test/(.*)$': '<rootDir>/test/$1'
  },
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 30000,
};