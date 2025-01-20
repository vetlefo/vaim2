import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { ScheduleModule } from '@nestjs/schedule';
import { Neo4jModule } from './neo4j/neo4j.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    // Core modules
    ConfigModule,
    ScheduleModule.forRoot(),
    
    // Feature modules
    Neo4jModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}