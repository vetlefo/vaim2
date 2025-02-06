"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMError = exports.LLMErrorType = void 0;
var LLMErrorType;
(function (LLMErrorType) {
    LLMErrorType["PROVIDER_ERROR"] = "PROVIDER_ERROR";
    LLMErrorType["RATE_LIMIT"] = "RATE_LIMIT";
    LLMErrorType["CONTEXT_LENGTH"] = "CONTEXT_LENGTH";
    LLMErrorType["INVALID_REQUEST"] = "INVALID_REQUEST";
    LLMErrorType["TIMEOUT"] = "TIMEOUT";
    LLMErrorType["MODEL_NOT_FOUND"] = "MODEL_NOT_FOUND";
    LLMErrorType["UNKNOWN"] = "UNKNOWN";
})(LLMErrorType || (exports.LLMErrorType = LLMErrorType = {}));
class LLMError extends Error {
    constructor(type, message, provider, details) {
        super(message);
        this.type = type;
        this.provider = provider;
        this.details = details;
        this.name = 'LLMError';
    }
}
exports.LLMError = LLMError;
//# sourceMappingURL=provider.interface.js.map