# Streaming Implementation

The LLM service implements Server-Sent Events (SSE) streaming for real-time LLM responses from OpenRouter. This document outlines how streaming is implemented across different components.

## Controller Implementation

The LLM controller (`src/llm/llm.controller.ts`) uses NestJS's `@Sse` decorator to handle streaming:

```typescript
@Sse('complete/stream')
@Header('Content-Type', 'text/event-stream')
streamCompletion(
  @Query('messages') messagesJson: string,
  @Query('options') optionsJson?: string,
): Observable<SseMessageEvent> {
  // Parse messages and options
  const messages = JSON.parse(messagesJson);
  const options = optionsJson ? JSON.parse(optionsJson) : undefined;

  // Create observable to handle streaming
  return new Observable<SseMessageEvent>(subscriber => {
    this.llmService.completeStream(messages, options)
      .then(async stream => {
        // Process each chunk from the stream
        for await (const response of stream) {
          subscriber.next({
            data: JSON.stringify({
              text: response.text,
              metadata: response.metadata
            }),
            type: 'message'
          });
        }

        // Signal completion
        subscriber.next({
          data: JSON.stringify({
            text: '[DONE]',
            metadata: {
              model: options?.model || 'unknown',
              provider: 'system',
              timestamp: new Date().toISOString()
            }
          }),
          type: 'message'
        });
        subscriber.complete();
      })
      .catch(error => subscriber.error(error));
  });
}
```

## OpenRouter Provider Implementation

The OpenRouter provider (`src/providers/implementations/openrouter.provider.ts`) handles streaming by:

1. Making a streaming request to OpenRouter's API
2. Processing the response stream
3. Yielding each chunk as it arrives

```typescript
async completeStream(
  messages: ChatMessage[],
  options?: LLMRequestOptions
): Promise<AsyncIterableIterator<LLMResponse>> {
  const requestBody = {
    messages,
    stream: true,
    // ... other options
  };

  const response = await this.client.post('/chat/completions', requestBody, {
    responseType: 'stream'
  });

  return Promise.resolve({
    async *[Symbol.asyncIterator]() {
      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          const data = JSON.parse(line.slice(6));
          if (data.choices?.[0]?.delta?.content) {
            yield {
              text: data.choices[0].delta.content,
              metadata: {
                model: options?.model,
                provider: 'openrouter',
                timestamp: new Date().toISOString()
              }
            };
          }
        }
      }
    }
  });
}
```

## Frontend Integration

The frontend implementation (`test-stream.html`) provides a rich interface for testing and using the streaming functionality:

### Basic Usage
```javascript
const eventSource = new EventSource('/api/v1/llm/complete/stream?messages=' + 
  encodeURIComponent(JSON.stringify(messages)));

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.text === '[DONE]') {
    eventSource.close();
    return;
  }
  // Handle streaming chunk
  console.log(data.text);
});
```

### Advanced Features

1. **Model Selection**
   - Supports multiple models (Claude, GPT-4, Gemini Pro, etc.)
   - Displays model capabilities (context window, strengths)
   - Automatically adjusts parameters based on model selection

2. **Structured Output**
   - JSON schema support for structured responses
   - Pre-defined schemas for common use cases (weather, analysis)
   - Schema validation and formatting
   ```javascript
   const options = {
     responseFormat: {
       type: "json_schema",
       schema: {
         type: "object",
         properties: {
           // Schema definition
         }
       }
     }
   };
   ```

3. **Connection Management**
   - Timeout handling (30-second default)
   - Connection status monitoring
   - Automatic cleanup on page unload
   ```javascript
   // Timeout handling
   const timeout = setTimeout(() => {
     if (eventSource.readyState !== 2) {
       eventSource.close();
     }
   }, 30000);

   // Connection status
   eventSource.addEventListener('open', () => {
     console.log('Connection established');
   });
   ```

## Error Handling

The implementation includes comprehensive error handling across all layers:

1. **Network Layer**
   - Connection failures
   - Timeout handling
   - Retry logic with exponential backoff

2. **Protocol Layer**
   - Malformed SSE data
   - JSON parsing errors
   - Invalid stream format

3. **Application Layer**
   - OpenRouter API errors
   - Rate limiting
   - Context length exceeded
   - Authentication failures

4. **Client Layer**
   - Connection cleanup
   - Resource management
   - State synchronization

Errors are properly propagated with appropriate error types and messages:
```javascript
eventSource.addEventListener('error', (error) => {
  const errorMessage = error.data ? JSON.parse(error.data).error : 'Unknown error';
  
  // Handle specific error types
  if (errorMessage.includes('rate limit')) {
    console.error('Rate limit exceeded');
  } else if (errorMessage.includes('context length')) {
    console.error('Input too long for model');
  }
  
  eventSource.close();
});