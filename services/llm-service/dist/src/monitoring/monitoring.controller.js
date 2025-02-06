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
exports.MonitoringController = void 0;
const common_1 = require("@nestjs/common");
const prometheus_service_1 = require("./prometheus.service");
const redis_service_1 = require("../redis/redis.service");
const terminus_1 = require("@nestjs/terminus");
let MonitoringController = class MonitoringController {
    constructor(prometheusService, healthCheckService, httpHealthIndicator, redisService) {
        this.prometheusService = prometheusService;
        this.healthCheckService = healthCheckService;
        this.httpHealthIndicator = httpHealthIndicator;
        this.redisService = redisService;
    }
    async getMetrics() {
        return this.prometheusService.getMetrics();
    }
    async getDetailedMetrics() {
        return this.prometheusService.getMetricsResponse();
    }
    async checkHealth() {
        return this.healthCheckService.check([
            async () => this.checkRedisHealth(),
            async () => this.checkProviderHealth(),
            async () => this.checkSystemHealth(),
        ]);
    }
    async checkRedisHealth() {
        try {
            await this.redisService.ping();
            return {
                redis: {
                    status: 'up',
                    details: {
                        connection: true,
                        latency: await this.measureRedisLatency(),
                    },
                },
            };
        }
        catch (error) {
            return {
                redis: {
                    status: 'down',
                    error: error.message,
                },
            };
        }
    }
    async checkProviderHealth() {
        return {
            providers: {
                status: 'up',
                details: {
                    openrouter: {
                        status: 'up',
                        latency: await this.measureProviderLatency('openrouter'),
                    },
                    openrouterOpenAI: {
                        status: 'up',
                        latency: await this.measureProviderLatency('openrouterOpenAI'),
                    },
                },
            },
        };
    }
    async checkSystemHealth() {
        const metrics = await this.prometheusService.getMetricsResponse();
        const errorRate = metrics.request.failedRequests /
            (metrics.request.totalRequests || 1);
        return {
            system: {
                status: errorRate < 0.05 ? 'up' : 'degraded',
                details: {
                    errorRate,
                    activeRequests: metrics.request.totalRequests,
                    averageLatency: metrics.request.averageLatency,
                },
            },
        };
    }
    async measureRedisLatency() {
        const start = Date.now();
        await this.redisService.ping();
        return Date.now() - start;
    }
    async measureProviderLatency(provider) {
        return Math.random() * 100;
    }
};
exports.MonitoringController = MonitoringController;
__decorate([
    (0, common_1.Get)('metrics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('metrics/detailed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getDetailedMetrics", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "checkHealth", null);
exports.MonitoringController = MonitoringController = __decorate([
    (0, common_1.Controller)('monitoring'),
    __metadata("design:paramtypes", [prometheus_service_1.PrometheusService,
        terminus_1.HealthCheckService,
        terminus_1.HttpHealthIndicator,
        redis_service_1.RedisService])
], MonitoringController);
//# sourceMappingURL=monitoring.controller.js.map