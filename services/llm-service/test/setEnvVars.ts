import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.e2e file
config({
  path: resolve(__dirname, '../.env.e2e'),
});

// Set additional test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1';

// Override any environment variables for testing
Object.assign(process.env, {
  // Server configuration
  PORT: '3003',
  WS_PORT: '3004',
  METRICS_PORT: '9466',

  // Redis configuration
  REDIS_HOST: 'redis-test',
  REDIS_PORT: '6379',
  REDIS_DB: '2',

  // Cache configuration
  CACHE_ENABLED: 'false',

  // Provider configuration
  OPENROUTER_API_KEY: 'test-key',
  DEEPSEEK_API_KEY: 'test-key',

  // Test configuration
  TEST_TIMEOUT: '30000',
  RETRY_ATTEMPTS: '3',
  RETRY_DELAY: '1000',

  // GraphQL configuration
  GRAPHQL_PLAYGROUND: 'false',
  GRAPHQL_DEBUG: 'false',
  GRAPHQL_INTROSPECTION: 'true',

  // Monitoring configuration
  LOG_LEVEL: 'error',
  LOG_FORMAT: 'json',

  // Security configuration
  JWT_SECRET: 'test-jwt-secret',
  REFRESH_TOKEN_SECRET: 'test-refresh-token-secret',
});

// Validate required environment variables
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

// Log test environment configuration
console.log('Test environment configured:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  WS_PORT: process.env.WS_PORT,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
});