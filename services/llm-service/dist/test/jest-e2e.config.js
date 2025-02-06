"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jest_config_1 = __importDefault(require("../jest.config"));
const config = Object.assign(Object.assign({}, jest_config_1.default), { testRegex: '.e2e-spec.ts$', rootDir: '..', testTimeout: 30000, setupFilesAfterEnv: ['<rootDir>/test/setup.ts'], moduleNameMapper: {
        '^@app/(.*)$': '<rootDir>/src/$1',
        '^@test/(.*)$': '<rootDir>/test/$1',
    }, coverageDirectory: './coverage-e2e', testEnvironment: 'node', globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.json',
        },
    }, verbose: true, detectOpenHandles: true, forceExit: true, setupFiles: ['<rootDir>/test/setEnvVars.ts'], reporters: [
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
    ], maxWorkers: 1, bail: false, clearMocks: true, resetMocks: true, restoreMocks: true, testEnvironmentOptions: {
        url: 'http://localhost:3003',
    } });
exports.default = config;
//# sourceMappingURL=jest-e2e.config.js.map