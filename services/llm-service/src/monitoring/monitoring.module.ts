import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { PrometheusService } from './prometheus.service';
import { MonitoringController } from './monitoring.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    RedisModule,
  ],
  providers: [PrometheusService],
  controllers: [MonitoringController],
  exports: [PrometheusService],
})
export class MonitoringModule {}