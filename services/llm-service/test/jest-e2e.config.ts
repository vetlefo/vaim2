import type { Config } from '@jest/types';
import baseConfig from '../jest.config';

const config: Config.InitialOptions = {
  ...baseConfig,
  testRegex: '.e2e-spec.ts$',
  rootDir: '..',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
  coverageDirectory: './coverage-e2e',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  // Retry failed tests
  retry: 3,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  // Additional environment variables for e2e tests
  setupFiles: ['<rootDir>/test/setEnvVars.ts'],
  // Custom reporters for better test output
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './reports',
        outputName: 'junit-e2e.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],
  // Additional test configuration
  maxWorkers: 1, // Run tests sequentially for e2e
  bail: false, // Don't stop on first failure
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Test environment configuration
  testEnvironmentOptions: {
    url: 'http://localhost:3003', // Match test environment port
  },
};

export default config;