"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const openrouter_provider_1 = __importDefault(require("../openrouter.provider"));
const provider_interface_1 = require("../../../interfaces/provider.interface");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
jest.mock('axios');
describe('OpenRouterProvider', () => {
    let provider;
    let configService;
    let config;
    const mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                config_1.ConfigService,
            ],
        }).compile();
        configService = module.get(config_1.ConfigService);
        config = {
            apiKey: 'test-key',
            defaultModel: 'deepseek/deepseek-r1',
            baseUrl: 'http://localhost:3001/api/v1',
            siteUrl: 'http://test.com',
            siteName: 'Test Site',
            maxRetries: 1,
            timeout: 5000,
        };
        axios_1.default.create.mockReturnValue(mockAxiosInstance);
        mockAxiosInstance.get.mockResolvedValue({ data: { models: [] } });
        provider = new openrouter_provider_1.default(config);
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
            await expect(provider.initialize()).rejects.toThrow(expect.objectContaining({
                type: provider_interface_1.LLMErrorType.PROVIDER_ERROR,
                message: 'Failed to initialize OpenRouter provider',
                provider: 'openrouter',
            }));
        });
    });
    describe('complete', () => {
        const mockMessages = [{ role: 'user', content: 'Say hello' }];
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
            ])).rejects.toThrow(expect.objectContaining({
                type: provider_interface_1.LLMErrorType.CONTEXT_LENGTH,
                message: 'Maximum context length exceeded',
                provider: 'openrouter',
            }));
        });
        it('should handle rate limiting', async () => {
            mockAxiosInstance.post.mockRejectedValueOnce({
                isAxiosError: true,
                response: {
                    status: 429,
                    data: { error: { message: 'Rate limit exceeded' } },
                },
            });
            await expect(provider.complete(mockMessages)).rejects.toThrow(expect.objectContaining({
                type: provider_interface_1.LLMErrorType.RATE_LIMIT,
                message: 'Rate limit exceeded',
                provider: 'openrouter',
            }));
        });
        it('should handle timeouts', async () => {
            mockAxiosInstance.post.mockRejectedValueOnce({
                isAxiosError: true,
                code: 'ECONNABORTED',
                message: 'Request timed out',
            });
            await expect(provider.complete(mockMessages)).rejects.toThrow(expect.objectContaining({
                type: provider_interface_1.LLMErrorType.TIMEOUT,
                message: 'Request timed out',
                provider: 'openrouter',
            }));
        });
        it('should handle invalid API key', async () => {
            mockAxiosInstance.post.mockRejectedValueOnce({
                isAxiosError: true,
                response: {
                    status: 401,
                    data: { error: { message: 'Invalid API key' } },
                },
            });
            await expect(provider.complete(mockMessages)).rejects.toThrow(expect.objectContaining({
                type: provider_interface_1.LLMErrorType.PROVIDER_ERROR,
                message: 'Invalid API key',
                provider: 'openrouter',
            }));
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
        const mockMessages = [{ role: 'user', content: 'Count from 1 to 5' }];
        it('should handle streaming responses', async () => {
            var _a, e_1, _b, _c;
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
            try {
                for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = await stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
                    _c = stream_1_1.value;
                    _d = false;
                    const chunk = _c;
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
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = stream_1.return)) await _b.call(stream_1);
                }
                finally { if (e_1) throw e_1.error; }
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
            await expect(provider.completeStream(mockMessages)).rejects.toThrow(expect.objectContaining({
                type: provider_interface_1.LLMErrorType.PROVIDER_ERROR,
                message: 'Invalid API key',
                provider: 'openrouter',
            }));
        });
        it('should handle streaming timeouts', async () => {
            mockAxiosInstance.post.mockRejectedValueOnce({
                isAxiosError: true,
                code: 'ECONNABORTED',
                message: 'Request timed out',
            });
            await expect(provider.completeStream(mockMessages)).rejects.toThrow(expect.objectContaining({
                type: provider_interface_1.LLMErrorType.TIMEOUT,
                message: 'Request timed out',
                provider: 'openrouter',
            }));
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
//# sourceMappingURL=openrouter.provider.spec.js.map