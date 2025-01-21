import { plainToClass } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @IsOptional()
  PORT: number = 3002;

  @IsString()
  OPENROUTER_API_KEY: string;

  @IsString()
  @IsOptional()
  SITE_URL: string;

  @IsString()
  @IsOptional()
  SITE_NAME: string;

  @IsString()
  @IsOptional()
  DEFAULT_LLM_PROVIDER: string = 'openrouter';

  @IsString()
  @IsOptional()
  DEFAULT_MODEL: string = 'deepseek/deepseek-r1';

  @IsNumber()
  @IsOptional()
  MAX_RETRIES: number = 3;

  @IsNumber()
  @IsOptional()
  REQUEST_TIMEOUT: number = 30000;

  @IsString()
  @IsOptional()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string;

  @IsNumber()
  @IsOptional()
  REDIS_DB: number = 0;

  @IsNumber()
  @IsOptional()
  REDIS_CACHE_TTL: number = 3600;

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_TTL: number = 60;

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_MAX: number = 100;

  @IsNumber()
  @IsOptional()
  METRICS_PORT: number = 9464;

  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'debug';

  @IsString()
  @IsOptional()
  LOG_FORMAT: string = 'json';

  @IsNumber()
  @IsOptional()
  WS_PORT: number = 3003;

  @IsNumber()
  @IsOptional()
  MAX_CONCURRENT_REQUESTS: number = 50;

  @IsNumber()
  @IsOptional()
  BATCH_SIZE: number = 10;

  @IsNumber()
  @IsOptional()
  DAILY_COST_LIMIT: number = 50;

  @IsNumber()
  @IsOptional()
  ALERT_THRESHOLD: number = 45;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}