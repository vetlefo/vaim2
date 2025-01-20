import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { Neo4jService } from '../neo4j/neo4j.service';
import { ConfigService } from '../config/config.service';
import { PageRankRequestDto } from './dto/graph-analytics.dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let neo4jService: Neo4jService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: Neo4jService,
          useFactory: () => ({
            runPageRank: jest.fn(),
            findCommunities: jest.fn(),
            calculateNodeSimilarity: jest.fn(),
            findShortestPath: jest.fn(),
            createGraphProjection: jest.fn(),
            dropGraphProjection: jest.fn(),
            verifyConnection: jest.fn(),
          }),
        },
        {
          provide: ConfigService,
          useFactory: () => ({
            neo4jUri: 'bolt://localhost:7687',
            neo4jUsername: 'neo4j',
            neo4jPassword: 'test',
          }),
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    neo4jService = module.get<Neo4jService>(Neo4jService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('computePageRank', () => {
    it('should compute PageRank successfully', async () => {
      // Create a simplified mock that matches the structure we use
      const mockRecords = [
        { get: jest.fn().mockImplementation(key => key === 'name' ? 'Node1' : 0.5) },
        { get: jest.fn().mockImplementation(key => key === 'name' ? 'Node2' : 0.3) },
      ];

      const mockResult = {
        records: mockRecords,
      };

      const request: PageRankRequestDto = {
        label: 'Person',
        relationshipType: 'KNOWS',
        iterations: 20,
        dampingFactor: 0.85,
      };

      jest.spyOn(neo4jService, 'runPageRank').mockResolvedValue(mockResult as any);

      const result = await service.computePageRank(request);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({ name: 'Node1', score: 0.5 });
      expect(result.data[1]).toEqual({ name: 'Node2', score: 0.3 });
      expect(neo4jService.runPageRank).toHaveBeenCalledWith({
        label: 'Person',
        relationshipType: 'KNOWS',
        iterations: 20,
        dampingFactor: 0.85,
      });
    });

    it('should handle errors during PageRank computation', async () => {
      const request: PageRankRequestDto = {
        label: 'Person',
        relationshipType: 'KNOWS',
      };

      jest.spyOn(neo4jService, 'runPageRank').mockRejectedValue(new Error('Database error'));

      const result = await service.computePageRank(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to compute PageRank analytics');
      expect(result.data).toBeNull();
    });
  });

  describe('verifyNeo4jConnection', () => {
    it('should return true when connection is successful', async () => {
      jest.spyOn(neo4jService, 'verifyConnection').mockResolvedValue(true);

      const result = await service.verifyNeo4jConnection();

      expect(result).toBe(true);
      expect(neo4jService.verifyConnection).toHaveBeenCalled();
    });

    it('should return false when connection fails', async () => {
      jest.spyOn(neo4jService, 'verifyConnection').mockResolvedValue(false);

      const result = await service.verifyNeo4jConnection();

      expect(result).toBe(false);
      expect(neo4jService.verifyConnection).toHaveBeenCalled();
    });
  });
});