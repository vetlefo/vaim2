# LLM Service

The LLM (Large Language Model) service provides a unified interface for accessing various LLM providers through both GraphQL and REST APIs. It supports multiple providers including OpenRouter for accessing a wide range of models, and direct provider integrations for specific use cases.

## Features

- Multiple LLM provider support
- GraphQL and REST APIs
- Real-time streaming responses
- Response caching
- Rate limiting
- Health monitoring
- Provider fallback
- Cost tracking
- Dynamic parameter optimization via OpenRouter Parameters API
- Model-specific parameter tuning
- Automatic parameter caching

## Prerequisites

- Node.js 18+
- Redis 6+
- OpenRouter API key
- (Optional) Direct provider API keys

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update environment variables
# Edit .env with your configuration
```

## Configuration

### Environment Variables

```env
# Server Configuration
PORT=3002
NODE_ENV=development
API_PREFIX=api/v1

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_CACHE_TTL=3600

# OpenRouter Configuration
OPENROUTER_API_KEY=your-api-key
SITE_URL=your-site-url
SITE_NAME=your-site-name

# Provider Configuration
DEFAULT_LLM_PROVIDER=openrouter
DEFAULT_MODEL=deepseek/deepseek-r1

# Optional Direct Provider Keys
DEEPSEEK_API_KEY=

# Performance
MAX_CONCURRENT_REQUESTS=50
REQUEST_TIMEOUT=30000
BATCH_SIZE=10
```

## Usage

### Starting the Service

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

### API Examples

#### GraphQL

```graphql
# Text Completion
query {
  complete(
    messages: [
      { role: "user", content: "What is the meaning of life?" }
    ],
    options: {
      model: "deepseek/deepseek-r1",
      temperature: 0.7
    }
  ) {
    text
    usage {
      promptTokens
      completionTokens
      totalTokens
    }
    metadata {
      model
      provider
      latency
      timestamp
    }
  }
}

# Streaming Completion
subscription {
  streamCompletion(streamId: "unique-id") {
    text
    metadata {
      model
      provider
      latency
      timestamp
    }
  }
}
```

#### REST

```bash
# Text Completion
curl -X POST http://localhost:3002/api/v1/llm/complete \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "What is the meaning of life?" }
    ],
    "options": {
      "model": "deepseek/deepseek-r1",
      "temperature": 0.7
    }
  }'

# Streaming Completion
curl -N http://localhost:3002/api/v1/llm/complete/stream \
  -H "Accept: text/event-stream" \
  -G \
  --data-urlencode 'messages=[{"role":"user","content":"What is the meaning of life?"}]'
```

### Available Models

- `deepseek/deepseek-r1` (default)
- `anthropic/claude-3.5-sonnet`

### Parameter Optimization

The service automatically fetches and uses optimal parameters for each model through the OpenRouter Parameters API:

```typescript
// Example optimal parameters response
{
  "temperature_p50": 0.7,
  "top_p_p50": 0.95,
  "frequency_penalty_p50": 0.1,
  "presence_penalty_p50": 0.1,
  "top_k_p50": 40,
  "repetition_penalty_p50": 1.1
}
```

Parameters are cached and automatically updated to ensure optimal performance.

## Development

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Docker

```bash
# Build image
docker build -t llm-service .

# Run container
docker run -p 3002:3002 llm-service
```

### Docker Compose

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down
```

## Health Checks

The service provides health check endpoints:

- `/health` - Overall service health
- `/health/live` - Liveness check
- `/health/ready` - Readiness check

## Monitoring

The service exposes metrics for Prometheus:

- Request counts and latencies
- Cache hit rates
- Token usage
- Provider availability
- Error rates
- Parameter optimization effectiveness

## Documentation

- [Architecture](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Provider Integration](docs/providers.md)
- [Configuration Guide](docs/configuration.md)
- [Implementation Details](docs/implementation.md)
- [Next Steps](docs/next-steps.md)
- [Rate Limiting](docs/rate-limiting.md)

## Related Documentation

- [Docker Setup](../../tools/docker.md)
- [CI/CD Pipeline](../../workflows/cicd.md)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is proprietary and confidential.