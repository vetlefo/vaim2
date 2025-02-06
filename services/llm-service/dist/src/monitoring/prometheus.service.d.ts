import { OnModuleInit } from '@nestjs/common';
import { MetricsResponse } from './interfaces/metrics.interface';
export declare class PrometheusService implements OnModuleInit {
    private readonly registry;
    private readonly requestCounter;
    private readonly latencyHistogram;
    private readonly activeRequests;
    private readonly cacheHitCounter;
    private readonly cacheMissCounter;
    private readonly cacheSize;
    private readonly cacheMemoryUsage;
    private readonly providerRequestCounter;
    private readonly providerErrorCounter;
    private readonly tokenUsageCounter;
    private readonly providerLatency;
    constructor();
    onModuleInit(): Promise<void>;
    startRequest(provider: string): void;
    endRequest(provider: string, status: 'success' | 'error', duration: number): void;
    recordCacheHit(): void;
    recordCacheMiss(): void;
    updateCacheMetrics(keyCount: number, memoryUsage: number): void;
    recordProviderRequest(provider: string): void;
    recordProviderError(provider: string, errorType: string): void;
    recordTokenUsage(provider: string, type: 'prompt' | 'completion', count: number): void;
    recordProviderLatency(provider: string, duration: number): void;
    getMetrics(): Promise<string>;
    getMetricsResponse(): Promise<MetricsResponse>;
}
