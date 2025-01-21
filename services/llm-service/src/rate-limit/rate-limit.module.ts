import { Module } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { RedisModule } from '../redis/redis.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [RedisModule, ConfigModule],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}