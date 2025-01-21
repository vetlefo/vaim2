import { Module } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [PrometheusService],
  exports: [PrometheusService],
})
export class MonitoringModule {}