import { PrometheusService } from './prometheus.service';
import { RedisService } from '../redis/redis.service';
import { HealthCheckService, HealthCheckResult, HttpHealthIndicator } from '@nestjs/terminus';
import { MetricsResponse } from './interfaces/metrics.interface';
export declare class MonitoringController {
    private readonly prometheusService;
    private readonly healthCheckService;
    private readonly httpHealthIndicator;
    private readonly redisService;
    constructor(prometheusService: PrometheusService, healthCheckService: HealthCheckService, httpHealthIndicator: HttpHealthIndicator, redisService: RedisService);
    getMetrics(): Promise<string>;
    getDetailedMetrics(): Promise<MetricsResponse>;
    checkHealth(): Promise<HealthCheckResult>;
    private checkRedisHealth;
    private checkProviderHealth;
    private checkSystemHealth;
    private measureRedisLatency;
    private measureProviderLatency;
}
