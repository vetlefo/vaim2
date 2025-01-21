import { Test } from '@nestjs/testing';
import OpenRouterOpenAIProvider from '../openrouter-openai.provider';
import { 
  LLMError, 
  LLMErrorType, 
  OpenRouterConfig,
  ChatMessage 
} from '@app/interfaces/provider.interface';
import { ConfigService } from '@nestjs/config';

describe('OpenRouterOpenAIProvider', () => {
  let provider: OpenRouterOpenAIProvider;
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
      baseUrl: 'https://openrouter.ai/api/v1',
      siteUrl: 'http://test.com',
      siteName: 'Test Site',
      maxRetries: 1,
      timeout: 30000,
    };

    provider = new OpenRouterOpenAIProvider(config);
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
    }, 30000); // Increased timeout for API call

    it('should handle context length errors', async () => {
      // Mock the OpenAI client to simulate a context length error
      const mockError = {
        name: 'APIError',
        status: 400,
        message: 'This model\'s maximum context length is 8192 tokens',
      };

      jest.spyOn(provider['client'].chat.completions, 'create')
        .mockRejectedValueOnce(mockError);

      await expect(provider.complete(mockMessages)).rejects.toThrow(
        new LLMError(LLMErrorType.CONTEXT_LENGTH, 'Maximum context length exceeded', 'openrouter')
      );
    }, 30000);
  });

  describe('completeStream', () => {
    const mockMessages: ChatMessage[] = [{ role: 'user', content: 'Count from 1 to 5' }];

    it('should handle streaming responses', async () => {
      // Create a simple async iterator that matches OpenAI's Stream type
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            id: 'chunk1',
            object: 'chat.completion.chunk',
            created: Date.now(),
            model: 'deepseek/deepseek-r1',
            choices: [{
              index: 0,
              delta: { content: 'Hello' }
            }]
          };
          yield {
            id: 'chunk2',
            object: 'chat.completion.chunk',
            created: Date.now(),
            model: 'deepseek/deepseek-r1',
            choices: [{
              index: 0,
              delta: { content: ' world' }
            }]
          };
        }
      };

      // Mock the OpenAI client's create method
      jest.spyOn(provider['client'].chat.completions, 'create')
        .mockResolvedValueOnce(mockStream as any);

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

      expect(chunks).toHaveLength(2);
      expect(chunks[0].text).toBe('Hello');
      expect(chunks[1].text).toBe(' world');
    }, 30000);
  });

  describe('healthCheck', () => {
    it('should return true when API is accessible', async () => {
      const result = await provider.healthCheck();
      expect(result).toBe(true);
    });
  });
});