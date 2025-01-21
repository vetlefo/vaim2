import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisModule } from '../redis/redis.module';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [
    TerminusModule,
    RedisModule,
    LLMModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}