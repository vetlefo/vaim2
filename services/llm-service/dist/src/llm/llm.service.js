"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
const prometheus_service_1 = require("../monitoring/prometheus.service");
const provider_factory_1 = require("../providers/provider.factory");
let LLMService = class LLMService {
    constructor(redisService, prometheusService, providerFactory) {
        this.redisService = redisService;
        this.prometheusService = prometheusService;
        this.providerFactory = providerFactory;
    }
    async complete(messages, options = {}) {
        var _a;
        const provider = ((_a = options.model) === null || _a === void 0 ? void 0 : _a.split('/')[0]) || 'openrouter';
        const startTime = Date.now();
        this.prometheusService.startRequest(provider);
        try {
            const cacheKey = this.generateCacheKey(messages, provider);
            const cachedResponse = await this.redisService.get(cacheKey);
            if (cachedResponse) {
                this.prometheusService.recordCacheHit();
                this.prometheusService.endRequest(provider, 'success', (Date.now() - startTime) / 1000);
                return JSON.parse(cachedResponse);
            }
            this.prometheusService.recordCacheMiss();
            this.prometheusService.recordProviderRequest(provider);
            const llmProvider = this.providerFactory.getProvider(provider);
            const response = await llmProvider.complete(messages, options);
            if (response.usage) {
                this.prometheusService.recordTokenUsage(provider, 'prompt', response.usage.promptTokens);
                this.prometheusService.recordTokenUsage(provider, 'completion', response.usage.completionTokens);
            }
            await this.redisService.set(cacheKey, JSON.stringify(response), 60 * 60);
            const cacheStats = await this.redisService.getStats();
            this.prometheusService.updateCacheMetrics(cacheStats.keyCount, cacheStats.memoryUsage);
            this.prometheusService.endRequest(provider, 'success', (Date.now() - startTime) / 1000);
            return response;
        }
        catch (error) {
            this.prometheusService.recordProviderError(provider, error.name || 'UnknownError');
            this.prometheusService.endRequest(provider, 'error', (Date.now() - startTime) / 1000);
            throw error;
        }
    }
    async completeStream(messages, options = {}) {
        var _a;
        const provider = ((_a = options.model) === null || _a === void 0 ? void 0 : _a.split('/')[0]) || 'openrouter';
        const llmProvider = this.providerFactory.getProvider(provider);
        if (!llmProvider.completeStream) {
            throw new Error(`Provider ${provider} does not support streaming`);
        }
        const startTime = Date.now();
        this.prometheusService.startRequest(provider);
        try {
            const stream = await llmProvider.completeStream(messages, options);
            return this.wrapStream(stream, startTime, provider);
        }
        catch (error) {
            this.prometheusService.recordProviderError(provider, error.name || 'UnknownError');
            this.prometheusService.endRequest(provider, 'error', (Date.now() - startTime) / 1000);
            throw error;
        }
    }
    wrapStream(stream, startTime, provider) {
        return __asyncGenerator(this, arguments, function* wrapStream_1() {
            var _a, e_1, _b, _c;
            try {
                try {
                    for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield __await(stream_1.next()), _a = stream_1_1.done, !_a; _d = true) {
                        _c = stream_1_1.value;
                        _d = false;
                        const chunk = _c;
                        yield yield __await({
                            text: chunk.text,
                            metadata: {
                                model: chunk.metadata.model,
                                provider: chunk.metadata.provider,
                                latency: Date.now() - startTime,
                                timestamp: new Date().toISOString(),
                            },
                        });
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = stream_1.return)) yield __await(_b.call(stream_1));
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                this.prometheusService.endRequest(provider, 'success', (Date.now() - startTime) / 1000);
            }
            catch (error) {
                this.prometheusService.recordProviderError(provider, error.name || 'UnknownError');
                this.prometheusService.endRequest(provider, 'error', (Date.now() - startTime) / 1000);
                throw error;
            }
        });
    }
    async listProviders() {
        return this.providerFactory.listProviders();
    }
    async listModels(provider) {
        if (provider) {
            return this.providerFactory.listModels(provider);
        }
        const providers = await this.listProviders();
        const allModels = [];
        for (const provider of providers) {
            const models = this.providerFactory.listModels(provider);
            allModels.push(...models);
        }
        return allModels;
    }
    async healthCheck() {
        const providers = await this.listProviders();
        const health = {};
        for (const provider of providers) {
            try {
                const llmProvider = this.providerFactory.getProvider(provider);
                health[provider] = await llmProvider.healthCheck();
            }
            catch (error) {
                health[provider] = {
                    status: 'error',
                    error: error.message,
                };
            }
        }
        return health;
    }
    generateCacheKey(messages, provider) {
        const messageString = JSON.stringify(messages);
        return `llm:${provider}:${Buffer.from(messageString).toString('base64')}`;
    }
};
exports.LLMService = LLMService;
exports.LLMService = LLMService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        prometheus_service_1.PrometheusService,
        provider_factory_1.LLMProviderFactory])
], LLMService);
//# sourceMappingURL=llm.service.js.map