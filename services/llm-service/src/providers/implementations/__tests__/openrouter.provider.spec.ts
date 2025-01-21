import { Test } from '@nestjs/testing';
import axios from 'axios';
import OpenRouterProvider from '../openrouter.provider';
import { 
  LLMError, 
  LLMErrorType, 
  OpenRouterConfig,
  ChatMessage 
} from '@app/interfaces/provider.interface';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OpenRouterProvider', () => {
  let provider: OpenRouterProvider;
  const mockConfig: OpenRouterConfig = {
    apiKey: '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',
    defaultModel: 'deepseek/deepseek-r1',
    siteUrl: 'http://test.com',
    siteName: 'Test Site',
    maxRetries: 1,
    timeout: 5000,
  };

  beforeEach(() => {
    mockedAxios.create.mockReturnValue({
      post: jest.fn(),
      get: jest.fn(),
    } as any);
    provider = new OpenRouterProvider(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully when health check passes', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { models: [] } });
      mockedAxios.create.mockReturnValue({ get: mockGet } as any);

      await expect(provider.initialize()).resolves.not.toThrow();
      expect(mockGet).toHaveBeenCalledWith('/models');
    });

    it('should throw error when health check fails', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Health check failed'));
      mockedAxios.create.mockReturnValue({ get: mockGet } as any);

      await expect(provider.initialize()).rejects.toThrow(LLMError);
      expect(mockGet).toHaveBeenCalledWith('/models');
    });
  });

  describe('complete', () => {
    const mockMessages: ChatMessage[] = [{ role: 'user', content: 'test message' }];
    const mockResponse = {
      data: {
        choices: [{ message: { content: 'test response' } }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      },
    };

    it('should complete messages successfully', async () => {
      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      mockedAxios.create.mockReturnValue({ post: mockPost } as any);

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
      const mockError = {
        response: {
          status: 429,
          data: { error: { message: 'Rate limit exceeded' } },
        },
      };
      const mockPost = jest.fn().mockRejectedValue(mockError);
      mockedAxios.create.mockReturnValue({ post: mockPost } as any);

      await expect(provider.complete(mockMessages)).rejects.toThrow(
        new LLMError(LLMErrorType.RATE_LIMIT, 'Rate limit exceeded', 'openrouter')
      );
    });

    it('should handle context length errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { error: { message: 'context length exceeded' } },
        },
      };
      const mockPost = jest.fn().mockRejectedValue(mockError);
      mockedAxios.create.mockReturnValue({ post: mockPost } as any);

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
          yield Buffer.from(JSON.stringify(mockChunk));
        },
      };

      const mockPost = jest.fn().mockResolvedValue({ data: mockStream });
      mockedAxios.create.mockReturnValue({ post: mockPost } as any);

      const stream = await provider.completeStream(mockMessages);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks[0].text).toBe('test');
      expect(chunks[0].metadata.provider).toBe('openrouter');
    });

    it('should handle streaming errors', async () => {
      const mockError = new Error('Stream error');
      const mockPost = jest.fn().mockRejectedValue(mockError);
      mockedAxios.create.mockReturnValue({ post: mockPost } as any);

      await expect(provider.completeStream(mockMessages)).rejects.toThrow();
    });
  });

  describe('healthCheck', () => {
    it('should return true when models endpoint is accessible', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { models: [] } });
      mockedAxios.create.mockReturnValue({ get: mockGet } as any);

      const result = await provider.healthCheck();
      expect(result).toBe(true);
      expect(mockGet).toHaveBeenCalledWith('/models');
    });

    it('should return false when models endpoint is not accessible', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Health check failed'));
      mockedAxios.create.mockReturnValue({ get: mockGet } as any);

      const result = await provider.healthCheck();
      expect(result).toBe(false);
      expect(mockGet).toHaveBeenCalledWith('/models');
    });
  });
});