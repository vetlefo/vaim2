import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { LLMService } from './llm.service';
import {
  ChatMessageInput,
  CompletionOptionsInput,
  CompletionResponse,
  StreamCompletionResponse,
} from './dto/completion.dto';

interface SseMessageEvent {
  data: string;
  id?: string;
  type?: string;
  retry?: number;
}

@Controller('llm')
export class LLMController {
  constructor(private readonly llmService: LLMService) {}

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async complete(
    @Body('messages') messages: ChatMessageInput[],
    @Body('options') options?: CompletionOptionsInput,
  ): Promise<CompletionResponse> {
    return this.llmService.complete(messages, options);
  }

  @Sse('complete/stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  streamCompletion(
    @Query('messages') messagesJson: string,
    @Query('options') optionsJson?: string,
  ): Observable<SseMessageEvent> {
    const messages: ChatMessageInput[] = JSON.parse(messagesJson);
    const options: CompletionOptionsInput | undefined = optionsJson
      ? JSON.parse(optionsJson)
      : undefined;

    return new Observable<SseMessageEvent>(subscriber => {
      this.llmService.completeStream(messages, options)
        .then(async stream => {
          try {
            for await (const response of stream) {
              const data: StreamCompletionResponse = {
                text: response.text,
                metadata: response.metadata,
              };
              subscriber.next({
                data: JSON.stringify(data),
                type: 'message',
              });
            }

            // Signal completion
            subscriber.next({
              data: JSON.stringify({
                text: '[DONE]',
                metadata: {
                  model: options?.model || 'unknown',
                  provider: 'system',
                  latency: 0,
                  timestamp: new Date().toISOString(),
                },
              }),
              type: 'message',
            });
            subscriber.complete();
          } catch (error) {
            console.error('Stream error:', error);
            subscriber.next({
              data: JSON.stringify({
                text: '[ERROR]',
                metadata: {
                  error: error.message,
                  timestamp: new Date().toISOString(),
                },
              }),
              type: 'error',
            });
            subscriber.complete();
          }
        })
        .catch(error => {
          console.error('Stream initialization error:', error);
          subscriber.error(error);
        });
    });
  }

  @Get('providers')
  async listProviders(): Promise<string[]> {
    return this.llmService.listProviders();
  }

  @Get('providers/:provider/models')
  async listModels(
    @Param('provider') provider: string,
  ): Promise<string[]> {
    return this.llmService.listModels(provider);
  }

  @Get('health')
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    return this.llmService.healthCheck();
  }
}