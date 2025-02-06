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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamCompletionResponse = exports.CompletionResponse = exports.ChatMessageInput = exports.CompletionOptionsInput = void 0;
const graphql_1 = require("@nestjs/graphql");
const class_validator_1 = require("class-validator");
let CompletionOptionsInput = class CompletionOptionsInput {
};
exports.CompletionOptionsInput = CompletionOptionsInput;
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CompletionOptionsInput.prototype, "model", void 0);
__decorate([
    (0, graphql_1.Field)(() => Number, { nullable: true }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CompletionOptionsInput.prototype, "temperature", void 0);
__decorate([
    (0, graphql_1.Field)(() => Number, { nullable: true }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CompletionOptionsInput.prototype, "maxTokens", void 0);
__decorate([
    (0, graphql_1.Field)(() => Number, { nullable: true }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CompletionOptionsInput.prototype, "topP", void 0);
__decorate([
    (0, graphql_1.Field)(() => Number, { nullable: true }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CompletionOptionsInput.prototype, "frequencyPenalty", void 0);
__decorate([
    (0, graphql_1.Field)(() => Number, { nullable: true }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CompletionOptionsInput.prototype, "presencePenalty", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String], { nullable: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CompletionOptionsInput.prototype, "stop", void 0);
exports.CompletionOptionsInput = CompletionOptionsInput = __decorate([
    (0, graphql_1.InputType)()
], CompletionOptionsInput);
let ChatMessageInput = class ChatMessageInput {
};
exports.ChatMessageInput = ChatMessageInput;
__decorate([
    (0, graphql_1.Field)(() => String),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChatMessageInput.prototype, "role", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChatMessageInput.prototype, "content", void 0);
exports.ChatMessageInput = ChatMessageInput = __decorate([
    (0, graphql_1.InputType)()
], ChatMessageInput);
let CompletionUsage = class CompletionUsage {
};
__decorate([
    (0, graphql_1.Field)(() => Number),
    __metadata("design:type", Number)
], CompletionUsage.prototype, "promptTokens", void 0);
__decorate([
    (0, graphql_1.Field)(() => Number),
    __metadata("design:type", Number)
], CompletionUsage.prototype, "completionTokens", void 0);
__decorate([
    (0, graphql_1.Field)(() => Number),
    __metadata("design:type", Number)
], CompletionUsage.prototype, "totalTokens", void 0);
CompletionUsage = __decorate([
    (0, graphql_1.ObjectType)()
], CompletionUsage);
let CompletionMetadata = class CompletionMetadata {
};
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], CompletionMetadata.prototype, "model", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], CompletionMetadata.prototype, "provider", void 0);
__decorate([
    (0, graphql_1.Field)(() => Number),
    __metadata("design:type", Number)
], CompletionMetadata.prototype, "latency", void 0);
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], CompletionMetadata.prototype, "timestamp", void 0);
CompletionMetadata = __decorate([
    (0, graphql_1.ObjectType)()
], CompletionMetadata);
let CompletionResponse = class CompletionResponse {
};
exports.CompletionResponse = CompletionResponse;
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], CompletionResponse.prototype, "text", void 0);
__decorate([
    (0, graphql_1.Field)(() => CompletionUsage),
    __metadata("design:type", CompletionUsage)
], CompletionResponse.prototype, "usage", void 0);
__decorate([
    (0, graphql_1.Field)(() => CompletionMetadata),
    __metadata("design:type", CompletionMetadata)
], CompletionResponse.prototype, "metadata", void 0);
exports.CompletionResponse = CompletionResponse = __decorate([
    (0, graphql_1.ObjectType)()
], CompletionResponse);
let StreamCompletionResponse = class StreamCompletionResponse {
};
exports.StreamCompletionResponse = StreamCompletionResponse;
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], StreamCompletionResponse.prototype, "text", void 0);
__decorate([
    (0, graphql_1.Field)(() => CompletionMetadata),
    __metadata("design:type", CompletionMetadata)
], StreamCompletionResponse.prototype, "metadata", void 0);
exports.StreamCompletionResponse = StreamCompletionResponse = __decorate([
    (0, graphql_1.ObjectType)()
], StreamCompletionResponse);
//# sourceMappingURL=completion.dto.js.map