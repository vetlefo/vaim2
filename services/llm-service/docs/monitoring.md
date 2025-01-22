# LLM Service Monitoring

The LLM service includes comprehensive monitoring capabilities through Prometheus metrics and health checks. This document outlines the available metrics, health checks, and how to use them.

## Metrics

All metrics are exposed at the `/monitoring/metrics` endpoint in Prometheus format. A detailed JSON view is also available at `/monitoring/metrics/detailed`.

### Request Metrics

- `llm_requests_total` (Counter)
  - Total number of LLM requests
  - Labels: provider, status (success/error)

- `llm_request_duration_seconds` (Histogram)
  - Request duration in seconds
  - Labels: provider
  - Buckets: 0.1, 0.5, 1, 2, 5

- `llm_active_requests` (Gauge)
  - Number of currently active requests
  - Labels: provider

### Cache Metrics

- `llm_cache_hits_total` (Counter)
  - Total number of cache hits

- `llm_cache_misses_total` (Counter)
  - Total number of cache misses

- `llm_cache_keys_total` (Gauge)
  - Total number of keys in cache

- `llm_cache_memory_bytes` (Gauge)
  - Memory usage of cache in bytes

### Provider Metrics

- `llm_provider_requests_total` (Counter)
  - Total number of requests per provider
  - Labels: provider

- `llm_provider_errors_total` (Counter)
  - Total number of provider errors
  - Labels: provider, error_type

- `llm_token_usage_total` (Counter)
  - Total number of tokens used
  - Labels: provider, type (prompt/completion)

- `llm_provider_latency_seconds` (Histogram)
  - Provider request latency in seconds
  - Labels: provider
  - Buckets: 0.1, 0.5, 1, 2, 5, 10

## Health Checks

The service provides health checks at `/monitoring/health` with detailed status for:

### Redis Health
- Connection status
- Latency measurements
- Memory usage

### Provider Health
- OpenRouter status and latency
  - All models (Claude, GPT-4, etc.) are accessed through OpenRouter
  - Individual model availability
  - Rate limit status
- DeepSeek direct access (if configured)
  - Connection status
  - API response times

### System Health
- Overall error rate
- Active request count
- Average response times
- Resource utilization

## Alerting

The service is designed to work with Prometheus alerting rules. Recommended alerts:

```yaml
groups:
- name: llm_service_alerts
  rules:
  - alert: HighErrorRate
    expr: rate(llm_provider_errors_total[5m]) / rate(llm_requests_total[5m]) > 0.05
    for: 5m
    labels:
      severity: warning
    annotations:
      description: "Error rate above 5% for {{ $labels.provider }}"

  - alert: HighLatency
    expr: histogram_quantile(0.95, rate(llm_request_duration_seconds_bucket[5m])) > 5
    for: 5m
    labels:
      severity: warning
    annotations:
      description: "95th percentile latency above 5s for {{ $labels.provider }}"

  - alert: CacheMemoryHigh
    expr: llm_cache_memory_bytes > 1e9
    for: 15m
    labels:
      severity: warning
    annotations:
      description: "Cache memory usage above 1GB"

  - alert: ProviderDown
    expr: up{job="llm_service"} == 0
    for: 5m
    labels:
      severity: critical
    annotations:
      description: "Provider {{ $labels.provider }} is down"
```

## Grafana Dashboards

A sample Grafana dashboard configuration is available in `monitoring/dashboards/llm-service.json`. The dashboard includes:

- Request rate and latency graphs
- Error rate tracking
- Cache performance metrics
- Provider-specific panels
- Resource utilization graphs

## Best Practices

1. **Regular Monitoring**
   - Check error rates and latencies daily
   - Monitor cache hit rates for optimization
   - Track token usage per provider

2. **Alerting Configuration**
   - Set up alerts for error spikes
   - Monitor rate limit approaches
   - Track unusual latency patterns

3. **Resource Management**
   - Monitor cache memory usage
   - Track active request counts
   - Watch for provider-specific issues

4. **Performance Optimization**
   - Use metrics to identify bottlenecks
   - Optimize cache settings based on hit rates
   - Adjust rate limits based on usage patterns

## Integration with External Systems

The monitoring system is designed to integrate with:

- Prometheus for metrics collection
- Grafana for visualization
- AlertManager for alert routing
- ELK Stack for log aggregation
- DataDog for APM (if configured)

## Future Enhancements

Planned monitoring improvements:

1. Cost tracking metrics per provider
2. Enhanced token usage analytics
3. Machine learning model performance metrics
4. Advanced anomaly detection
5. Custom provider health checks
6. Automated performance optimization

For more information on setting up monitoring, see the [Monitoring Setup Guide](./monitoring-setup.md).