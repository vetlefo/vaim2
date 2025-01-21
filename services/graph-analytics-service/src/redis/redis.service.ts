import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: RedisClientType;

  constructor(private readonly configService: ConfigService) {
    this.client = createClient({
      socket: {
        host: this.configService.get<string>('REDIS_HOST'),
        port: this.configService.get<number>('REDIS_PORT'),
      },
      database: 0,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    // Connect to Redis
    this.client.connect().catch((err) => {
      console.error('Redis Connection Error:', err);
    });
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}