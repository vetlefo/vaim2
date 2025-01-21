import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { LLMService } from './llm.service';
import {
  ChatMessageInput,
  CompletionOptionsInput,
  CompletionResponse,
  StreamCompletionResponse,
} from './dto/completion.dto';

const pubSub = new PubSub();

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

  @Mutation(() => Boolean)
  async startStreamCompletion(
    @Args('messages', { type: () => [ChatMessageInput] }) messages: ChatMessageInput[],
    @Args('options', { nullable: true }) options?: CompletionOptionsInput,
  ): Promise<boolean> {
    const streamId = `stream:${Date.now()}`;

    // Start streaming in background
    this.handleStreamCompletion(streamId, messages, options).catch((error) => {
      pubSub.publish(streamId, {
        streamCompletion: {
          text: `Error: ${error.message}`,
          metadata: {
            model: options?.model || 'unknown',
            provider: 'error',
            latency: 0,
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    return true;
  }

  @Subscription(() => StreamCompletionResponse, {
    filter: (payload, variables) => {
      return payload.streamId === variables.streamId;
    },
    resolve: (payload) => payload.streamCompletion,
  })
  streamCompletion(
    @Args('streamId') streamId: string,
  ) {
    return pubSub.asyncIterator(streamId);
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

  private async handleStreamCompletion(
    streamId: string,
    messages: ChatMessageInput[],
    options?: CompletionOptionsInput,
  ): Promise<void> {
    const stream = await this.llmService.completeStream(messages, options);

    for await (const response of stream) {
      pubSub.publish(streamId, {
        streamId,
        streamCompletion: {
          text: response.text,
          metadata: response.metadata,
        },
      });
    }

    // Signal completion
    pubSub.publish(streamId, {
      streamId,
      streamCompletion: {
        text: '[DONE]',
        metadata: {
          model: options?.model || 'unknown',
          provider: 'system',
          latency: 0,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }
}