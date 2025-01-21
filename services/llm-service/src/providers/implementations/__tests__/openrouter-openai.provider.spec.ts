import { Test } from '@nestjs/testing';
import OpenAI from 'openai';
import OpenRouterOpenAIProvider from '../openrouter-openai.provider';
import { 
  LLMError, 
  LLMErrorType, 
  OpenRouterConfig,
  ChatMessage 
} from '@app/interfaces/provider.interface';

jest.mock('openai');

describe('OpenRouterOpenAIProvider', () => {
  let provider: OpenRouterOpenAIProvider;
  const mockConfig: OpenRouterConfig = {
    apiKey: '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',
    defaultModel: 'deepseek/deepseek-r1',
    siteUrl: 'http://test.com',
    siteName: 'Test Site',
    maxRetries: 1,
    timeout: 5000,
  };

  const mockOpenAIClient = {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
    models: {
      list: jest.fn(),
    },
  };

  beforeEach(() => {
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAIClient as any);
    provider = new OpenRouterOpenAIProvider(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully when health check passes', async () => {
      mockOpenAIClient.models.list.mockResolvedValue({ data: [] });

      await expect(provider.initialize()).resolves.not.toThrow();
      expect(mockOpenAIClient.models.list).toHaveBeenCalled();
    });

    it('should throw error when health check fails', async () => {
      mockOpenAIClient.models.list.mockRejectedValue(new Error('Health check failed'));

      await expect(provider.initialize()).rejects.toThrow(LLMError);
      expect(mockOpenAIClient.models.list).toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    const mockMessages: ChatMessage[] = [{ role: 'user', content: 'test message' }];
    const mockResponse = {
      choices: [{ message: { content: 'test response' } }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    };

    it('should complete messages successfully', async () => {
      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await provider.complete(mockMessages);

      expect(result.text).toBe('test response');
      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
      expect(result.metadata.provider).toBe('openrouter');
      expect(result.metadata.model).toBe('deepseek/deepseek-r1');
    });

    it('should handle rate limit errors', async () => {
      const mockError = new OpenAI.APIError(429, {
        message: 'Rate limit exceeded',
        type: 'rate_limit_error',
      }, 'Rate limit exceeded', {});
      mockOpenAIClient.chat.completions.create.mockRejectedValue(mockError);

      await expect(provider.complete(mockMessages)).rejects.toThrow(
        new LLMError(LLMErrorType.RATE_LIMIT, 'Rate limit exceeded', 'openrouter')
      );
    });

    it('should handle context length errors', async () => {
      const mockError = new OpenAI.APIError(400, {
        message: 'context length exceeded',
        type: 'invalid_request_error',
      }, 'context length exceeded', {});
      mockOpenAIClient.chat.completions.create.mockRejectedValue(mockError);

      await expect(provider.complete(mockMessages)).rejects.toThrow(
        new LLMError(LLMErrorType.CONTEXT_LENGTH, 'Maximum context length exceeded', 'openrouter')
      );
    });
  });

  describe('completeStream', () => {
    const mockMessages: ChatMessage[] = [{ role: 'user', content: 'test message' }];
    const mockChunk = {
      choices: [{ delta: { content: 'test' } }],
    };

    it('should handle streaming responses', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield mockChunk;
        },
      };
      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockStream);

      const stream = await provider.completeStream(mockMessages);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks[0].text).toBe('test');
      expect(chunks[0].metadata.provider).toBe('openrouter');
    });

    it('should handle streaming errors', async () => {
      const mockError = new OpenAI.APIError(500, {
        message: 'Stream error',
        type: 'server_error',
      }, 'Stream error', {});
      mockOpenAIClient.chat.completions.create.mockRejectedValue(mockError);

      await expect(provider.completeStream(mockMessages)).rejects.toThrow();
    });
  });

  describe('healthCheck', () => {
    it('should return true when models endpoint is accessible', async () => {
      mockOpenAIClient.models.list.mockResolvedValue({ data: [] });

      const result = await provider.healthCheck();
      expect(result).toBe(true);
      expect(mockOpenAIClient.models.list).toHaveBeenCalled();
    });

    it('should return false when models endpoint is not accessible', async () => {
      mockOpenAIClient.models.list.mockRejectedValue(new Error('Health check failed'));

      const result = await provider.healthCheck();
      expect(result).toBe(false);
      expect(mockOpenAIClient.models.list).toHaveBeenCalled();
    });
  });
});