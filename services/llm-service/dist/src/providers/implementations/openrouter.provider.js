#!/usr/bin/env node
"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const provider_interface_1 = require("../../interfaces/provider.interface");
class OpenRouterProvider {
    constructor(config) {
        this.defaultModel = config.defaultModel || 'anthropic/claude-3.5-sonnet';
        this.maxRetries = config.maxRetries || 3;
        this.timeout = config.timeout || 30000;
        this.parameterCache = new Map();
        this.parameterCacheTTL = config.parameterCacheTTL || 3600000;
        this.modelCapabilities = new Map();
        this.client = axios_1.default.create({
            baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'HTTP-Referer': config.siteUrl || '',
                'X-Title': config.siteName || '',
                'Content-Type': 'application/json',
            },
            timeout: this.timeout,
        });
        this.initializeModelCapabilities();
    }
    initializeModelCapabilities() {
        this.modelCapabilities.set('anthropic/claude-3.5-sonnet', {
            contextWindow: 200000,
            maxOutputTokens: 8000,
            pricing: {
                input: 1.50,
                output: 5.50
            },
            strengths: [
                'Strong at bridging statements, summary layers, multi-step reasoning',
                'Excellent at "big-picture" analysis and data unification',
                'Great for advanced data science or code reasoning'
            ],
            useCases: [
                'Architectural planning',
                'Summaries of large corpora',
                'High-level design reviews'
            ]
        });
        this.modelCapabilities.set('openai/o1', {
            contextWindow: 200000,
            maxOutputTokens: 100000,
            pricing: {
                input: 15.00,
                output: 60.00,
                images: 21.68
            },
            strengths: [
                'Extreme STEM performance',
                'Multi-path reasoning with advanced backtracking',
                'PhD-level physics, math, HPC-like analysis'
            ],
            useCases: [
                'High-stakes correctness',
                'HPC code validations',
                'Large-scale problem solving'
            ]
        });
        this.modelCapabilities.set('google/gemini-pro', {
            contextWindow: 2000000,
            pricing: {
                input: 1.25,
                output: 5.00,
                images: 0.6575
            },
            strengths: [
                'Enormous context window',
                'Multimodal capabilities',
                'Good for code gen and complex data extraction'
            ],
            useCases: [
                'Huge document sets',
                'Multimedia tasks',
                'Large-scale text ingestion'
            ],
            multimodal: true
        });
        this.modelCapabilities.set('deepseek/deepseek-v3', {
            contextWindow: 128000,
            pricing: {
                input: 0.14,
                output: 0.28
            },
            strengths: [
                'Open-source orientation',
                'Strong code analysis',
                'Good performance across multiple domains'
            ],
            useCases: [
                'Self-hosted deployments',
                'Large codebase analysis',
                'General domain tasks'
            ]
        });
        this.modelCapabilities.set('minimax/minimax-01', {
            contextWindow: 1000000,
            pricing: {
                input: 0.20,
                output: 1.10
            },
            strengths: [
                'Large context at budget-friendly rate',
                'Hybrid architecture',
                'Decent multimodal capabilities'
            ],
            useCases: [
                'Massive text ingestion',
                'Large data transformations',
                'Cost-effective processing'
            ],
            multimodal: true
        });
        this.modelCapabilities.set('mistral/mistral-7b', {
            contextWindow: 32000,
            pricing: {
                input: 0.03,
                output: 0.055
            },
            strengths: [
                'Very cheap input & output cost',
                'Good for simpler tasks & high volumes',
                'Strong for quick queries'
            ],
            useCases: [
                'High-volume tasks',
                'Basic QA or summaries',
                'Budget-constrained operations'
            ]
        });
        this.modelCapabilities.set('mistral/ministral-8b', {
            contextWindow: 128000,
            pricing: {
                input: 0.10,
                output: 0.10
            },
            strengths: [
                'Solid "edge" performance in a smaller param model',
                'Good for moderate-scale tasks & slightly advanced reasoning'
            ],
            useCases: [
                'Edge or on-prem contexts needing 8B param-level speed',
                'Middle-tier tasks or real-time chat'
            ]
        });
    }
    async initialize() {
        try {
            const isHealthy = await this.healthCheck();
            if (!isHealthy) {
                throw new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.PROVIDER_ERROR, 'Failed to initialize OpenRouter provider', 'openrouter');
            }
            await this.getModelParameters(this.defaultModel);
        }
        catch (error) {
            if (error instanceof provider_interface_1.LLMError) {
                throw error;
            }
            throw new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.PROVIDER_ERROR, 'Failed to initialize OpenRouter provider', 'openrouter', error);
        }
    }
    async getModelParameters(model) {
        const cached = this.parameterCache.get(model);
        if (cached) {
            return cached;
        }
        try {
            const response = await this.client.get(`/parameters/${model}`);
            const parameters = response.data;
            this.parameterCache.set(model, parameters);
            setTimeout(() => {
                this.parameterCache.delete(model);
            }, this.parameterCacheTTL);
            return parameters;
        }
        catch (error) {
            return {
                temperature_p50: 0.7,
                top_p_p50: 0.95,
                frequency_penalty_p50: 0.1,
                presence_penalty_p50: 0.1,
                top_k_p50: 40,
                repetition_penalty_p50: 1.1,
            };
        }
    }
    async complete(messages, options) {
        var _a;
        const startTime = Date.now();
        let retries = 0;
        const model = (options === null || options === void 0 ? void 0 : options.model) || this.defaultModel;
        let lastError;
        const parameters = await this.getModelParameters(model);
        while (retries <= this.maxRetries) {
            try {
                const requestBody = {
                    model: model,
                    messages: messages,
                    temperature: (options === null || options === void 0 ? void 0 : options.temperature) || parameters.temperature_p50,
                    max_tokens: (options === null || options === void 0 ? void 0 : options.maxTokens) || 4096,
                    top_p: (options === null || options === void 0 ? void 0 : options.topP) || parameters.top_p_p50,
                    top_k: (options === null || options === void 0 ? void 0 : options.topK) || parameters.top_k_p50,
                    frequency_penalty: (options === null || options === void 0 ? void 0 : options.frequencyPenalty) || parameters.frequency_penalty_p50,
                    presence_penalty: (options === null || options === void 0 ? void 0 : options.presencePenalty) || parameters.presence_penalty_p50,
                    repetition_penalty: (options === null || options === void 0 ? void 0 : options.repetitionPenalty) || parameters.repetition_penalty_p50,
                    min_p: (options === null || options === void 0 ? void 0 : options.minP) || 0.0,
                    top_a: (options === null || options === void 0 ? void 0 : options.topA) || 0.0,
                    stop: (options === null || options === void 0 ? void 0 : options.stop) || [],
                    stream: false,
                };
                if (((_a = options === null || options === void 0 ? void 0 : options.responseFormat) === null || _a === void 0 ? void 0 : _a.type) === 'json_schema') {
                    requestBody.response_format = {
                        type: 'json_schema',
                        schema: options.responseFormat.schema
                    };
                }
                const response = await this.client.post('/chat/completions', requestBody);
                const completion = response.data.choices[0].message.content;
                const usage = response.data.usage;
                return {
                    text: completion,
                    usage: {
                        promptTokens: usage.prompt_tokens,
                        completionTokens: usage.completion_tokens,
                        totalTokens: usage.total_tokens,
                    },
                    metadata: {
                        model: model,
                        provider: 'openrouter',
                        latency: Date.now() - startTime,
                        timestamp: new Date().toISOString(),
                        capabilities: this.modelCapabilities.get(model),
                    },
                };
            }
            catch (error) {
                lastError = error;
                const llmError = this.handleError(error);
                if (llmError.type === provider_interface_1.LLMErrorType.INVALID_REQUEST ||
                    llmError.type === provider_interface_1.LLMErrorType.CONTEXT_LENGTH ||
                    llmError.type === provider_interface_1.LLMErrorType.MODEL_NOT_FOUND ||
                    llmError.type === provider_interface_1.LLMErrorType.PROVIDER_ERROR ||
                    llmError.type === provider_interface_1.LLMErrorType.RATE_LIMIT ||
                    llmError.type === provider_interface_1.LLMErrorType.TIMEOUT) {
                    throw llmError;
                }
                retries++;
                if (retries > this.maxRetries) {
                    throw llmError;
                }
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
            }
        }
        throw this.handleError(lastError);
    }
    async completeStream(messages, options) {
        var _a;
        const startTime = Date.now();
        const model = (options === null || options === void 0 ? void 0 : options.model) || this.defaultModel;
        const parameters = await this.getModelParameters(model);
        try {
            const requestBody = {
                model: model,
                messages: messages,
                temperature: (options === null || options === void 0 ? void 0 : options.temperature) || parameters.temperature_p50,
                max_tokens: (options === null || options === void 0 ? void 0 : options.maxTokens) || 4096,
                top_p: (options === null || options === void 0 ? void 0 : options.topP) || parameters.top_p_p50,
                top_k: (options === null || options === void 0 ? void 0 : options.topK) || parameters.top_k_p50,
                frequency_penalty: (options === null || options === void 0 ? void 0 : options.frequencyPenalty) || parameters.frequency_penalty_p50,
                presence_penalty: (options === null || options === void 0 ? void 0 : options.presencePenalty) || parameters.presence_penalty_p50,
                repetition_penalty: (options === null || options === void 0 ? void 0 : options.repetitionPenalty) || parameters.repetition_penalty_p50,
                min_p: (options === null || options === void 0 ? void 0 : options.minP) || 0.0,
                top_a: (options === null || options === void 0 ? void 0 : options.topA) || 0.0,
                stop: (options === null || options === void 0 ? void 0 : options.stop) || [],
                stream: true,
            };
            if (((_a = options === null || options === void 0 ? void 0 : options.responseFormat) === null || _a === void 0 ? void 0 : _a.type) === 'json_schema') {
                requestBody.response_format = {
                    type: 'json_schema',
                    schema: options.responseFormat.schema
                };
            }
            const response = await this.client.post('/chat/completions', requestBody, {
                responseType: 'stream',
            });
            const iterator = {
                [Symbol.asyncIterator]() {
                    return this;
                },
                async next() {
                    var _a, _b, _c;
                    try {
                        const chunk = await response.data.read();
                        if (!chunk) {
                            return { done: true, value: undefined };
                        }
                        const lines = chunk.toString().split('\n');
                        for (const line of lines) {
                            if (line.trim() === '' || !line.startsWith('data: '))
                                continue;
                            try {
                                const data = JSON.parse(line.slice(6));
                                if ((_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.delta) === null || _c === void 0 ? void 0 : _c.content) {
                                    return {
                                        done: false,
                                        value: {
                                            text: data.choices[0].delta.content,
                                            usage: {
                                                promptTokens: 0,
                                                completionTokens: 0,
                                                totalTokens: 0,
                                            },
                                            metadata: {
                                                model: model,
                                                provider: 'openrouter',
                                                latency: Date.now() - startTime,
                                                timestamp: new Date().toISOString(),
                                                capabilities: this.modelCapabilities.get(model),
                                            },
                                        },
                                    };
                                }
                            }
                            catch (e) {
                                continue;
                            }
                        }
                        return { done: true, value: undefined };
                    }
                    catch (error) {
                        throw this.handleError(error);
                    }
                },
            };
            return Promise.resolve(iterator);
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    processStream(stream, startTime, model) {
        return __asyncGenerator(this, arguments, function* processStream_1() {
            var _a, e_1, _b, _c;
            var _d, _e, _f, _g, _h, _j;
            let buffer = '';
            try {
                try {
                    for (var _k = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield __await(stream_1.next()), _a = stream_1_1.done, !_a; _k = true) {
                        _c = stream_1_1.value;
                        _k = false;
                        const chunk = _c;
                        const lines = (buffer + chunk.toString()).split('\n');
                        buffer = lines.pop() || '';
                        for (const line of lines) {
                            if (line.trim() === '')
                                continue;
                            if (!line.startsWith('data: '))
                                continue;
                            try {
                                const data = JSON.parse(line.slice(6));
                                if ((_f = (_e = (_d = data.choices) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.delta) === null || _f === void 0 ? void 0 : _f.content) {
                                    yield yield __await({
                                        text: data.choices[0].delta.content,
                                        usage: {
                                            promptTokens: 0,
                                            completionTokens: 0,
                                            totalTokens: 0,
                                        },
                                        metadata: {
                                            model: model,
                                            provider: 'openrouter',
                                            latency: Date.now() - startTime,
                                            timestamp: new Date().toISOString(),
                                            capabilities: this.modelCapabilities.get(model),
                                        },
                                    });
                                }
                            }
                            catch (e) {
                                continue;
                            }
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_k && !_a && (_b = stream_1.return)) yield __await(_b.call(stream_1));
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                if (buffer.trim() !== '') {
                    try {
                        const data = JSON.parse(buffer.startsWith('data: ') ? buffer.slice(6) : buffer);
                        if ((_j = (_h = (_g = data.choices) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.delta) === null || _j === void 0 ? void 0 : _j.content) {
                            yield yield __await({
                                text: data.choices[0].delta.content,
                                usage: {
                                    promptTokens: 0,
                                    completionTokens: 0,
                                    totalTokens: 0,
                                },
                                metadata: {
                                    model: model,
                                    provider: 'openrouter',
                                    latency: Date.now() - startTime,
                                    timestamp: new Date().toISOString(),
                                    capabilities: this.modelCapabilities.get(model),
                                },
                            });
                        }
                    }
                    catch (e) {
                    }
                }
            }
            catch (error) {
                throw this.handleError(error);
            }
        });
    }
    async healthCheck() {
        try {
            await this.client.get('/models');
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async listModels() {
        try {
            const response = await this.client.get('/models');
            return response.data.data.map((model) => model.id);
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    handleError(error) {
        var _a, _b, _c, _d;
        if (axios_1.default.isAxiosError(error)) {
            const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            const message = ((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || error.message;
            switch (status) {
                case 401:
                    return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.PROVIDER_ERROR, 'Invalid API key', 'openrouter', error);
                case 429:
                    return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.RATE_LIMIT, 'Rate limit exceeded', 'openrouter', error);
                case 400:
                    if (message.includes('context length')) {
                        return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.CONTEXT_LENGTH, 'Maximum context length exceeded', 'openrouter', error);
                    }
                    return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.INVALID_REQUEST, message, 'openrouter', error);
                case 404:
                    return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.MODEL_NOT_FOUND, `Model not found: ${message}`, 'openrouter', error);
                case 408:
                    return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.TIMEOUT, 'Request timed out', 'openrouter', error);
                default:
                    if (error.code === 'ECONNABORTED') {
                        return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.TIMEOUT, 'Request timed out', 'openrouter', error);
                    }
                    return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.UNKNOWN, `Unexpected error: ${message}`, 'openrouter', error);
            }
        }
        if (error instanceof Error) {
            return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.UNKNOWN, error.message, 'openrouter', error);
        }
        return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.UNKNOWN, 'Unknown error occurred', 'openrouter', error);
    }
}
exports.default = OpenRouterProvider;
//# sourceMappingURL=openrouter.provider.js.map