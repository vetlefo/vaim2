import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LLMService } from './llm.service';
import {
  ChatMessageInput,
  CompletionOptionsInput,
  CompletionResponse,
  StreamCompletionResponse,
} from './dto/completion.dto';

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
  async streamCompletion(
    @Query('messages') messagesJson: string,
    @Query('options') optionsJson?: string,
  ): Promise<Observable<MessageEvent>> {
    const messages: ChatMessageInput[] = JSON.parse(messagesJson);
    const options: CompletionOptionsInput | undefined = optionsJson
      ? JSON.parse(optionsJson)
      : undefined;

    const stream = await this.llmService.completeStream(messages, options);

    return new Observable<MessageEvent>((subscriber) => {
      (async () => {
        try {
          for await (const response of stream) {
            const data: StreamCompletionResponse = {
              text: response.text,
              metadata: response.metadata,
            };
            subscriber.next({
              data,
              type: 'completion',
            } as MessageEvent);
          }
          // Signal completion
          subscriber.next({
            data: {
              text: '[DONE]',
              metadata: {
                model: options?.model || 'unknown',
                provider: 'system',
                latency: 0,
                timestamp: new Date().toISOString(),
              },
            },
            type: 'completion',
          } as MessageEvent);
          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      })();
    }).pipe(
      map((event) => ({
        ...event,
        data: JSON.stringify(event.data),
      })),
    );
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