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
  ): Promise<AsyncIterableIterator<MessageEvent>> {
    const messages: ChatMessageInput[] = JSON.parse(messagesJson);
    const options: CompletionOptionsInput | undefined = optionsJson
      ? JSON.parse(optionsJson)
      : undefined;

    const stream = await this.llmService.completeStream(messages, options);

    return this.createMessageEventStream(stream, options);
  }

  private async *createMessageEventStream(
    stream: AsyncIterableIterator<StreamCompletionResponse>,
    options?: CompletionOptionsInput,
  ): AsyncIterableIterator<MessageEvent> {
    try {
      for await (const response of stream) {
        const data: StreamCompletionResponse = {
          text: response.text,
          metadata: response.metadata,
        };
        yield {
          data: JSON.stringify(data),
          type: 'completion',
        } as MessageEvent;
      }

      // Signal completion
      yield {
        data: JSON.stringify({
          text: '[DONE]',
          metadata: {
            model: options?.model || 'unknown',
            provider: 'system',
            latency: 0,
            timestamp: new Date().toISOString(),
          },
        }),
        type: 'completion',
      } as MessageEvent;
    } catch (error) {
      throw error;
    }
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