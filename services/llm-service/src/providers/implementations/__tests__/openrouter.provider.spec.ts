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
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultModel: 'deepseek/deepseek-r1',
      siteUrl: 'http://test.com',
      siteName: 'Test Site',
      maxRetries: 1,
      timeout: 30000,
    };

    provider = new OpenRouterProvider(config);
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await expect(provider.initialize()).resolves.not.toThrow();
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
    }, 30000);

    it('should handle context length errors', async () => {
      // Mock axios error for context length
      jest.spyOn(provider['client'], 'post').mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            error: {
              message: 'This model\'s maximum context length is 8192 tokens'
            }
          }
        },
        isAxiosError: true
      });

      await expect(provider.complete(mockMessages)).rejects.toThrow(
        new LLMError(LLMErrorType.CONTEXT_LENGTH, 'Maximum context length exceeded', 'openrouter')
      );

      // Restore fetch
      jest.restoreAllMocks();
    }, 30000);
  });

  describe('completeStream', () => {
    const mockMessages: ChatMessage[] = [{ role: 'user', content: 'Count from 1 to 5' }];

    it('should handle streaming responses', async () => {
      // Mock axios stream response
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n');
          yield Buffer.from('data: {"choices":[{"delta":{"content":" world"}}]}\n\n');
        }
      };

      jest.spyOn(provider['client'], 'post').mockResolvedValueOnce({
        data: mockStream,
        status: 200,
        headers: { 'content-type': 'text/event-stream' }
      });

      const responseStream = await provider.completeStream(mockMessages);
      const responses = [];

      for await (const chunk of responseStream) {
        responses.push(chunk);
        expect(chunk).toMatchObject({
          text: expect.any(String),
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
          },
          metadata: {
            provider: 'openrouter',
            model: 'deepseek/deepseek-r1',
            latency: expect.any(Number),
            timestamp: expect.any(String)
          }
        });
      }

      expect(responses).toHaveLength(2);
      expect(responses[0].text).toBe('Hello');
      expect(responses[1].text).toBe(' world');

      // Restore fetch
      jest.restoreAllMocks();
    }, 30000);
  });

  describe('healthCheck', () => {
    it('should return true when API is accessible', async () => {
      const result = await provider.healthCheck();
      expect(result).toBe(true);
    });
  });
});