import { Module } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { AuditService } from './audit.service';

@Module({
  providers: [PrometheusService, AuditService],
  exports: [PrometheusService, AuditService],
})
export class MonitoringModule {}