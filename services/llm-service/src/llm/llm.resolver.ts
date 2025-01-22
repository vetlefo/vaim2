import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { LLMService } from './llm.service';
import {
  ChatMessageInput,
  CompletionOptionsInput,
  CompletionResponse,
  StreamCompletionResponse,
} from './dto/completion.dto';

@Resolver()
export class LLMResolver {
  constructor(private readonly llmService: LLMService) {}

  @Query(() => CompletionResponse)
  async complete(
    @Args('messages', { type: () => [ChatMessageInput] }) messages: ChatMessageInput[],
    @Args('options', { nullable: true }) options?: CompletionOptionsInput,
  ): Promise<CompletionResponse> {
    return this.llmService.complete(messages, options);
  }

  @Subscription(() => StreamCompletionResponse)
  async *streamCompletion(
    @Args('messages', { type: () => [ChatMessageInput] }) messages: ChatMessageInput[],
    @Args('options', { nullable: true }) options?: CompletionOptionsInput,
  ): AsyncIterableIterator<StreamCompletionResponse> {
    const stream = await this.llmService.completeStream(messages, options);

    try {
      for await (const response of stream) {
        yield {
          text: response.text,
          metadata: response.metadata,
        };
      }

      // Signal completion
      yield {
        text: '[DONE]',
        metadata: {
          model: options?.model || 'unknown',
          provider: 'system',
          latency: 0,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      yield {
        text: `Error: ${error.message}`,
        metadata: {
          model: options?.model || 'unknown',
          provider: 'error',
          latency: 0,
          timestamp: new Date().toISOString(),
        },
      };
      throw error;
    }
  }

  @Query(() => [String])
  async listProviders(): Promise<string[]> {
    return this.llmService.listProviders();
  }

  @Query(() => [String])
  async listModels(
    @Args('provider') provider: string,
  ): Promise<string[]> {
    return this.llmService.listModels(provider);
  }

  @Query(() => Boolean)
  async healthCheck(): Promise<boolean> {
    const results = await this.llmService.healthCheck();
    return Object.values(results).some(healthy => healthy);
  }

}