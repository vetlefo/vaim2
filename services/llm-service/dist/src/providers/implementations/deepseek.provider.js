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
class DeepSeekProvider {
    constructor(config) {
        this.defaultModel = config.model || 'deepseek-r1';
        this.maxRetries = config.maxRetries || 3;
        this.timeout = config.timeout || 30000;
        this.client = axios_1.default.create({
            baseURL: config.baseUrl || 'https://api.deepseek.com/v1',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: this.timeout,
        });
    }
    async initialize() {
        try {
            await this.healthCheck();
        }
        catch (error) {
            throw new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.PROVIDER_ERROR, 'Failed to initialize DeepSeek provider', 'deepseek', error);
        }
    }
    async complete(messages, options) {
        const startTime = Date.now();
        let retries = 0;
        while (retries < this.maxRetries) {
            try {
                const response = await this.client.post('/chat/completions', {
                    model: (options === null || options === void 0 ? void 0 : options.model) || this.defaultModel,
                    messages: messages,
                    temperature: (options === null || options === void 0 ? void 0 : options.temperature) || 0.7,
                    max_tokens: (options === null || options === void 0 ? void 0 : options.maxTokens) || 4096,
                    top_p: (options === null || options === void 0 ? void 0 : options.topP) || 1,
                    frequency_penalty: options === null || options === void 0 ? void 0 : options.frequencyPenalty,
                    presence_penalty: options === null || options === void 0 ? void 0 : options.presencePenalty,
                    stop: options === null || options === void 0 ? void 0 : options.stop,
                    stream: false,
                });
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
                        model: (options === null || options === void 0 ? void 0 : options.model) || this.defaultModel,
                        provider: 'deepseek',
                        latency: Date.now() - startTime,
                        timestamp: new Date().toISOString(),
                    },
                };
            }
            catch (error) {
                retries++;
                if (retries === this.maxRetries) {
                    throw this.handleError(error);
                }
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
            }
        }
        throw new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.UNKNOWN, 'Failed to complete request after retries', 'deepseek');
    }
    async completeStream(messages, options) {
        const startTime = Date.now();
        try {
            const response = await this.client.post('/chat/completions', {
                model: (options === null || options === void 0 ? void 0 : options.model) || this.defaultModel,
                messages: messages,
                temperature: (options === null || options === void 0 ? void 0 : options.temperature) || 0.7,
                max_tokens: (options === null || options === void 0 ? void 0 : options.maxTokens) || 4096,
                top_p: (options === null || options === void 0 ? void 0 : options.topP) || 1,
                frequency_penalty: options === null || options === void 0 ? void 0 : options.frequencyPenalty,
                presence_penalty: options === null || options === void 0 ? void 0 : options.presencePenalty,
                stop: options === null || options === void 0 ? void 0 : options.stop,
                stream: true,
            }, {
                responseType: 'stream',
            });
            const stream = response.data;
            return this.processStream(stream, startTime, (options === null || options === void 0 ? void 0 : options.model) || this.defaultModel);
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    processStream(stream, startTime, model) {
        return __asyncGenerator(this, arguments, function* processStream_1() {
            var _a, e_1, _b, _c;
            var _d, _e, _f;
            try {
                for (var _g = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield __await(stream_1.next()), _a = stream_1_1.done, !_a; _g = true) {
                    _c = stream_1_1.value;
                    _g = false;
                    const chunk = _c;
                    const data = JSON.parse(chunk.toString());
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
                                provider: 'deepseek',
                                latency: Date.now() - startTime,
                                timestamp: new Date().toISOString(),
                            },
                        });
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_g && !_a && (_b = stream_1.return)) yield __await(_b.call(stream_1));
                }
                finally { if (e_1) throw e_1.error; }
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
                    return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.PROVIDER_ERROR, 'Invalid API key', 'deepseek', error);
                case 429:
                    return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.RATE_LIMIT, 'Rate limit exceeded', 'deepseek', error);
                case 400:
                    if (message.includes('context length')) {
                        return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.CONTEXT_LENGTH, 'Maximum context length exceeded', 'deepseek', error);
                    }
                    return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.INVALID_REQUEST, message, 'deepseek', error);
                case 404:
                    return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.MODEL_NOT_FOUND, `Model not found: ${message}`, 'deepseek', error);
                case 408:
                    return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.TIMEOUT, 'Request timed out', 'deepseek', error);
                default:
                    return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.UNKNOWN, `Unexpected error: ${message}`, 'deepseek', error);
            }
        }
        return new provider_interface_1.LLMError(provider_interface_1.LLMErrorType.UNKNOWN, 'Unknown error occurred', 'deepseek', error);
    }
}
exports.default = DeepSeekProvider;
//# sourceMappingURL=deepseek.provider.js.map