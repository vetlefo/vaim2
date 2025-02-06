"use strict";
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const llm_service_1 = require("./llm.service");
const redis_service_1 = require("../redis/redis.service");
const provider_factory_1 = require("../providers/provider.factory");
const env_validation_1 = require("../config/env.validation");
const provider_interface_1 = require("../interfaces/provider.interface");
describe('LLMService', () => {
    let service;
    let providerFactory;
    let redisService;
    const mockResponse = {
        text: 'Test response',
        usage: {
            promptTokens: 10,
            completionTokens: 20,
            totalTokens: 30,
        },
        metadata: {
            provider: 'openrouter',
            model: 'deepseek/deepseek-r1',
            latency: 100,
            timestamp: new Date().toISOString(),
        },
    };
    const mockProvider = {
        initialize: jest.fn().mockResolvedValue(undefined),
        complete: jest.fn().mockResolvedValue(mockResponse),
        completeStream: jest.fn().mockImplementation(function () {
            return __asyncGenerator(this, arguments, function* () {
                yield yield __await(mockResponse);
            });
        }),
        healthCheck: jest.fn().mockResolvedValue(true),
    };
    const mockRedis = {
        get: jest.fn(),
        set: jest.fn(),
        keys: jest.fn(),
        del: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                config_1.ConfigModule.forRoot({
                    validate: env_validation_1.validate,
                    isGlobal: true,
                    envFilePath: ['.env.test'],
                }),
            ],
            providers: [
                llm_service_1.LLMService,
                {
                    provide: provider_factory_1.LLMProviderFactory,
                    useValue: {
                        getProvider: jest.fn().mockReturnValue(mockProvider),
                        listProviders: jest.fn().mockReturnValue(['openrouter']),
                        listModels: jest.fn().mockReturnValue(['deepseek/deepseek-r1']),
                        healthCheck: jest.fn().mockResolvedValue({ openrouter: true }),
                    },
                },
                {
                    provide: redis_service_1.RedisService,
                    useValue: mockRedis,
                },
            ],
        }).compile();
        service = module.get(llm_service_1.LLMService);
        providerFactory = module.get(provider_factory_1.LLMProviderFactory);
        redisService = module.get(redis_service_1.RedisService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('complete', () => {
        const messages = [
            { role: 'user', content: 'Hello, world!' },
        ];
        it('should return completion response', async () => {
            mockRedis.get.mockResolvedValue(null);
            const response = await service.complete(messages);
            expect(response).toBeDefined();
            expect(response.text).toBe('Test response');
            expect(response.usage).toBeDefined();
            expect(response.metadata).toBeDefined();
        });
        it('should use cache when available', async () => {
            const cachedResponse = Object.assign(Object.assign({}, mockResponse), { metadata: Object.assign(Object.assign({}, mockResponse.metadata), { provider: 'cache' }) });
            mockRedis.get.mockResolvedValue(JSON.stringify(cachedResponse));
            const response = await service.complete(messages);
            expect(response).toBeDefined();
            expect(response.metadata.provider).toBe('cache');
        });
        it('should handle provider errors', async () => {
            mockRedis.get.mockResolvedValue(null);
            jest.spyOn(providerFactory, 'getProvider').mockImplementation(() => {
                throw new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.PROVIDER_ERROR, 'Provider error', 'test-provider');
            });
            await expect(service.complete(messages)).rejects.toThrow(provider_interface_1.LLMError);
        });
    });
    describe('completeStream', () => {
        const messages = [
            { role: 'user', content: 'Hello, world!' },
        ];
        it('should return stream iterator', async () => {
            var _a, e_1, _b, _c;
            const stream = await service.completeStream(messages);
            expect(stream).toBeDefined();
            const chunks = [];
            try {
                for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = await stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
                    _c = stream_1_1.value;
                    _d = false;
                    const chunk = _c;
                    chunks.push(chunk);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = stream_1.return)) await _b.call(stream_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            expect(chunks.length).toBeGreaterThan(0);
            expect(chunks[0].text).toBeDefined();
            expect(chunks[0].metadata).toBeDefined();
        });
        it('should handle stream errors', async () => {
            jest.spyOn(providerFactory, 'getProvider').mockImplementation(() => {
                throw new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.PROVIDER_ERROR, 'Stream error', 'test-provider');
            });
            await expect(service.completeStream(messages)).rejects.toThrow(provider_interface_1.LLMError);
        });
    });
    describe('provider management', () => {
        it('should list available providers', () => {
            const providers = service.listProviders();
            expect(providers).toBeDefined();
            expect(Array.isArray(providers)).toBe(true);
            expect(providers).toContain('openrouter');
        });
        it('should list models for provider', () => {
            const models = service.listModels('openrouter');
            expect(models).toBeDefined();
            expect(Array.isArray(models)).toBe(true);
            expect(models).toContain('deepseek/deepseek-r1');
        });
        it('should handle invalid provider', () => {
            jest.spyOn(providerFactory, 'listModels').mockImplementation(() => {
                throw new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.PROVIDER_ERROR, 'Invalid provider', 'invalid-provider');
            });
            expect(() => service.listModels('invalid-provider')).toThrow(provider_interface_1.LLMError);
        });
    });
    describe('health check', () => {
        it('should return provider health status', async () => {
            const health = await service.healthCheck();
            expect(health).toBeDefined();
            expect(typeof health).toBe('object');
            expect(health.openrouter).toBe(true);
        });
        it('should handle health check errors', async () => {
            jest.spyOn(providerFactory, 'healthCheck').mockResolvedValue({
                openrouter: false,
            });
            const health = await service.healthCheck();
            expect(health.openrouter).toBe(false);
        });
    });
});
//# sourceMappingURL=llm.service.spec.js.map