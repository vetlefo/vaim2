import { Injectable, OnModuleInit } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { MetricsResponse, ProviderMetrics } from './interfaces/metrics.interface';

@Injectable()
export class PrometheusService implements OnModuleInit {
  private readonly registry: Registry;
  
  // Request metrics
  private readonly requestCounter: Counter<string>;
  private readonly latencyHistogram: Histogram<string>;
  private readonly activeRequests: Gauge<string>;
  
  // Cache metrics
  private readonly cacheHitCounter: Counter<string>;
  private readonly cacheMissCounter: Counter<string>;
  private readonly cacheSize: Gauge<string>;
  private readonly cacheMemoryUsage: Gauge<string>;
  
  // Provider metrics
  private readonly providerRequestCounter: Counter<string>;
  private readonly providerErrorCounter: Counter<string>;
  private readonly tokenUsageCounter: Counter<string>;
  private readonly providerLatency: Histogram<string>;

  constructor() {
    this.registry = new Registry();
    
    // Initialize request metrics
    this.requestCounter = new Counter({
      name: 'llm_requests_total',
      help: 'Total number of LLM requests',
      labelNames: ['provider', 'status'],
      registers: [this.registry],
    });

    this.latencyHistogram = new Histogram({
      name: 'llm_request_duration_seconds',
      help: 'Request duration in seconds',
      buckets: [0.1, 0.5, 1, 2, 5],
      labelNames: ['provider'],
      registers: [this.registry],
    });

    this.activeRequests = new Gauge({
      name: 'llm_active_requests',
      help: 'Number of currently active requests',
      labelNames: ['provider'],
      registers: [this.registry],
    });

    // Initialize cache metrics
    this.cacheHitCounter = new Counter({
      name: 'llm_cache_hits_total',
      help: 'Total number of cache hits',
      registers: [this.registry],
    });

    this.cacheMissCounter = new Counter({
      name: 'llm_cache_misses_total',
      help: 'Total number of cache misses',
      registers: [this.registry],
    });

    this.cacheSize = new Gauge({
      name: 'llm_cache_keys_total',
      help: 'Total number of keys in cache',
      registers: [this.registry],
    });

    this.cacheMemoryUsage = new Gauge({
      name: 'llm_cache_memory_bytes',
      help: 'Memory usage of cache in bytes',
      registers: [this.registry],
    });

    // Initialize provider metrics
    this.providerRequestCounter = new Counter({
      name: 'llm_provider_requests_total',
      help: 'Total number of requests per provider',
      labelNames: ['provider'],
      registers: [this.registry],
    });

    this.providerErrorCounter = new Counter({
      name: 'llm_provider_errors_total',
      help: 'Total number of provider errors',
      labelNames: ['provider', 'error_type'],
      registers: [this.registry],
    });

    this.tokenUsageCounter = new Counter({
      name: 'llm_token_usage_total',
      help: 'Total number of tokens used',
      labelNames: ['provider', 'type'],
      registers: [this.registry],
    });

    this.providerLatency = new Histogram({
      name: 'llm_provider_latency_seconds',
      help: 'Provider request latency in seconds',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      labelNames: ['provider'],
      registers: [this.registry],
    });
  }

  async onModuleInit() {
    // Clear any existing metrics
    this.registry.clear();
  }

  // Request tracking methods
  startRequest(provider: string) {
    this.activeRequests.inc({ provider });
  }

  endRequest(provider: string, status: 'success' | 'error', duration: number) {
    this.activeRequests.dec({ provider });
    this.requestCounter.inc({ provider, status });
    this.latencyHistogram.observe({ provider }, duration);
  }

  // Cache tracking methods
  recordCacheHit() {
    this.cacheHitCounter.inc();
  }

  recordCacheMiss() {
    this.cacheMissCounter.inc();
  }

  updateCacheMetrics(keyCount: number, memoryUsage: number) {
    this.cacheSize.set(keyCount);
    this.cacheMemoryUsage.set(memoryUsage);
  }

  // Provider tracking methods
  recordProviderRequest(provider: string) {
    this.providerRequestCounter.inc({ provider });
  }

  recordProviderError(provider: string, errorType: string) {
    this.providerErrorCounter.inc({ provider, error_type: errorType });
  }

  recordTokenUsage(provider: string, type: 'prompt' | 'completion', count: number) {
    this.tokenUsageCounter.inc({ provider, type }, count);
  }

  recordProviderLatency(provider: string, duration: number) {
    this.providerLatency.observe({ provider }, duration);
  }

  // Metrics collection
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  async getMetricsResponse(): Promise<MetricsResponse> {
    const metrics = await this.registry.getMetricsAsJSON();
    
    // Process metrics into structured response
    const response: MetricsResponse = {
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

    // Process metrics to populate response
    metrics.forEach(metric => {
      switch (metric.name) {
        case 'llm_requests_total':
          response.request.totalRequests += metric.values.reduce((sum, v) => sum + v.value, 0);
          break;
        case 'llm_request_duration_seconds':
          response.request.averageLatency = metric.values.find(v => v.labels.quantile === '0.5')?.value || 0;
          response.request.p95Latency = metric.values.find(v => v.labels.quantile === '0.95')?.value || 0;
          response.request.p99Latency = metric.values.find(v => v.labels.quantile === '0.99')?.value || 0;
          break;
        // Add more metric processing as needed
      }
    });

    return response;
  }
}