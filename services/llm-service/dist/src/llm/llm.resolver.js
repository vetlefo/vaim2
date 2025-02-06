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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
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
exports.LLMResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const llm_service_1 = require("./llm.service");
const completion_dto_1 = require("./dto/completion.dto");
let LLMResolver = class LLMResolver {
    constructor(llmService) {
        this.llmService = llmService;
    }
    async complete(messages, options) {
        return this.llmService.complete(messages, options);
    }
    streamCompletion(messages, options) {
        return __asyncGenerator(this, arguments, function* streamCompletion_1() {
            var _a, e_1, _b, _c;
            const stream = yield __await(this.llmService.completeStream(messages, options));
            try {
                try {
                    for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield __await(stream_1.next()), _a = stream_1_1.done, !_a; _d = true) {
                        _c = stream_1_1.value;
                        _d = false;
                        const response = _c;
                        yield yield __await({
                            text: response.text,
                            metadata: response.metadata,
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
                yield yield __await({
                    text: '[DONE]',
                    metadata: {
                        model: (options === null || options === void 0 ? void 0 : options.model) || 'unknown',
                        provider: 'system',
                        latency: 0,
                        timestamp: new Date().toISOString(),
                    },
                });
            }
            catch (error) {
                yield yield __await({
                    text: `Error: ${error.message}`,
                    metadata: {
                        model: (options === null || options === void 0 ? void 0 : options.model) || 'unknown',
                        provider: 'error',
                        latency: 0,
                        timestamp: new Date().toISOString(),
                    },
                });
                throw error;
            }
        });
    }
    async listProviders() {
        return this.llmService.listProviders();
    }
    async listModels(provider) {
        return this.llmService.listModels(provider);
    }
    async healthCheck() {
        const results = await this.llmService.healthCheck();
        return Object.values(results).some(healthy => healthy);
    }
};
exports.LLMResolver = LLMResolver;
__decorate([
    (0, graphql_1.Query)(() => completion_dto_1.CompletionResponse),
    __param(0, (0, graphql_1.Args)('messages', { type: () => [completion_dto_1.ChatMessageInput] })),
    __param(1, (0, graphql_1.Args)('options', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, completion_dto_1.CompletionOptionsInput]),
    __metadata("design:returntype", Promise)
], LLMResolver.prototype, "complete", null);
__decorate([
    (0, graphql_1.Subscription)(() => completion_dto_1.StreamCompletionResponse),
    __param(0, (0, graphql_1.Args)('messages', { type: () => [completion_dto_1.ChatMessageInput] })),
    __param(1, (0, graphql_1.Args)('options', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, completion_dto_1.CompletionOptionsInput]),
    __metadata("design:returntype", Object)
], LLMResolver.prototype, "streamCompletion", null);
__decorate([
    (0, graphql_1.Query)(() => [String]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LLMResolver.prototype, "listProviders", null);
__decorate([
    (0, graphql_1.Query)(() => [String]),
    __param(0, (0, graphql_1.Args)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LLMResolver.prototype, "listModels", null);
__decorate([
    (0, graphql_1.Query)(() => Boolean),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LLMResolver.prototype, "healthCheck", null);
exports.LLMResolver = LLMResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [llm_service_1.LLMService])
], LLMResolver);
//# sourceMappingURL=llm.resolver.js.map