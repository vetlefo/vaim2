import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { ConfigModule } from '../config/config.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule,
    AnalyticsModule,
    MonitoringModule,
    ScheduleModule.forRoot(),
  ],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}