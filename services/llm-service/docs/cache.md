# LLM Service Cache System

## Overview

The LLM service implements a robust Redis-based caching system for optimizing response times and reducing API costs. This document details the caching implementation and strategies.

## Features

### Response Caching
- Caches LLM responses based on input prompts
- Configurable TTL (Time To Live) for cached responses
- Base64 encoded cache keys for handling complex prompts
- Streaming response handling (disabled by default)

### Cache Operations
- Get/Set operations with TTL support
- Automatic cache invalidation
- Cache existence checking
- Key pattern matching for maintenance

### Configuration
```env
CACHE_TTL=3600           # Cache TTL in seconds (default: 1 hour)
CACHE_STREAMING_ENABLED=false  # Enable/disable streaming response caching
```

## Implementation Details

### Cache Key Generation
```typescript
async getCacheKey(prompt: string, provider: string): Promise<string> {
  return `cache:${provider}:${Buffer.from(prompt).toString('base64')}`;
}
```

### Response Caching
```typescript
async cacheResponse(prompt: string, provider: string, response: string): Promise<void> {
  const key = await this.getCacheKey(prompt, provider);
  const ttl = this.configService.get<number>('CACHE_TTL', 3600);
  await this.redisService.set(key, response, ttl);
}
```

### Cache Retrieval
```typescript
async getCachedResponse(prompt: string, provider: string): Promise<string | null> {
  const key = await this.getCacheKey(prompt, provider);
  return this.redisService.get(key);
}
```

## Best Practices

1. Cache Invalidation
   - Automatic TTL-based invalidation
   - Manual invalidation for outdated responses
   - Regular cache cleanup for maintenance

2. Memory Management
   - Configurable TTL to prevent cache bloat
   - Key pattern-based cleanup
   - Monitoring of cache size

3. Error Handling
   - Graceful fallback on cache failures
   - Error logging and monitoring
   - Automatic retry mechanisms

## Monitoring

The cache system includes monitoring capabilities:
- Cache hit/miss tracking
- Memory usage monitoring
- Error rate tracking
- Performance metrics

## Future Enhancements

1. Advanced Caching Strategies
   - Implement LRU (Least Recently Used) eviction
   - Add cache warming mechanisms
   - Implement cache preloading for common queries

2. Performance Optimizations
   - Add cache compression
   - Implement batch operations
   - Add cache statistics collection

3. Monitoring Improvements
   - Add detailed cache analytics
   - Implement cache performance dashboards
   - Add automatic cache optimization