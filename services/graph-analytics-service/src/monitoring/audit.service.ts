import { Injectable } from '@nestjs/common';
import { Counter, Histogram, register } from 'prom-client';

export interface AuditEvent {
  timestamp: Date;
  userId: string;
  operation: 'create' | 'update' | 'delete';
  nodeType: 'thought' | 'relationship';
  metadata: {
    oldState?: any;
    newState?: any;
    branchedFrom?: number;  // Added for branch operations
    reason?: string;        // Added for documenting changes
  };
}

@Injectable()
export class AuditService {
  private auditCounter = new Counter({
    name: 'vaim_audit_events_total',
    help: 'Total count of audit events',
    labelNames: ['operation', 'node_type', 'user_id'],
  });

  private thoughtNodeCounter = new Counter({
    name: 'vaim_thought_nodes_total',
    help: 'Total count of thought nodes created',
  });

  constructor() {
    register.metrics();
  }

  logEvent(event: AuditEvent) {
    this.auditCounter.inc({
      operation: event.operation,
      node_type: event.nodeType,
      user_id: event.userId,
    });

    if (event.operation === 'create' && event.nodeType === 'thought') {
      this.thoughtNodeCounter.inc();
    }

    // TODO: Implement actual audit storage
    console.log(`[Audit] ${JSON.stringify(event)}`);
  }
}