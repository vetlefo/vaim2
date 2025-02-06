"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/**/*.(t|j)s',
        '!src/main.ts',
        '!src/**/*.module.ts',
        '!src/**/*.interface.ts',
        '!src/**/*.dto.ts',
        '!src/config/**/*',
    ],
    coverageDirectory: './coverage',
    testEnvironment: 'node',
    roots: ['<rootDir>/src/', '<rootDir>/test/'],
    moduleNameMapper: {
        '^@app/(.*)$': '<rootDir>/src/$1',
        '^@test/(.*)$': '<rootDir>/test/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
    verbose: true,
    detectOpenHandles: true,
    forceExit: true,
    testTimeout: 30000,
};
const e2eConfig = Object.assign(Object.assign({}, config), { testRegex: '.e2e-spec.ts$', rootDir: '.', coverageDirectory: './coverage-e2e', setupFilesAfterEnv: ['<rootDir>/test/setup.ts'] });
exports.default = process.env.TEST_TYPE === 'e2e' ? e2eConfig : config;
//# sourceMappingURL=jest.config.js.map