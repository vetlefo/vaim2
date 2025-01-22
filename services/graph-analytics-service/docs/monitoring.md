# Monitoring System

## Overview

The monitoring system provides comprehensive observability into the Graph Analytics Service through metrics collection, audit logging, and performance tracking.

## Components

### 1. Prometheus Integration

The PrometheusService provides metric collection for:

#### Operation Metrics
- `vaim_graph_operations_duration` (Histogram)
  - Tracks duration of graph operations
  - Labels: operation_type, status

#### Job Metrics
- `vaim_job_execution_duration` (Histogram)
  - Tracks analytics job execution time
  - Labels: job_type, status
- `vaim_job_status` (Counter)
  - Tracks job completion status
  - Labels: job_type, status

#### Data Retention Metrics
- `vaim_data_retention_operations` (Counter)
  - Tracks data retention operations
  - Labels: operation, status
- `vaim_archived_data_size` (Histogram)
  - Tracks size of archived data
  - Labels: data_type

#### Resource Usage Metrics
- `vaim_memory_usage` (Histogram)
  - Tracks memory usage by component
  - Labels: component
- `vaim_cpu_usage` (Histogram)
  - Tracks CPU usage percentage
  - Labels: component

#### Performance Metrics
- `vaim_request_latency` (Histogram)
  - API request latency tracking
  - Labels: endpoint, method
- `vaim_database_operations` (Histogram)
  - Database operation metrics
  - Labels: operation_type, status

### 2. Audit System

The AuditService provides comprehensive event tracking:

#### Event Types
- Node operations (create, update, delete)
- Relationship changes
- Security events
- Data retention operations

#### Audit Event Schema
```typescript
interface AuditEvent {
  timestamp: Date;
  userId: string;
  operation: 'create' | 'update' | 'delete' | 'access' | 'archive' | 'retention';
  nodeType: 'thought' | 'relationship' | 'user' | 'token' | 'data';
  metadata: {
    oldState?: any;
    newState?: any;
    branchedFrom?: number;
    reason?: string;
    securityContext?: {
      ip?: string;
      userAgent?: string;
      tokenId?: string;
    };
    retentionInfo?: {
      retentionPeriod?: number;
      archiveStatus?: 'pending' | 'completed' | 'failed';
      dataSize?: number;
    };
  };
}
```

#### Storage
- Events stored in Neo4j for persistence
- Queryable audit history
- Retention policy support

### 3. Integration Points

#### ThoughtGraph Service
- Operation timing via Prometheus
- Audit logging for mutations
- Security context tracking

#### Data Pipeline
- Job execution metrics
- Data retention tracking
- Resource utilization monitoring

## Usage

### Accessing Metrics

Metrics are exposed via the `/metrics` endpoint in Prometheus format:

```bash
curl http://localhost:3000/metrics
```

### Querying Audit Events

```typescript
// Query audit events with filters
const events = await auditService.queryAuditEvents({
  userId: 'user123',
  operation: 'create',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-22')
});
```

## Configuration

### Prometheus Configuration
- Metrics prefix: `vaim_`
- Default labels: `app: 'graph-analytics-service'`
- Custom histogram buckets for latency tracking

### Audit Configuration
- Event retention period: 90 days
- Automatic archival of old events
- Configurable storage options

## Best Practices

1. Metric Naming
   - Use consistent prefix (`vaim_`)
   - Include unit in metric name
   - Use appropriate metric types

2. Audit Events
   - Include relevant context
   - Structured metadata
   - Proper error handling

3. Performance
   - Use appropriate histogram buckets
   - Monitor cardinality
   - Regular cleanup of old data

## Testing

Comprehensive test coverage for both monitoring components:

1. PrometheusService
   - Metric registration
   - Value recording
   - Label handling

2. AuditService
   - Event logging
   - Query functionality
   - Error handling

## Future Enhancements

1. Advanced Alerting
   - Custom alert rules
   - Alert correlation
   - Notification channels

2. Extended Metrics
   - Business metrics
   - SLO tracking
   - Cost analysis

3. Audit Features
   - Advanced search
   - Export capabilities
   - Compliance reporting