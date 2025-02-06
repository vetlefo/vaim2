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
exports.PrometheusService = void 0;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
let PrometheusService = class PrometheusService {
    constructor() {
        this.registry = new prom_client_1.Registry();
        this.requestCounter = new prom_client_1.Counter({
            name: 'llm_requests_total',
            help: 'Total number of LLM requests',
            labelNames: ['provider', 'status'],
            registers: [this.registry],
        });
        this.latencyHistogram = new prom_client_1.Histogram({
            name: 'llm_request_duration_seconds',
            help: 'Request duration in seconds',
            buckets: [0.1, 0.5, 1, 2, 5],
            labelNames: ['provider'],
            registers: [this.registry],
        });
        this.activeRequests = new prom_client_1.Gauge({
            name: 'llm_active_requests',
            help: 'Number of currently active requests',
            labelNames: ['provider'],
            registers: [this.registry],
        });
        this.cacheHitCounter = new prom_client_1.Counter({
            name: 'llm_cache_hits_total',
            help: 'Total number of cache hits',
            registers: [this.registry],
        });
        this.cacheMissCounter = new prom_client_1.Counter({
            name: 'llm_cache_misses_total',
            help: 'Total number of cache misses',
            registers: [this.registry],
        });
        this.cacheSize = new prom_client_1.Gauge({
            name: 'llm_cache_keys_total',
            help: 'Total number of keys in cache',
            registers: [this.registry],
        });
        this.cacheMemoryUsage = new prom_client_1.Gauge({
            name: 'llm_cache_memory_bytes',
            help: 'Memory usage of cache in bytes',
            registers: [this.registry],
        });
        this.providerRequestCounter = new prom_client_1.Counter({
            name: 'llm_provider_requests_total',
            help: 'Total number of requests per provider',
            labelNames: ['provider'],
            registers: [this.registry],
        });
        this.providerErrorCounter = new prom_client_1.Counter({
            name: 'llm_provider_errors_total',
            help: 'Total number of provider errors',
            labelNames: ['provider', 'error_type'],
            registers: [this.registry],
        });
        this.tokenUsageCounter = new prom_client_1.Counter({
            name: 'llm_token_usage_total',
            help: 'Total number of tokens used',
            labelNames: ['provider', 'type'],
            registers: [this.registry],
        });
        this.providerLatency = new prom_client_1.Histogram({
            name: 'llm_provider_latency_seconds',
            help: 'Provider request latency in seconds',
            buckets: [0.1, 0.5, 1, 2, 5, 10],
            labelNames: ['provider'],
            registers: [this.registry],
        });
    }
    async onModuleInit() {
        this.registry.clear();
    }
    startRequest(provider) {
        this.activeRequests.inc({ provider });
    }
    endRequest(provider, status, duration) {
        this.activeRequests.dec({ provider });
        this.requestCounter.inc({ provider, status });
        this.latencyHistogram.observe({ provider }, duration);
    }
    recordCacheHit() {
        this.cacheHitCounter.inc();
    }
    recordCacheMiss() {
        this.cacheMissCounter.inc();
    }
    updateCacheMetrics(keyCount, memoryUsage) {
        this.cacheSize.set(keyCount);
        this.cacheMemoryUsage.set(memoryUsage);
    }
    recordProviderRequest(provider) {
        this.providerRequestCounter.inc({ provider });
    }
    recordProviderError(provider, errorType) {
        this.providerErrorCounter.inc({ provider, error_type: errorType });
    }
    recordTokenUsage(provider, type, count) {
        this.tokenUsageCounter.inc({ provider, type }, count);
    }
    recordProviderLatency(provider, duration) {
        this.providerLatency.observe({ provider }, duration);
    }
    async getMetrics() {
        return this.registry.metrics();
    }
    async getMetricsResponse() {
        const metrics = await this.registry.getMetricsAsJSON();
        const response = {
            request: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageLatency: 0,
                p95Latency: 0,
                p99Latency: 0,
            },
            cache: {
                hitRate: 0,
                missRate: 0,
                evictionRate: 0,
                memoryUsage: 0,
                keyCount: 0,
            },
            provider: {},
        };
        metrics.forEach(metric => {
            var _a, _b, _c;
            switch (metric.name) {
                case 'llm_requests_total':
                    response.request.totalRequests += metric.values.reduce((sum, v) => sum + v.value, 0);
                    break;
                case 'llm_request_duration_seconds':
                    response.request.averageLatency = ((_a = metric.values.find(v => v.labels.quantile === '0.5')) === null || _a === void 0 ? void 0 : _a.value) || 0;
                    response.request.p95Latency = ((_b = metric.values.find(v => v.labels.quantile === '0.95')) === null || _b === void 0 ? void 0 : _b.value) || 0;
                    response.request.p99Latency = ((_c = metric.values.find(v => v.labels.quantile === '0.99')) === null || _c === void 0 ? void 0 : _c.value) || 0;
                    break;
            }
        });
        return response;
    }
};
exports.PrometheusService = PrometheusService;
exports.PrometheusService = PrometheusService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrometheusService);
//# sourceMappingURL=prometheus.service.js.map