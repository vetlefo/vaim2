export interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  memoryUsage: number;
  keyCount: number;
}

export interface ProviderMetrics {
  requestCount: number;
  errorRate: number;
  averageResponseTime: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface MetricsResponse {
  request: RequestMetrics;
  cache: CacheMetrics;
  provider: Record<string, ProviderMetrics>;
}