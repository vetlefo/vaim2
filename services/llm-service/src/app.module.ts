import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { APP_GUARD } from '@nestjs/core';
import { LLMModule } from './llm/llm.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['.env', '.env.local'],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: process.env.NODE_ENV !== 'production',
      subscriptions: {
        'graphql-ws': true,
      },
    }),
    RedisModule,
    RateLimitModule,
    LLMModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}