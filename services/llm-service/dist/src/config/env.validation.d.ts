declare enum Environment {
    Development = "development",
    Production = "production",
    Test = "test"
}
declare class EnvironmentVariables {
    NODE_ENV: Environment;
    PORT: number;
    OPENROUTER_API_KEY: string;
    SITE_URL: string;
    SITE_NAME: string;
    DEFAULT_LLM_PROVIDER: string;
    DEFAULT_MODEL: string;
    MAX_RETRIES: number;
    REQUEST_TIMEOUT: number;
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD: string;
    REDIS_DB: number;
    REDIS_CACHE_TTL: number;
    RATE_LIMIT_TTL: number;
    RATE_LIMIT_MAX: number;
    METRICS_PORT: number;
    LOG_LEVEL: string;
    LOG_FORMAT: string;
    WS_PORT: number;
    MAX_CONCURRENT_REQUESTS: number;
    BATCH_SIZE: number;
    DAILY_COST_LIMIT: number;
    ALERT_THRESHOLD: number;
}
export declare function validate(config: Record<string, unknown>): EnvironmentVariables;
export {};
