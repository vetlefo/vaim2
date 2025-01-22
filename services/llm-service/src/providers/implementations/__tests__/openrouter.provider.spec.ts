import { Test } from '@nestjs/testing';
import OpenRouterProvider from '../openrouter.provider';
import {
  LLMError,
  LLMErrorType,
  OpenRouterConfig,
  ChatMessage
} from '../../../interfaces/provider.interface';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

jest.mock('axios');

describe('OpenRouterProvider', () => {
  let provider: OpenRouterProvider;
  let configService: ConfigService;
  let config: OpenRouterConfig;

  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConfigService,
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    
    config = {
      apiKey: 'test-key',
      defaultModel: 'deepseek/deepseek-r1',
      baseUrl: 'http://localhost:3001/api/v1',
      siteUrl: 'http://test.com',
      siteName: 'Test Site',
      maxRetries: 1,
      timeout: 5000,
    };

    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
    mockAxiosInstance.get.mockResolvedValue({ data: { models: [] } });

    provider = new OpenRouterProvider(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { models: [] } });
      await expect(provider.initialize()).resolves.not.toThrow();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/models');
    });

    it('should handle initialization failure', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: { message: 'Invalid API key' } },
        },
      });

      await expect(provider.initialize()).rejects.toThrow(
        expect.objectContaining({
          type: LLMErrorType.PROVIDER_ERROR,
          message: 'Failed to initialize OpenRouter provider',
          provider: 'openrouter',
        })
      );
    });
  });

  describe('complete', () => {
    const mockMessages: ChatMessage[] = [{ role: 'user', content: 'Say hello' }];

    it('should complete messages successfully', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Hello!' } }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await provider.complete(mockMessages);

      expect(result.text).toBe('Hello!');
      expect(result.usage.promptTokens).toBe(10);
      expect(result.usage.completionTokens).toBe(20);
      expect(result.usage.totalTokens).toBe(30);
      expect(result.metadata.provider).toBe('openrouter');
      expect(result.metadata.model).toBe('deepseek/deepseek-r1');
      expect(result.metadata.latency).toBeDefined();
    });

    it('should handle context length errors', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: { message: 'context length exceeded' } },
        },
      });

      const longMessage = 'a'.repeat(8192);
      await expect(provider.complete([
        { role: 'user', content: longMessage }
      ])).rejects.toThrow(
        expect.objectContaining({
          type: LLMErrorType.CONTEXT_LENGTH,
          message: 'Maximum context length exceeded',
          provider: 'openrouter',
        })
      );
    });

    it('should handle rate limiting', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 429,
          data: { error: { message: 'Rate limit exceeded' } },
        },
      });

      await expect(provider.complete(mockMessages)).rejects.toThrow(
        expect.objectContaining({
          type: LLMErrorType.RATE_LIMIT,
          message: 'Rate limit exceeded',
          provider: 'openrouter',
        })
      );
    });

    it('should handle timeouts', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce({
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'Request timed out',
      });

      await expect(provider.complete(mockMessages)).rejects.toThrow(
        expect.objectContaining({
          type: LLMErrorType.TIMEOUT,
          message: 'Request timed out',
          provider: 'openrouter',
        })
      );
    });

    it('should handle invalid API key', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: { message: 'Invalid API key' } },
        },
      });

      await expect(provider.complete(mockMessages)).rejects.toThrow(
        expect.objectContaining({
          type: LLMErrorType.PROVIDER_ERROR,
          message: 'Invalid API key',
          provider: 'openrouter',
        })
      );
    });

    it('should retry on failure', async () => {
      mockAxiosInstance.post
        .mockRejectedValueOnce({
          isAxiosError: true,
          response: {
            status: 500,
            data: { error: { message: 'Internal server error' } },
          },
        })
        .mockResolvedValueOnce({
          data: {
            choices: [{ message: { content: 'Success after retry' } }],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
          },
        });

      const result = await provider.complete(mockMessages);
      expect(result.text).toBe('Success after retry');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('completeStream', () => {
    const mockMessages: ChatMessage[] = [{ role: 'user', content: 'Count from 1 to 5' }];

    it('should handle streaming responses', async () => {
      const mockChunks = [
        'data: {"choices":[{"delta":{"content":"1"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"2"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"3"}}]}\n\n',
      ];

      const mockStream = {
        [Symbol.asyncIterator]: () => {
          let index = 0;
          return {
            next: async () => {
              if (index < mockChunks.length) {
                return { done: false, value: Buffer.from(mockChunks[index++]) };
              }
              return { done: true, value: undefined };
            },
          };
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockStream });

      const stream = await provider.completeStream(mockMessages);
      const chunks = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
        expect(chunk).toMatchObject({
          text: expect.any(String),
          usage: expect.any(Object),
          metadata: {
            provider: 'openrouter',
            model: 'deepseek/deepseek-r1',
            latency: expect.any(Number),
            timestamp: expect.any(String),
          },
        });
      }

      expect(chunks.length).toBe(3);
      expect(chunks.map(c => c.text)).toEqual(['1', '2', '3']);
    });

    it('should handle streaming errors', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: { message: 'Invalid API key' } },
        },
      });

      await expect(provider.completeStream(mockMessages)).rejects.toThrow(
        expect.objectContaining({
          type: LLMErrorType.PROVIDER_ERROR,
          message: 'Invalid API key',
          provider: 'openrouter',
        })
      );
    });

    it('should handle streaming timeouts', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce({
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'Request timed out',
      });

      await expect(provider.completeStream(mockMessages)).rejects.toThrow(
        expect.objectContaining({
          type: LLMErrorType.TIMEOUT,
          message: 'Request timed out',
          provider: 'openrouter',
        })
      );
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is accessible', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { models: [] } });
      const result = await provider.healthCheck();
      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/models');
    });

    it('should return false when API is inaccessible', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Connection failed'));
      const result = await provider.healthCheck();
      expect(result).toBe(false);
    });
  });
});