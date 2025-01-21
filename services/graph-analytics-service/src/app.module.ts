import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { ScheduleModule } from '@nestjs/schedule';
import { Neo4jModule } from './neo4j/neo4j.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { PipelineModule } from './pipeline/pipeline.module';

@Module({
  imports: [
    // Core modules
    ConfigModule,
    ScheduleModule.forRoot(),
    MonitoringModule,
    
    // Feature modules
    Neo4jModule,
    AnalyticsModule,
    PipelineModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}