import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB, 10),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return 1;
        }
      },
    });
  }

  async onModuleInit() {
    try {
      await this.redisClient.ping();
      console.log('Redis client connected');
    } catch (error) {
      console.error('Redis client connection error:', error);
    }
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  getClient() {
    return this.redisClient;
  }
}