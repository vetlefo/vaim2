"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const rate_limit_guard_1 = require("./rate-limit.guard");
const rate_limit_service_1 = require("./rate-limit.service");
const ts_jest_1 = require("@golevelup/ts-jest");
describe('RateLimitGuard', () => {
    let guard;
    let rateLimitService;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                rate_limit_guard_1.RateLimitGuard,
                {
                    provide: rate_limit_service_1.RateLimitService,
                    useValue: {
                        isRateLimited: jest.fn(),
                        getRemainingRequests: jest.fn(),
                        getCachedResponse: jest.fn(),
                    },
                },
            ],
        }).compile();
        guard = module.get(rate_limit_guard_1.RateLimitGuard);
        rateLimitService = module.get(rate_limit_service_1.RateLimitService);
    });
    it('should be defined', () => {
        expect(guard).toBeDefined();
    });
    describe('canActivate', () => {
        it('should allow request when not rate limited', async () => {
            const mockContext = (0, ts_jest_1.createMock)({
                switchToHttp: () => ({
                    getRequest: () => ({
                        ip: '127.0.0.1',
                        path: '/completion',
                        method: 'POST',
                        body: { provider: 'openrouter' },
                    }),
                }),
            });
            jest.spyOn(rateLimitService, 'isRateLimited').mockResolvedValue(false);
            const result = await guard.canActivate(mockContext);
            expect(result).toBe(true);
        });
        it('should throw when globally rate limited', async () => {
            const mockContext = (0, ts_jest_1.createMock)({
                switchToHttp: () => ({
                    getRequest: () => ({
                        ip: '127.0.0.1',
                        path: '/completion',
                        method: 'POST',
                        body: { provider: 'openrouter' },
                    }),
                }),
            });
            jest.spyOn(rateLimitService, 'isRateLimited').mockResolvedValueOnce(true);
            jest.spyOn(rateLimitService, 'getRemainingRequests').mockResolvedValueOnce(0);
            await expect(guard.canActivate(mockContext)).rejects.toThrow(new common_1.HttpException({
                statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                message: 'Global rate limit exceeded',
                remainingRequests: 0,
            }, common_1.HttpStatus.TOO_MANY_REQUESTS));
        });
        it('should throw when provider rate limited', async () => {
            const mockContext = (0, ts_jest_1.createMock)({
                switchToHttp: () => ({
                    getRequest: () => ({
                        ip: '127.0.0.1',
                        path: '/completion',
                        method: 'POST',
                        body: { provider: 'openrouter' },
                    }),
                }),
            });
            jest.spyOn(rateLimitService, 'isRateLimited')
                .mockResolvedValueOnce(false)
                .mockResolvedValueOnce(true);
            jest.spyOn(rateLimitService, 'getRemainingRequests').mockResolvedValueOnce(0);
            await expect(guard.canActivate(mockContext)).rejects.toThrow(new common_1.HttpException({
                statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                message: 'Rate limit exceeded for provider: openrouter',
                remainingRequests: 0,
            }, common_1.HttpStatus.TOO_MANY_REQUESTS));
        });
        it('should return cached response when available', async () => {
            const cachedResponse = { text: 'cached response' };
            const mockContext = (0, ts_jest_1.createMock)({
                switchToHttp: () => ({
                    getRequest: () => ({
                        ip: '127.0.0.1',
                        path: '/completion',
                        method: 'POST',
                        body: { provider: 'openrouter', prompt: 'test prompt' },
                    }),
                }),
            });
            jest.spyOn(rateLimitService, 'isRateLimited').mockResolvedValue(false);
            jest.spyOn(rateLimitService, 'getCachedResponse').mockResolvedValue(JSON.stringify(cachedResponse));
            await expect(guard.canActivate(mockContext)).rejects.toThrow(new common_1.HttpException({
                statusCode: common_1.HttpStatus.OK,
                message: 'Cached response',
                data: cachedResponse,
                cached: true,
            }, common_1.HttpStatus.OK));
        });
    });
});
//# sourceMappingURL=rate-limit.guard.spec.js.map