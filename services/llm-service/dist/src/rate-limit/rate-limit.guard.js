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
var RateLimitGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = void 0;
exports.UseRateLimit = UseRateLimit;
const common_1 = require("@nestjs/common");
const rate_limit_service_1 = require("./rate-limit.service");
let RateLimitGuard = RateLimitGuard_1 = class RateLimitGuard {
    constructor(rateLimitService) {
        this.rateLimitService = rateLimitService;
        this.logger = new common_1.Logger(RateLimitGuard_1.name);
    }
    async canActivate(context) {
        var _a, _b, _c;
        const request = context.switchToHttp().getRequest();
        const userId = ((_a = request.user) === null || _a === void 0 ? void 0 : _a['id']) || request.ip;
        const provider = (_b = request.body) === null || _b === void 0 ? void 0 : _b.provider;
        try {
            const isGloballyLimited = await this.rateLimitService.isRateLimited(userId);
            if (isGloballyLimited) {
                const remaining = await this.rateLimitService.getRemainingRequests(userId);
                throw new common_1.HttpException({
                    statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                    message: 'Global rate limit exceeded',
                    remainingRequests: remaining,
                }, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            if (provider) {
                const isProviderLimited = await this.rateLimitService.isRateLimited(userId, provider);
                if (isProviderLimited) {
                    const remaining = await this.rateLimitService.getRemainingRequests(userId, provider);
                    throw new common_1.HttpException({
                        statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                        message: `Rate limit exceeded for provider: ${provider}`,
                        remainingRequests: remaining,
                    }, common_1.HttpStatus.TOO_MANY_REQUESTS);
                }
            }
            if (request.method === 'POST' && ((_c = request.body) === null || _c === void 0 ? void 0 : _c.prompt) && provider) {
                const cachedResponse = await this.rateLimitService.getCachedResponse(request.body.prompt, provider);
                if (cachedResponse) {
                    this.logger.debug(`Cache hit for prompt with provider: ${provider}`);
                    throw new common_1.HttpException({
                        statusCode: common_1.HttpStatus.OK,
                        message: 'Cached response',
                        data: JSON.parse(cachedResponse),
                        cached: true,
                    }, common_1.HttpStatus.OK);
                }
            }
            return true;
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error('Rate limit check failed:', error);
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Rate limit check failed',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = RateLimitGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rate_limit_service_1.RateLimitService])
], RateLimitGuard);
function UseRateLimit() {
    return function (target, propertyKey, descriptor) {
        if (descriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = async function (...args) {
                return originalMethod.apply(this, args);
            };
        }
        return target;
    };
}
//# sourceMappingURL=rate-limit.guard.js.map