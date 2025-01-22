import { Injectable, Logger } from '@nestjs/common';
import { Counter, Histogram, register } from 'prom-client';
import { Neo4jService } from '../neo4j/neo4j.service';

export interface AuditEvent {
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

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  private auditCounter = new Counter({
    name: 'vaim_audit_events_total',
    help: 'Total count of audit events',
    labelNames: ['operation', 'node_type', 'user_id'],
  });

  private thoughtNodeCounter = new Counter({
    name: 'vaim_thought_nodes_total',
    help: 'Total count of thought nodes created',
  });

  private securityEventCounter = new Counter({
    name: 'vaim_security_events_total',
    help: 'Total count of security-related events',
    labelNames: ['event_type', 'status'],
  });

  private retentionEventCounter = new Counter({
    name: 'vaim_retention_events_total',
    help: 'Total count of data retention events',
    labelNames: ['operation', 'status'],
  });

  constructor(private readonly neo4jService: Neo4jService) {
    register.metrics();
  }

  async logEvent(event: AuditEvent) {
    // Increment metrics
    this.auditCounter.inc({
      operation: event.operation,
      node_type: event.nodeType,
      user_id: event.userId,
    });

    if (event.operation === 'create' && event.nodeType === 'thought') {
      this.thoughtNodeCounter.inc();
    }

    // Track security events
    if (event.metadata.securityContext) {
      this.securityEventCounter.inc({
        event_type: event.operation,
        status: 'recorded',
      });
    }

    // Track retention events
    if (event.metadata.retentionInfo) {
      this.retentionEventCounter.inc({
        operation: event.operation,
        status: event.metadata.retentionInfo.archiveStatus || 'processed',
      });
    }

    try {
      // Store audit event in Neo4j
      await this.neo4jService.executeQuery(
        `
        CREATE (a:AuditEvent {
          id: randomUUID(),
          timestamp: datetime($timestamp),
          userId: $userId,
          operation: $operation,
          nodeType: $nodeType,
          metadata: $metadata
        })
        `,
        {
          timestamp: event.timestamp.toISOString(),
          userId: event.userId,
          operation: event.operation,
          nodeType: event.nodeType,
          metadata: JSON.stringify(event.metadata),
        },
        'create_audit_event'
      );

      this.logger.debug(`Audit event stored: ${JSON.stringify(event)}`);
    } catch (error) {
      this.logger.error(`Failed to store audit event: ${error.message}`, error.stack);
      throw error;
    }
  }

  async queryAuditEvents(filters: {
    userId?: string;
    operation?: string;
    nodeType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const conditions = [];
    const params: Record<string, any> = {};

    if (filters.userId) {
      conditions.push('a.userId = $userId');
      params.userId = filters.userId;
    }

    if (filters.operation) {
      conditions.push('a.operation = $operation');
      params.operation = filters.operation;
    }

    if (filters.nodeType) {
      conditions.push('a.nodeType = $nodeType');
      params.nodeType = filters.nodeType;
    }

    if (filters.startDate) {
      conditions.push('a.timestamp >= datetime($startDate)');
      params.startDate = filters.startDate.toISOString();
    }

    if (filters.endDate) {
      conditions.push('a.timestamp <= datetime($endDate)');
      params.endDate = filters.endDate.toISOString();
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return this.neo4jService.executeQuery(
      `
      MATCH (a:AuditEvent)
      ${whereClause}
      RETURN a
      ORDER BY a.timestamp DESC
      LIMIT 1000
      `,
      params,
      'query_audit_events'
    );
  }
}