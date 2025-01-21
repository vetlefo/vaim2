# LLM Service Configuration Guide

## Overview

This guide details how to configure and customize the LLM service for different environments and use cases.

## Environment Variables

### Core Configuration

```env
# Server Configuration
PORT=3002                 # Service port
NODE_ENV=development     # Environment (development/production/test)
API_PREFIX=api/v1        # API route prefix
FRONTEND_URL=           # CORS allowed origin

# Provider Configuration
DEFAULT_LLM_PROVIDER=openrouter    # Default provider
DEFAULT_MODEL=deepseek/deepseek-r1 # Default model
```

### Provider API Keys

```env
# OpenRouter Configuration
OPENROUTER_API_KEY=     # OpenRouter API key
SITE_URL=               # Your site URL for OpenRouter
SITE_NAME=              # Your site name for OpenRouter

# Direct Provider Keys (Optional)
DEEPSEEK_API_KEY=       # Direct DeepSeek API key
```

### Redis Configuration

```env
# Redis Connection
REDIS_HOST=localhost    # Redis host
REDIS_PORT=6379        # Redis port
REDIS_PASSWORD=        # Redis password (optional)
REDIS_DB=0            # Redis database number
REDIS_CACHE_TTL=3600  # Cache TTL in seconds
```

### Performance Settings

```env
# Request Handling
MAX_CONCURRENT_REQUESTS=50  # Maximum concurrent requests
REQUEST_TIMEOUT=30000      # Request timeout in milliseconds
BATCH_SIZE=10             # Batch processing size

# Rate Limiting
RATE_LIMIT_TTL=60         # Rate limit window in seconds
RATE_LIMIT_MAX=100        # Maximum requests per window
```

### Monitoring Configuration

```env
# Metrics
METRICS_PORT=9464     # Prometheus metrics port
LOG_LEVEL=debug      # Logging level
LOG_FORMAT=json      # Log format (json/text)

# Cost Management
DAILY_COST_LIMIT=50  # Daily cost limit in USD
ALERT_THRESHOLD=45   # Cost alert threshold in USD
```

## Provider Configuration

### OpenRouter Setup

1. Sign up at [OpenRouter](https://openrouter.ai)
2. Create an API key
3. Set environment variables:
   ```env
   OPENROUTER_API_KEY=your-api-key
   SITE_URL=your-site-url
   SITE_NAME=your-site-name
   ```

### Direct Provider Setup

#### DeepSeek

1. Sign up at [DeepSeek](https://deepseek.ai)
2. Generate API key
3. Set environment variables:
   ```env
   DEEPSEEK_API_KEY=your-api-key
   DEEPSEEK_MODEL=deepseek-r1
   ```

## Cache Configuration

### Redis Setup

1. Install Redis
2. Configure connection:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=optional-password
   ```

### Cache Settings

```env
# Enable/Disable Cache
CACHE_ENABLED=true

# Cache TTL
REDIS_CACHE_TTL=3600  # 1 hour

# Cache Size Limits
CACHE_MAX_ITEMS=10000
CACHE_MAX_SIZE=100mb
```

## Security Configuration

### Rate Limiting

```env
# Rate Limiting
RATE_LIMIT_TTL=60        # Window size in seconds
RATE_LIMIT_MAX=100       # Max requests per window
RATE_LIMIT_STRATEGY=ip   # Rate limit strategy
```

### CORS Settings

```env
# CORS Configuration
CORS_ENABLED=true
CORS_CREDENTIALS=true
FRONTEND_URL=http://localhost:3000
```

## Monitoring Setup

### Prometheus Integration

1. Enable metrics:
   ```env
   METRICS_ENABLED=true
   METRICS_PORT=9464
   ```

2. Add Prometheus scrape config:
   ```yaml
   scrape_configs:
     - job_name: 'llm-service'
       static_configs:
         - targets: ['localhost:9464']
   ```

### Logging Configuration

```env
# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
LOG_FILE=logs/llm-service.log
```

## Development Configuration

### Local Development

```env
# Development Settings
NODE_ENV=development
PORT=3002
WS_PORT=3003
GRAPHQL_PLAYGROUND=true
GRAPHQL_DEBUG=true
```

### Testing Configuration

```env
# Test Settings
NODE_ENV=test
REDIS_DB=1
CACHE_ENABLED=false
MOCK_PROVIDERS=true
```

## Production Configuration

### Recommended Settings

```env
# Production Settings
NODE_ENV=production
PORT=3002
CACHE_ENABLED=true
GRAPHQL_PLAYGROUND=false
GRAPHQL_DEBUG=false
LOG_LEVEL=info
```

### Performance Tuning

```env
# Performance
MAX_CONCURRENT_REQUESTS=100
REQUEST_TIMEOUT=30000
BATCH_SIZE=20
CACHE_TTL=7200
```

## Docker Configuration

### Environment Files

1. Development: `.env.development`
2. Testing: `.env.test`
3. Production: `.env.production`

### Docker Compose Settings

```yaml
environment:
  NODE_ENV: production
  PORT: 3002
  REDIS_HOST: redis
  REDIS_PORT: 6379
```

## Troubleshooting

### Common Issues

1. Redis Connection:
   ```env
   REDIS_RETRY_STRATEGY=exponential
   REDIS_MAX_RETRIES=5
   ```

2. Provider Timeouts:
   ```env
   REQUEST_TIMEOUT=30000
   PROVIDER_MAX_RETRIES=3
   ```

3. Rate Limiting:
   ```env
   RATE_LIMIT_MAX=100
   RATE_LIMIT_TTL=60
   ```

## Best Practices

1. Use environment-specific configuration files
2. Never commit sensitive values
3. Implement proper rate limiting
4. Enable caching in production
5. Monitor resource usage
6. Regularly rotate logs
7. Set appropriate timeouts
8. Configure proper CORS settings