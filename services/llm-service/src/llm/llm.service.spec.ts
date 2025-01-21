import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LLMService } from './llm.service';
import { RedisModule } from '../redis/redis.module';
import { LLMProviderFactory } from '../providers/provider.factory';
import { validate } from '../config/env.validation';
import { ChatMessage, LLMError, LLMErrorType } from '@app/interfaces/provider.interface';

describe('LLMService', () => {
  let service: LLMService;
  let providerFactory: LLMProviderFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          validate,
          isGlobal: true,
          envFilePath: ['.env.test'],
        }),
        RedisModule,
      ],
      providers: [LLMService, LLMProviderFactory],
    }).compile();

    service = module.get<LLMService>(LLMService);
    providerFactory = module.get<LLMProviderFactory>(LLMProviderFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('complete', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello, world!' },
    ];

    it('should return completion response', async () => {
      const response = await service.complete(messages);
      expect(response).toBeDefined();
      expect(response.text).toBe('Test response');
      expect(response.usage).toBeDefined();
      expect(response.metadata).toBeDefined();
    });

    it('should use cache when available', async () => {
      // First call to populate cache
      await service.complete(messages);

      // Second call should use cache
      const response = await service.complete(messages);
      expect(response).toBeDefined();
      expect(response.metadata.provider).toBe('cache');
    });

    it('should handle provider errors', async () => {
      jest.spyOn(providerFactory, 'getProvider').mockImplementation(() => {
        throw new LLMError(
          LLMErrorType.PROVIDER_ERROR,
          'Provider error',
          'test-provider'
        );
      });

      await expect(service.complete(messages)).rejects.toThrow(LLMError);
    });
  });

  describe('completeStream', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello, world!' },
    ];

    it('should return stream iterator', async () => {
      const stream = await service.completeStream(messages);
      expect(stream).toBeDefined();

      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].text).toBeDefined();
      expect(chunks[0].metadata).toBeDefined();
    });

    it('should handle stream errors', async () => {
      jest.spyOn(providerFactory, 'getProvider').mockImplementation(() => {
        throw new LLMError(
          LLMErrorType.PROVIDER_ERROR,
          'Stream error',
          'test-provider'
        );
      });

      await expect(service.completeStream(messages)).rejects.toThrow(LLMError);
    });
  });

  describe('provider management', () => {
    it('should list available providers', () => {
      const providers = service.listProviders();
      expect(providers).toBeDefined();
      expect(Array.isArray(providers)).toBe(true);
    });

    it('should list models for provider', () => {
      const models = service.listModels('openrouter');
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
    });

    it('should handle invalid provider', () => {
      expect(() => service.listModels('invalid-provider')).toThrow(LLMError);
    });
  });

  describe('health check', () => {
    it('should return provider health status', async () => {
      const health = await service.healthCheck();
      expect(health).toBeDefined();
      expect(typeof health).toBe('object');
      expect(Object.values(health).some(status => status)).toBe(true);
    });

    it('should handle health check errors', async () => {
      jest.spyOn(providerFactory, 'healthCheck').mockRejectedValue(new Error());
      const health = await service.healthCheck();
      expect(Object.values(health).every(status => !status)).toBe(true);
    });
  });
});