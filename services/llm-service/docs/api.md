# LLM Service API Documentation

## Overview

The LLM Service provides a unified interface for interacting with various language model providers, with OpenRouter as the primary integration. The service supports both REST and GraphQL endpoints, with features including streaming responses, caching, and comprehensive error handling.

## REST Endpoints

### POST /llm/complete

Generates a completion for the given messages.

#### Request

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Your message here"
    }
  ],
  "model": "deepseek/deepseek-r1", // Optional, defaults to configured default model
  "temperature": 0.7, // Optional, defaults to 0.7
  "maxTokens": 4096, // Optional, defaults to 4096
  "topP": 1.0, // Optional, defaults to 1.0
  "frequencyPenalty": 0.0, // Optional
  "presencePenalty": 0.0, // Optional
  "stop": [] // Optional, array of stop sequences
}
```

#### Response

```json
{
  "text": "Generated response text",
  "usage": {
    "promptTokens": 10,
    "completionTokens": 20,
    "totalTokens": 30
  },
  "metadata": {
    "provider": "openrouter",
    "model": "deepseek/deepseek-r1",
    "latency": 1234,
    "timestamp": "2025-01-21T18:30:00.000Z",
    "cached": false
  }
}
```

### POST /llm/complete/stream

Streams the completion response as it's generated.

#### Request
Same as /llm/complete

#### Response
Server-Sent Events stream with the following event format:

```json
{
  "text": "Partial response text",
  "metadata": {
    "provider": "openrouter",
    "model": "deepseek/deepseek-r1",
    "latency": 1234,
    "timestamp": "2025-01-21T18:30:00.000Z"
  }
}
```

### GET /llm/health

Returns the health status of the service and its dependencies.

#### Response

```json
{
  "status": "ok",
  "providers": {
    "openrouter": true,
    "openrouterOpenAI": true
  },
  "redis": true
}
```

## GraphQL API

### Queries

#### complete

```graphql
query {
  complete(input: {
    messages: [{ role: String!, content: String! }!]!
    model: String
    temperature: Float
    maxTokens: Int
    topP: Float
    frequencyPenalty: Float
    presencePenalty: Float
    stop: [String!]
  }) {
    text
    usage {
      promptTokens
      completionTokens
      totalTokens
    }
    metadata {
      provider
      model
      latency
      timestamp
      cached
    }
  }
}
```

### Subscriptions

#### completionStream

```graphql
subscription {
  completionStream(input: {
    messages: [{ role: String!, content: String! }!]!
    model: String
    temperature: Float
    maxTokens: Int
    topP: Float
    frequencyPenalty: Float
    presencePenalty: Float
    stop: [String!]
  }) {
    text
    metadata {
      provider
      model
      latency
      timestamp
    }
  }
}
```

## Error Handling

The service returns standardized error responses with the following structure:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Error type"
}
```

### Error Types

- `PROVIDER_ERROR`: Issues with the LLM provider (e.g., invalid API key)
- `RATE_LIMIT`: Rate limit exceeded
- `CONTEXT_LENGTH`: Input exceeds model's maximum context length
- `TIMEOUT`: Request timed out
- `MODEL_NOT_FOUND`: Requested model not available
- `INVALID_REQUEST`: Invalid request parameters
- `UNKNOWN`: Unexpected errors

### HTTP Status Codes

- 200: Successful request
- 201: Successful creation/completion
- 400: Invalid request
- 401: Authentication error
- 429: Rate limit exceeded
- 500: Server error

## Caching

The service implements Redis-based caching for completion requests:

- Cache key: Generated from the request parameters (messages, model, temperature, etc.)
- TTL: Configurable via REDIS_CACHE_TTL environment variable
- Cache bypass: Set CACHE_ENABLED=false in environment variables

Cached responses include `metadata.cached: true` to indicate a cache hit.