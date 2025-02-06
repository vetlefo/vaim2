"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = require("path");
(0, dotenv_1.config)({
    path: (0, path_1.resolve)(__dirname, '../.env.e2e'),
});
process.env.NODE_ENV = 'test';
process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1';
Object.assign(process.env, {
    PORT: '3003',
    WS_PORT: '3004',
    METRICS_PORT: '9466',
    REDIS_HOST: 'redis-test',
    REDIS_PORT: '6379',
    REDIS_DB: '2',
    CACHE_ENABLED: 'false',
    OPENROUTER_API_KEY: 'test-key',
    DEEPSEEK_API_KEY: 'test-key',
    TEST_TIMEOUT: '30000',
    RETRY_ATTEMPTS: '3',
    RETRY_DELAY: '1000',
    GRAPHQL_PLAYGROUND: 'false',
    GRAPHQL_DEBUG: 'false',
    GRAPHQL_INTROSPECTION: 'true',
    LOG_LEVEL: 'error',
    LOG_FORMAT: 'json',
    JWT_SECRET: 'test-jwt-secret',
    REFRESH_TOKEN_SECRET: 'test-refresh-token-secret',
});
const requiredEnvVars = [
    'PORT',
    'WS_PORT',
    'REDIS_HOST',
    'REDIS_PORT',
    'OPENROUTER_API_KEY',
];
requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is missing`);
    }
});
console.log('Test environment configured:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    WS_PORT: process.env.WS_PORT,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
});
//# sourceMappingURL=setEnvVars.js.map