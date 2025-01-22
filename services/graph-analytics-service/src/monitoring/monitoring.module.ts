import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusService } from './prometheus.service';
import { AuditService } from './audit.service';
import { Neo4jModule } from '../neo4j/neo4j.module';

@Module({
  imports: [
    ConfigModule,
    Neo4jModule
  ],
  providers: [
    PrometheusService,
    AuditService
  ],
  exports: [
    PrometheusService,
    AuditService
  ],
})
export class MonitoringModule {}