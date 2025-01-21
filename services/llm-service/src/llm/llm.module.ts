import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { LLMResolver } from './llm.resolver';
import { LLMController } from './llm.controller';
import { LLMProviderFactory } from '../providers/provider.factory';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [
    LLMService,
    LLMResolver,
    LLMProviderFactory,
  ],
  controllers: [LLMController],
  exports: [LLMService],
})
export class LLMModule {}