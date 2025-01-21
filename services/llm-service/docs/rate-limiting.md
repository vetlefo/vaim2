# Rate Limiting & Caching

This document describes the rate limiting and caching implementation for the LLM service.

## Rate Limiting

The service implements two levels of rate limiting:

1. Global Rate Limiting
   - Applies to all requests regardless of provider
   - Default: 100 requests per minute
   - Configurable via `RATE_LIMIT_WINDOW` and `RATE_LIMIT_MAX_REQUESTS`

2. Provider-Specific Rate Limiting
   - Separate limits for each LLM provider (OpenRouter, DeepSeek, etc.)
   - Default: 1000 requests per hour
   - Configurable via `RATE_LIMIT_PROVIDER_WINDOW` and `RATE_LIMIT_PROVIDER_MAX_REQUESTS`

### Configuration

```env
# Global rate limiting
RATE_LIMIT_WINDOW=60000        # Window in milliseconds (default: 1 minute)
RATE_LIMIT_MAX_REQUESTS=100    # Maximum requests per window

# Provider-specific rate limiting
RATE_LIMIT_PROVIDER_WINDOW=3600000    # Window in milliseconds (default: 1 hour)
RATE_LIMIT_PROVIDER_MAX_REQUESTS=1000 # Maximum requests per provider per window
```

### Implementation Details

- Uses Redis for distributed rate limiting
- Keys are structured as:
  - Global: `rate-limit:global:{userId}:{timestamp}`
  - Provider: `rate-limit:{provider}:{userId}:{timestamp}`
- Sliding window implementation with automatic cleanup of expired entries
- Returns remaining requests in response headers
- HTTP 429 (Too Many Requests) response when limit exceeded

## Caching

The service implements response caching for LLM completions:

### Configuration

```env
CACHE_TTL=3600              # Cache TTL in seconds (default: 1 hour)
CACHE_STREAMING_ENABLED=false # Whether to cache streaming responses
```

### Features

- Caches responses per provider and prompt
- Cache key format: `cache:{provider}:{base64_encoded_prompt}`
- Automatic cache invalidation after TTL
- Streaming responses can be optionally cached (disabled by default)
- Cache hits return HTTP 200 with `cached: true` flag

### Response Format

```json
{
  "statusCode": 200,
  "message": "Cached response",
  "data": {
    // Original response data
  },
  "cached": true
}
```

## Error Handling

Rate limit exceeded response:
```json
{
  "statusCode": 429,
  "message": "Global rate limit exceeded",
  "remainingRequests": 0
}
```

Provider-specific limit exceeded:
```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded for provider: openrouter",
  "remainingRequests": 0
}
```

## Testing

End-to-end tests are available in `test/rate-limit.e2e-spec.ts` covering:
- Global rate limiting
- Provider-specific rate limiting
- Caching behavior
- Streaming response handling

Run tests with:
```bash
npm run test:e2e
```

## Monitoring

Rate limiting metrics are available through the monitoring endpoints:
- `/metrics` - Prometheus metrics including rate limit hits and cache statistics
- `/health` - Health check including Redis connection status

## Best Practices

1. Use appropriate window sizes based on provider rate limits
2. Monitor rate limit metrics to adjust limits if needed
3. Consider implementing retry logic in clients with exponential backoff
4. Cache frequently requested prompts to reduce API usage
5. Use streaming mode for real-time responses where caching isn't critical