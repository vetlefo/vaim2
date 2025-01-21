# LLM Service Architecture

## Overview

The LLM Service is designed with a modular architecture that separates concerns and enables easy extension with new providers. The service integrates with OpenRouter as the primary LLM provider, with support for both direct API calls and OpenAI SDK integration.

## Core Components

```mermaid
graph TD
    A[API Layer] --> B[LLM Service]
    B --> C[Provider Factory]
    C --> D[OpenRouter Provider]
    C --> E[OpenRouter OpenAI Provider]
    B --> F[Redis Cache]
    A --> G[GraphQL Resolvers]
    G --> B
```

### API Layer
- REST endpoints for completions and health checks
- GraphQL resolvers for queries and subscriptions
- Request validation and error handling
- Response formatting

### LLM Service
- Core business logic
- Provider selection and management
- Caching strategy
- Error handling and retries
- Request/response transformation

### Provider Factory
- Provider instantiation and configuration
- Provider health checks
- Model mapping and validation
- Fallback handling

### Redis Cache
- Response caching
- Cache invalidation
- TTL management
- Health monitoring

## Test Infrastructure

```mermaid
graph TD
    A[Test Runner] --> B[Unit Tests]
    A --> C[Integration Tests]
    A --> D[E2E Tests]
    C --> E[Mock OpenRouter API]
    C --> F[Redis Test Instance]
    D --> E
    D --> F
    E --> G[Rate Limiter]
    E --> H[Error Simulator]
    E --> I[Stream Handler]
```

### Mock OpenRouter API
- Simulates OpenRouter API responses
- Implements rate limiting
- Handles streaming responses
- Simulates various error conditions
- Configurable latency and timeouts

### Test Containers
- Redis test instance
- Mock OpenRouter API service
- Isolated test network
- Health checks and readiness probes

### Test Coverage
- Unit tests: Provider implementations, service logic
- Integration tests: Redis caching, provider integration
- E2E tests: API endpoints, GraphQL resolvers

## Data Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Cache
    participant Service
    participant Provider
    
    Client->>API: Request completion
    API->>Cache: Check cache
    alt Cache hit
        Cache-->>API: Return cached response
        API-->>Client: Return response
    else Cache miss
        Cache-->>Service: No cache entry
        Service->>Provider: Request completion
        Provider-->>Service: Return completion
        Service->>Cache: Store response
        Service-->>API: Return response
        API-->>Client: Return response
    end
```

## Error Handling

```mermaid
graph TD
    A[Error Occurs] --> B{Error Type}
    B -->|Provider Error| C[Retry with Backoff]
    B -->|Rate Limit| D[Queue Request]
    B -->|Context Length| E[Return Error]
    B -->|Timeout| F[Retry with Timeout]
    C --> G{Max Retries?}
    G -->|Yes| H[Return Error]
    G -->|No| I[Retry Request]
```

### Error Types
- Provider errors: Authentication, availability
- Rate limiting: Per-provider and global limits
- Context length: Model-specific limits
- Timeouts: Network and provider timeouts
- Validation: Request parameter validation

## Caching Strategy

```mermaid
graph TD
    A[Request] --> B{Cache Enabled?}
    B -->|Yes| C{Cache Entry Exists?}
    B -->|No| D[Forward Request]
    C -->|Yes| E[Return Cached]
    C -->|No| F[Forward Request]
    F --> G[Cache Response]
    G --> H[Return Response]
```

### Cache Implementation
- Redis as primary cache store
- Configurable TTL per response
- Cache key generation based on request parameters
- Cache invalidation on error
- Cache bypass for streaming requests

## Provider Implementation

```mermaid
graph TD
    A[Provider Factory] --> B[Base Provider Interface]
    B --> C[OpenRouter Direct]
    B --> D[OpenRouter OpenAI]
    C --> E[Axios Client]
    D --> F[OpenAI SDK]
    E --> G[Error Handling]
    F --> G
    G --> H[Response Mapping]
```

### Provider Interface
- Standard methods for all providers
- Error handling and retries
- Response transformation
- Health checks
- Configuration validation

## Testing Architecture

```mermaid
graph TD
    A[Test Suite] --> B[Unit Tests]
    A --> C[Integration Tests]
    A --> D[E2E Tests]
    B --> E[Jest]
    C --> F[Docker Compose]
    D --> F
    F --> G[Mock API]
    F --> H[Redis]
    G --> I[Rate Limiter]
    G --> J[Error Simulator]
```

### Test Components
- Mock OpenRouter API for integration testing
- Redis instance for cache testing
- Docker Compose for test environment
- Jest for test execution
- Supertest for HTTP testing

## Monitoring and Health Checks

```mermaid
graph TD
    A[Health Check] --> B[Provider Status]
    A --> C[Redis Status]
    A --> D[API Status]
    B --> E[Aggregate Status]
    C --> E
    D --> E
    E --> F[Health Endpoint]
```

### Health Monitoring
- Provider availability checks
- Redis connection status
- API endpoint health
- Response time monitoring
- Error rate tracking