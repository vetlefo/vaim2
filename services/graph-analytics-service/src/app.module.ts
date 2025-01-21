import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { ScheduleModule } from '@nestjs/schedule';
import { Neo4jModule } from './neo4j/neo4j.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { RedisModule } from './redis/redis.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';

@Module({
  imports: [
    // Core modules
    ConfigModule,
    ScheduleModule.forRoot(),
    MonitoringModule,
    RedisModule,
    RateLimitModule,
    
    // Feature modules
    Neo4jModule,
    AnalyticsModule,
    PipelineModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}