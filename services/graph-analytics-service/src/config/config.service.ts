import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  // Service Configuration
  get port(): number {
    return this.configService.get<number>('PORT', 3002);
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  // Neo4j Configuration
  get neo4jUri(): string {
    return this.configService.get<string>('NEO4J_URI', 'bolt://localhost:7687');
  }

  get neo4jUsername(): string {
    return this.configService.get<string>('NEO4J_USERNAME', 'neo4j');
  }

  get neo4jPassword(): string {
    return this.configService.get<string>('NEO4J_PASSWORD', '');
  }

  get neo4jDatabase(): string {
    return this.configService.get<string>('NEO4J_DATABASE', 'neo4j');
  }

  // Kafka Configuration
  get kafkaBrokers(): string[] {
    const brokers = this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092');
    return brokers.split(',');
  }

  get kafkaClientId(): string {
    return this.configService.get<string>('KAFKA_CLIENT_ID', 'graph-analytics-service');
  }

  get kafkaGroupId(): string {
    return this.configService.get<string>('KAFKA_GROUP_ID', 'graph-analytics-group');
  }

  get kafkaSslEnabled(): boolean {
    return this.configService.get<boolean>('KAFKA_SSL_ENABLED', false);
  }

  // Redis Configuration
  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST', 'localhost');
  }

  get redisPort(): number {
    return this.configService.get<number>('REDIS_PORT', 6379);
  }

  get redisPassword(): string {
    return this.configService.get<string>('REDIS_PASSWORD', '');
  }

  get redisDb(): number {
    return this.configService.get<number>('REDIS_DB', 0);
  }

  // Analytics Configuration
  get analyticsBatchSize(): number {
    return this.configService.get<number>('ANALYTICS_BATCH_SIZE', 1000);
  }

  get analyticsScheduleEnabled(): boolean {
    return this.configService.get<boolean>('ANALYTICS_SCHEDULE_ENABLED', true);
  }

  get analyticsScheduleCron(): string {
    return this.configService.get<string>('ANALYTICS_SCHEDULE_CRON', '0 0 * * *');
  }

  // Security Configuration
  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', '');
  }

  get jwtExpiration(): number {
    return this.configService.get<number>('JWT_EXPIRATION', 3600);
  }

  // Logging Configuration
  get logLevel(): string {
    return this.configService.get<string>('LOG_LEVEL', 'debug');
  }

  get enableRequestLogging(): boolean {
    return this.configService.get<boolean>('ENABLE_REQUEST_LOGGING', true);
  }

  // Monitoring Configuration
  get enableMetrics(): boolean {
    return this.configService.get<boolean>('ENABLE_METRICS', true);
  }

  get metricsPort(): number {
    return this.configService.get<number>('METRICS_PORT', 9464);
  }

  // Helper method to get number values from config
  getNumber(key: string, defaultValue?: number): number {
    const value = this.configService.get<number>(key);
    return value ?? defaultValue;
  }

  // Helper method to validate required configuration
  validateConfig(): void {
    const requiredEnvVars = [
      'NEO4J_URI',
      'NEO4J_USERNAME',
      'NEO4J_PASSWORD',
      'KAFKA_BROKERS',
      'JWT_SECRET',
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !this.configService.get<string>(envVar),
    );

    if (missingEnvVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`,
      );
    }
  }
}