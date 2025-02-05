# Redis Connection Configuration

## Docker Compose Configuration

To resolve the Redis connection issue, the following changes are necessary in the `docker-compose.yml` file:

1. **Ensure Consistent Service Names**:
   - The Redis service name should be consistent across the Docker Compose file and environment variables.

2. **Update Redis Port Mapping**:
   - Ensure the Redis container port mapping is consistent with the environment variables.

3. **Adjust Healthchecks**:
   - Ensure healthchecks are properly configured to wait for Redis to be fully ready before starting dependent services.

### Updated `docker-compose.yml`

```yaml
services:
  llm-service:
    build:
      context: .
      target: production
    container_name: llm-service
    ports:
      - "3003:3003"  # API
      - "9464:9464"  # Metrics
      - "3004:3004"  # WebSocket
    environment:
      - NODE_ENV=development
      - PORT=3003
      - WS_PORT=3004
      - REDIS_HOST=redis  # Ensure this matches the service name
      - REDIS_PORT=6379
      - REDIS_PASSWORD=
      - REDIS_DB=0
      - JWT_SECRET=your-jwt-secret
      - DEFAULT_LLM_PROVIDER=openrouter
      - OPENROUTER_API_KEY=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
      - OPENROUTER_MODEL=claude-3-sonnet
      - OPENROUTER_MAX_TOKENS=4096
      - OPENROUTER_TEMPERATURE=0.7
    depends_on:
      - redis
    networks:
      - llm-network
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3003/api/v1/monitoring/health || exit 1"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 30s

  redis:
    image: redis:7-alpine
    container_name: redis  # Ensure this matches the service name
    ports:
      - "6381:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    networks:
      - llm-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 10s

  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: llm-redis-commander
    ports:
      - "8081:8081"
    environment:
      - REDIS_HOSTS=local:redis:6379
    depends_on:
      - redis
    networks:
      - llm-network

networks:
  llm-network:
    driver: bridge

volumes:
  redis-data:
    driver: local
```

## Environment Variable Configuration

Ensure the `.env` file has the correct environment variables:

### Updated `.env`

```env
# Server Configuration
PORT=3003
NODE_ENV=development
API_PREFIX=api/v1

# Redis Configuration
REDIS_HOST=redis  # Ensure this matches the service name
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_CACHE_TTL=3600

# GraphQL Configuration
GRAPHQL_DEBUG=true
GRAPHQL_PLAYGROUND=true
GRAPHQL_INTROSPECTION=true

# LLM Provider Configuration
DEFAULT_LLM_PROVIDER=openrouter

# OpenRouter Configuration
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=deepseek/deepseek-r1-distill-llama-70b
OPENROUTER_MAX_TOKENS=128000
OPENROUTER_TEMPERATURE=0.6

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Security
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=15m

# Neo4j Integration
NEO4J_URI=bolt://auth-neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password123

# Monitoring
PROMETHEUS_ENABLED=true
METRICS_PORT=9464

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# WebSocket
WS_PORT=3004

# Cache Configuration
CACHE_ENABLED=true
CACHE_TTL=3600
MAX_CACHE_SIZE=1000

# Cost Management
COST_TRACKING_ENABLED=true
DAILY_COST_LIMIT=50
ALERT_THRESHOLD=45

# Performance
MAX_CONCURRENT_REQUESTS=50
REQUEST_TIMEOUT=30000
BATCH_SIZE=10
```

## NestJS RedisService Configuration

Ensure the NestJS RedisService configuration handles retries and timeouts properly:

### Updated `RedisService`

```typescript
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
```

## Troubleshooting Tips

1. **Verify Docker Network**:
   - Use `docker network inspect llm-network` to ensure all services are on the same network.

2. **Test DNS Resolution**:
   - Use `docker exec -it llm-service sh` to enter the llm-service container and run `ping redis` to test DNS resolution.

3. **Check Redis Logs**:
   - Use `docker logs redis` to check for any startup errors in the Redis container.

4. **Adjust Healthchecks**:
   - Ensure healthchecks are properly configured to wait for Redis to be fully ready before starting dependent services.

By following these steps, you should be able to resolve the Redis connection issues and ensure your NestJS application successfully connects to Redis.