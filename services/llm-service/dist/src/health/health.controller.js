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
var HealthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const redis_service_1 = require("../redis/redis.service");
const llm_service_1 = require("../llm/llm.service");
let HealthController = HealthController_1 = class HealthController {
    constructor(health, redisService, llmService) {
        this.health = health;
        this.redisService = redisService;
        this.llmService = llmService;
        this.logger = new common_1.Logger(HealthController_1.name);
    }
    async check() {
        return this.health.check([
            async () => {
                try {
                    const isRedisHealthy = await this.redisService.ping();
                    return {
                        redis: {
                            status: isRedisHealthy ? 'up' : 'down',
                        },
                    };
                }
                catch (error) {
                    this.logger.error('Redis health check failed:', error);
                    return {
                        redis: {
                            status: 'down',
                            error: error.message,
                        },
                    };
                }
            },
            async () => {
                try {
                    const providerHealth = await this.llmService.healthCheck();
                    const isAnyProviderHealthy = Object.values(providerHealth).some((healthy) => healthy);
                    return {
                        llm: {
                            status: isAnyProviderHealthy ? 'up' : 'down',
                            providers: providerHealth,
                        },
                    };
                }
                catch (error) {
                    this.logger.error('LLM health check failed:', error);
                    return {
                        llm: {
                            status: 'down',
                            error: error.message,
                        },
                    };
                }
            },
        ]);
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = HealthController_1 = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        redis_service_1.RedisService,
        llm_service_1.LLMService])
], HealthController);
//# sourceMappingURL=health.controller.js.map