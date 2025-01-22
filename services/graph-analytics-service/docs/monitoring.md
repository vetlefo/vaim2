# ThoughtGraph Monitoring System

## Architecture Integration
- **Prometheus Metrics** (Phase 4)
  - `vaim_thought_nodes_total` - Counter for total thought nodes
  - `vaim_graph_operations_duration` - Histogram for GDS operation timing
  - `vaim_llm_integration_errors` - Error counter for LLM service calls

## Alerting Rules
```yaml
groups:
- name: ThoughtGraphAlerts
  rules:
  - alert: HighRevisionRate
    expr: rate(vaim_graph_operations{type="revisions"}[5m]) > 10
    labels:
      severity: warning
    annotations:
      summary: "High thought revision rate detected"
      
  - alert: LLMIntegrationFailure
    expr: vaim_llm_integration_errors > 5
    labels:
      severity: critical
```

## Audit Logging Implementation
```typescript
// src/monitoring/audit.service.ts
interface AuditEvent {
  timestamp: Date;
  userId: string;
  operation: 'create' | 'update' | 'delete';
  nodeType: 'thought' | 'relationship';
  metadata: {
    oldState?: any;
    newState?: any;
  };
}
```

## Performance Monitoring
- Neo4j GDS operation tracking
- LLM response time percentiles
- Memory usage per graph operation

## Security Monitoring
- Authentication event tracking
- RBAC policy enforcement metrics
- Token usage patterns

[Back to Phase 3 Implementation](../phases/phase3.md)