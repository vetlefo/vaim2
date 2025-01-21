import { Test } from '@nestjs/testing';
import OpenRouterProvider from '../openrouter.provider';
import { 
  LLMError, 
  LLMErrorType, 
  OpenRouterConfig,
  ChatMessage 
} from '@app/interfaces/provider.interface';
import { ConfigService } from '@nestjs/config';

describe('OpenRouterProvider', () => {
  let provider: OpenRouterProvider;
  let configService: ConfigService;
  let config: OpenRouterConfig;

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
      baseUrl: process.env.OPENROUTER_BASE_URL || 'http://localhost:3001/api/v1',
      siteUrl: 'http://test.com',
      siteName: 'Test Site',
      maxRetries: 1,
      timeout: 5000,
    };

    provider = new OpenRouterProvider(config);
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await expect(provider.initialize()).resolves.not.toThrow();
    });

    it('should handle initialization failure', async () => {
      const invalidProvider = new OpenRouterProvider({
        ...config,
        apiKey: 'invalid-key'
      });

      await expect(invalidProvider.initialize()).rejects.toThrow(
        new LLMError(LLMErrorType.PROVIDER_ERROR, 'Failed to initialize OpenRouter provider', 'openrouter')
      );
    });
  });

  describe('complete', () => {
    const mockMessages: ChatMessage[] = [{ role: 'user', content: 'Say hello' }];

    it('should complete messages successfully', async () => {
      const result = await provider.complete(mockMessages);

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.usage).toBeDefined();
      expect(result.usage.promptTokens).toBeGreaterThan(0);
      expect(result.usage.completionTokens).toBeGreaterThan(0);
      expect(result.usage.totalTokens).toBeGreaterThan(0);
      expect(result.metadata.provider).toBe('openrouter');
      expect(result.metadata.model).toBe('deepseek/deepseek-r1');
      expect(result.metadata.latency).toBeDefined();
    });

    it('should handle context length errors', async () => {
      const longMessage = 'a'.repeat(8192);
      await expect(provider.complete([
        { role: 'user', content: longMessage }
      ])).rejects.toThrow(
        new LLMError(LLMErrorType.CONTEXT_LENGTH, 'Maximum context length exceeded', 'openrouter')
      );
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests to trigger rate limit
      const requests = Array(11).fill(null).map(() => 
        provider.complete(mockMessages)
      );

      await expect(Promise.all(requests)).rejects.toThrow(
        new LLMError(LLMErrorType.RATE_LIMIT, 'Rate limit exceeded', 'openrouter')
      );
    });

    it('should handle timeouts', async () => {
      const timeoutProvider = new OpenRouterProvider({
        ...config,
        timeout: 1000
      });

      await expect(timeoutProvider.complete([
        { role: 'user', content: 'trigger timeout' }
      ])).rejects.toThrow(
        new LLMError(LLMErrorType.TIMEOUT, 'Request timed out', 'openrouter')
      );
    });

    it('should handle invalid API key', async () => {
      const invalidProvider = new OpenRouterProvider({
        ...config,
        apiKey: 'invalid-key'
      });

      await expect(invalidProvider.complete(mockMessages)).rejects.toThrow(
        new LLMError(LLMErrorType.PROVIDER_ERROR, 'Invalid API key', 'openrouter')
      );
    });

    it('should retry on failure', async () => {
      const retryProvider = new OpenRouterProvider({
        ...config,
        maxRetries: 3
      });

      // Mock temporary failure that should be retried
      jest.spyOn(retryProvider['client'], 'post')
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          data: {
            choices: [{ message: { content: 'Success after retry' } }],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
          }
        });

      const result = await retryProvider.complete(mockMessages);
      expect(result.text).toBe('Success after retry');
    });
  });

  describe('completeStream', () => {
    const mockMessages: ChatMessage[] = [{ role: 'user', content: 'Count from 1 to 5' }];

    it('should handle streaming responses', async () => {
      const stream = await provider.completeStream(mockMessages);
      const chunks = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
        expect(chunk).toMatchObject({
          text: expect.any(String),
          usage: {
            promptTokens: expect.any(Number),
            completionTokens: expect.any(Number),
            totalTokens: expect.any(Number)
          },
          metadata: {
            provider: 'openrouter',
            model: 'deepseek/deepseek-r1',
            latency: expect.any(Number),
            timestamp: expect.any(String)
          }
        });
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.map(c => c.text).join('')).toContain('Hello');
    });

    it('should handle streaming errors', async () => {
      const invalidProvider = new OpenRouterProvider({
        ...config,
        apiKey: 'invalid-key'
      });

      await expect(invalidProvider.completeStream(mockMessages)).rejects.toThrow(
        new LLMError(LLMErrorType.PROVIDER_ERROR, 'Invalid API key', 'openrouter')
      );
    });

    it('should handle streaming timeouts', async () => {
      const timeoutProvider = new OpenRouterProvider({
        ...config,
        timeout: 1000
      });

      await expect(timeoutProvider.completeStream([
        { role: 'user', content: 'trigger timeout' }
      ])).rejects.toThrow(
        new LLMError(LLMErrorType.TIMEOUT, 'Request timed out', 'openrouter')
      );
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is accessible', async () => {
      const result = await provider.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when API is inaccessible', async () => {
      const invalidProvider = new OpenRouterProvider({
        ...config,
        baseUrl: 'http://invalid-url'
      });

      const result = await invalidProvider.healthCheck();
      expect(result).toBe(false);
    });
  });
});