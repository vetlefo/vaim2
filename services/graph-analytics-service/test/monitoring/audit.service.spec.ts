import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../../src/monitoring/audit.service';
import { Neo4jService } from '../../src/neo4j/neo4j.service';
import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { Record as Neo4jRecord } from 'neo4j-driver';

// Create a simple mock with type assertion
const mockNeo4jService = {
  executeQuery: jest.fn(),
} as unknown as jest.Mocked<Neo4jService>;

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: Neo4jService,
          useValue: mockNeo4jService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logEvent', () => {
    const testEvent = {
      timestamp: new Date(),
      userId: 'test-user',
      operation: 'create' as const,
      nodeType: 'thought' as const,
      metadata: {
        oldState: null,
        newState: { content: 'test thought' },
      },
    };

    it('should store audit event in Neo4j', async () => {
      mockNeo4jService.executeQuery.mockResolvedValueOnce([] as unknown as Neo4jRecord[]);

      await service.logEvent(testEvent);

      expect(mockNeo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('CREATE (a:AuditEvent'),
        expect.objectContaining({
          timestamp: testEvent.timestamp.toISOString(),
          userId: testEvent.userId,
          operation: testEvent.operation,
          nodeType: testEvent.nodeType,
          metadata: JSON.stringify(testEvent.metadata),
        }),
        'create_audit_event'
      );
    });

    it('should handle security context events', async () => {
      const securityEvent = {
        ...testEvent,
        metadata: {
          ...testEvent.metadata,
          securityContext: {
            ip: '127.0.0.1',
            userAgent: 'test-agent',
            tokenId: 'test-token',
          },
        },
      };

      mockNeo4jService.executeQuery.mockResolvedValueOnce([] as unknown as Neo4jRecord[]);

      await service.logEvent(securityEvent);

      expect(mockNeo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('CREATE (a:AuditEvent'),
        expect.objectContaining({
          metadata: expect.stringContaining('securityContext'),
        }),
        'create_audit_event'
      );
    });

    it('should handle retention events', async () => {
      const retentionEvent = {
        ...testEvent,
        operation: 'retention' as const,
        metadata: {
          retentionInfo: {
            retentionPeriod: 30,
            archiveStatus: 'completed' as const,
            dataSize: 1024,
          },
        },
      };

      mockNeo4jService.executeQuery.mockResolvedValueOnce([] as unknown as Neo4jRecord[]);

      await service.logEvent(retentionEvent);

      expect(mockNeo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('CREATE (a:AuditEvent'),
        expect.objectContaining({
          metadata: expect.stringContaining('retentionInfo'),
        }),
        'create_audit_event'
      );
    });

    it('should handle Neo4j errors', async () => {
      const error = new Error('Neo4j error');
      mockNeo4jService.executeQuery.mockRejectedValueOnce(error);

      await expect(service.logEvent(testEvent)).rejects.toThrow(error);
    });
  });

  describe('queryAuditEvents', () => {
    it('should query audit events with filters', async () => {
      const filters = {
        userId: 'test-user',
        operation: 'create',
        nodeType: 'thought',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-22'),
      };

      mockNeo4jService.executeQuery.mockResolvedValueOnce([] as unknown as Neo4jRecord[]);

      await service.queryAuditEvents(filters);

      expect(mockNeo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (a:AuditEvent)'),
        expect.objectContaining({
          userId: filters.userId,
          operation: filters.operation,
          nodeType: filters.nodeType,
          startDate: filters.startDate.toISOString(),
          endDate: filters.endDate.toISOString(),
        }),
        'query_audit_events'
      );
    });

    it('should handle partial filters', async () => {
      const filters = {
        userId: 'test-user',
      };

      mockNeo4jService.executeQuery.mockResolvedValueOnce([] as unknown as Neo4jRecord[]);

      await service.queryAuditEvents(filters);

      expect(mockNeo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE a.userId = $userId'),
        expect.objectContaining({
          userId: filters.userId,
        }),
        'query_audit_events'
      );
    });

    it('should handle no filters', async () => {
      mockNeo4jService.executeQuery.mockResolvedValueOnce([] as unknown as Neo4jRecord[]);

      await service.queryAuditEvents({});

      expect(mockNeo4jService.executeQuery).toHaveBeenCalledWith(
        expect.not.stringContaining('WHERE'),
        expect.any(Object),
        'query_audit_events'
      );
    });
  });
});