# LLM Service Monitoring

## Current Implementation

### Health Checks

1. Provider Health
```typescript
@Get('health')
async healthCheck(): Promise<{ [key: string]: boolean }> {
  return {
    status: 'ok',
    providers: {
      openrouter: await this.checkProviderHealth('openrouter'),
      openrouterOpenAI: await this.checkProviderHealth('openrouterOpenAI')
    },
    redis: await this.redisService.ping()
  };
}
```

2. Redis Health
- Connection monitoring
- Ping checks
- Error tracking

3. System Health
- Basic service availability checks
- Connection status monitoring
- Error rate tracking

## Planned Enhancements

### 1. Metrics Collection

#### Request Metrics
```typescript
interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
}
```

#### Cache Metrics
```typescript
interface CacheMetrics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  memoryUsage: number;
  keyCount: number;
}
```

#### Provider Metrics
```typescript
interface ProviderMetrics {
  requestCount: number;
  errorRate: number;
  averageResponseTime: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}
```

### 2. Prometheus Integration

1. Metric Definitions
```typescript
const requestCounter = new Counter({
  name: 'llm_requests_total',
  help: 'Total number of LLM requests',
  labelNames: ['provider', 'status']
});

const latencyHistogram = new Histogram({
  name: 'llm_request_duration_seconds',
  help: 'Request duration in seconds',
  buckets: [0.1, 0.5, 1, 2, 5]
});
```

2. Metric Collection Points
```typescript
async complete(messages: ChatMessageInput[]): Promise<CompletionResponse> {
  const start = Date.now();
  try {
    const response = await this.provider.complete(messages);
    requestCounter.inc({ provider: this.provider.name, status: 'success' });
    latencyHistogram.observe((Date.now() - start) / 1000);
    return response;
  } catch (error) {
    requestCounter.inc({ provider: this.provider.name, status: 'error' });
    throw error;
  }
}
```

### 3. Alerting System

1. Alert Conditions
```yaml
alerts:
  - name: HighErrorRate
    condition: error_rate > 0.05
    duration: 5m
    severity: critical

  - name: HighLatency
    condition: p95_latency > 2000
    duration: 10m
    severity: warning

  - name: CachePerformance
    condition: cache_hit_rate < 0.5
    duration: 30m
    severity: warning
```

2. Notification Channels
- Email alerts
- Slack notifications
- PagerDuty integration

## Dashboard Implementation

### 1. Service Overview
- Request volume
- Success/error rates
- Average latency
- Active providers

### 2. Cache Performance
- Hit/miss ratios
- Memory usage
- Eviction rates
- Key distribution

### 3. Provider Metrics
- Per-provider success rates
- Response times
- Token usage
- Cost tracking

### 4. System Health
- Service status
- Resource utilization
- Error logs
- Rate limit status

## Implementation Timeline

1. Phase 1: Basic Metrics (Current)
- Health check endpoints
- Basic error tracking
- Simple status monitoring

2. Phase 2: Enhanced Metrics (Next)
- Prometheus integration
- Detailed request tracking
- Cache performance monitoring

3. Phase 3: Advanced Monitoring
- Alerting system
- Dashboards
- Automated scaling triggers

4. Phase 4: Production Optimization
- Custom metrics
- Performance optimization
- Cost optimization

## Best Practices

1. Metric Collection
- Use consistent naming
- Include relevant labels
- Maintain granular metrics
- Regular cleanup

2. Alert Configuration
- Define clear thresholds
- Avoid alert fatigue
- Include runbooks
- Regular review

3. Dashboard Organization
- Logical grouping
- Clear visualization
- Important metrics first
- Regular updates

## Future Considerations

1. Advanced Monitoring
- Machine learning for anomaly detection
- Predictive scaling
- Cost optimization analytics

2. Integration Improvements
- APM tools integration
- Log aggregation
- Trace correlation

3. Automation
- Auto-scaling rules
- Self-healing procedures
- Performance optimization