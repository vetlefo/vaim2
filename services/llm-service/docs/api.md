# LLM Service API Documentation

## Overview

The LLM service provides both REST and GraphQL APIs for accessing various LLM providers. This document details the available endpoints, their request/response formats, and usage examples.

## REST API

Base URL: `/api/v1/llm`

### Text Completion

#### POST `/complete`

Generate text completion from LLM models.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is the meaning of life?"
    }
  ],
  "options": {
    "model": "deepseek/deepseek-r1",
    "temperature": 0.7,
    "maxTokens": 4096,
    "topP": 1,
    "frequencyPenalty": 0,
    "presencePenalty": 0,
    "stop": ["###"]
  }
}
```

**Response:**
```json
{
  "text": "The meaning of life is...",
  "usage": {
    "promptTokens": 10,
    "completionTokens": 50,
    "totalTokens": 60
  },
  "metadata": {
    "model": "deepseek/deepseek-r1",
    "provider": "openrouter",
    "latency": 1234,
    "timestamp": "2025-01-21T17:47:00.000Z"
  }
}
```

### Streaming Completion

#### GET `/complete/stream`

Stream text completion responses in real-time using Server-Sent Events (SSE).

**Request Query Parameters:**
- `messages`: URL-encoded JSON array of messages
- `options`: URL-encoded JSON object of options

**Response Events:**
```json
{
  "text": "The ",
  "metadata": {
    "model": "deepseek/deepseek-r1",
    "provider": "openrouter",
    "latency": 100,
    "timestamp": "2025-01-21T17:47:00.000Z"
  }
}
```

### Provider Management

#### GET `/providers`

List available LLM providers.

**Response:**
```json
[
  "openrouter",
  "deepseek"
]
```

#### GET `/providers/:provider/models`

List available models for a specific provider.

**Response:**
```json
[
  "deepseek/deepseek-r1",
  "deepseek/deepseek-chat",
  "anthropic/claude-3-sonnet"
]
```

### Health Check

#### GET `/health`

Check service health status.

**Response:**
```json
{
  "status": "ok",
  "providers": {
    "openrouter": true,
    "deepseek": true
  },
  "redis": {
    "status": "up"
  }
}
```

## GraphQL API

Endpoint: `/graphql`

### Queries

#### complete

Generate text completion.

```graphql
query {
  complete(
    messages: [
      { role: "user", content: "What is the meaning of life?" }
    ],
    options: {
      model: "deepseek/deepseek-r1",
      temperature: 0.7,
      maxTokens: 4096
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
```

#### listProviders

List available providers.

```graphql
query {
  listProviders
}
```

#### listModels

List available models for a provider.

```graphql
query {
  listModels(provider: "openrouter")
}
```

### Subscriptions

#### streamCompletion

Subscribe to streaming completion responses.

```graphql
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

## WebSocket Protocol

The service uses the GraphQL over WebSocket Protocol for real-time streaming.

### Connection Initialization

```json
{
  "type": "connection_init"
}
```

### Start Stream

```json
{
  "id": "1",
  "type": "start",
  "payload": {
    "query": "subscription { streamCompletion(streamId: \"unique-id\") { text metadata { model provider latency timestamp } } }"
  }
}
```

### Stream Data

```json
{
  "type": "data",
  "payload": {
    "data": {
      "streamCompletion": {
        "text": "The ",
        "metadata": {
          "model": "deepseek/deepseek-r1",
          "provider": "openrouter",
          "latency": 100,
          "timestamp": "2025-01-21T17:47:00.000Z"
        }
      }
    }
  }
}
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "type": "PROVIDER_ERROR",
    "message": "Error description",
    "provider": "openrouter",
    "details": {}
  }
}
```

### Error Types

- `PROVIDER_ERROR`: Provider-specific errors
- `RATE_LIMIT`: Rate limiting errors
- `CONTEXT_LENGTH`: Maximum context length exceeded
- `INVALID_REQUEST`: Invalid request parameters
- `TIMEOUT`: Request timeout
- `MODEL_NOT_FOUND`: Requested model not found
- `UNKNOWN`: Unknown errors

## Rate Limiting

- Default: 100 requests per minute
- Headers:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in window
  - `X-RateLimit-Reset`: Time until window reset

## Best Practices

1. Use streaming for long responses
2. Implement proper error handling
3. Monitor rate limits
4. Cache responses when possible
5. Use appropriate temperature settings
6. Set reasonable token limits
7. Include timeout handling
8. Monitor usage metrics