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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const llm_service_1 = require("./llm.service");
const completion_dto_1 = require("./dto/completion.dto");
let LLMController = class LLMController {
    constructor(llmService) {
        this.llmService = llmService;
    }
    async complete(messages, options) {
        return this.llmService.complete(messages, options);
    }
    streamCompletion(messagesJson, optionsJson) {
        const messages = JSON.parse(messagesJson);
        const options = optionsJson
            ? JSON.parse(optionsJson)
            : undefined;
        return new rxjs_1.Observable(subscriber => {
            this.llmService.completeStream(messages, options)
                .then(async (stream) => {
                var _a, e_1, _b, _c;
                try {
                    try {
                        for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = await stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
                            _c = stream_1_1.value;
                            _d = false;
                            const response = _c;
                            const data = {
                                text: response.text,
                                metadata: response.metadata,
                            };
                            subscriber.next({
                                data: JSON.stringify(data),
                                type: 'message',
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
                    subscriber.next({
                        data: JSON.stringify({
                            text: '[DONE]',
                            metadata: {
                                model: (options === null || options === void 0 ? void 0 : options.model) || 'unknown',
                                provider: 'system',
                                latency: 0,
                                timestamp: new Date().toISOString(),
                            },
                        }),
                        type: 'message',
                    });
                    subscriber.complete();
                }
                catch (error) {
                    console.error('Stream error:', error);
                    subscriber.next({
                        data: JSON.stringify({
                            text: '[ERROR]',
                            metadata: {
                                error: error.message,
                                timestamp: new Date().toISOString(),
                            },
                        }),
                        type: 'error',
                    });
                    subscriber.complete();
                }
            })
                .catch(error => {
                console.error('Stream initialization error:', error);
                subscriber.error(error);
            });
        });
    }
    async listProviders() {
        return this.llmService.listProviders();
    }
    async listModels(provider) {
        return this.llmService.listModels(provider);
    }
    async healthCheck() {
        return this.llmService.healthCheck();
    }
};
exports.LLMController = LLMController;
__decorate([
    (0, common_1.Post)('complete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('messages')),
    __param(1, (0, common_1.Body)('options')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, completion_dto_1.CompletionOptionsInput]),
    __metadata("design:returntype", Promise)
], LLMController.prototype, "complete", null);
__decorate([
    (0, common_1.Sse)('complete/stream'),
    (0, common_1.Header)('Content-Type', 'text/event-stream'),
    (0, common_1.Header)('Cache-Control', 'no-cache'),
    (0, common_1.Header)('Connection', 'keep-alive'),
    __param(0, (0, common_1.Query)('messages')),
    __param(1, (0, common_1.Query)('options')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", rxjs_1.Observable)
], LLMController.prototype, "streamCompletion", null);
__decorate([
    (0, common_1.Get)('providers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LLMController.prototype, "listProviders", null);
__decorate([
    (0, common_1.Get)('providers/:provider/models'),
    __param(0, (0, common_1.Param)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LLMController.prototype, "listModels", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LLMController.prototype, "healthCheck", null);
exports.LLMController = LLMController = __decorate([
    (0, common_1.Controller)('llm'),
    __metadata("design:paramtypes", [llm_service_1.LLMService])
], LLMController);
//# sourceMappingURL=llm.controller.js.map