import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PageRankRequestDto, AnalyticsResultDto } from './dto/graph-analytics.dto';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useFactory: () => ({
            computePageRank: jest.fn(),
            detectCommunities: jest.fn(),
            calculateNodeSimilarity: jest.fn(),
            findShortestPath: jest.fn(),
            createGraphProjection: jest.fn(),
            dropGraphProjection: jest.fn(),
            verifyNeo4jConnection: jest.fn(),
          }),
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('computePageRank', () => {
    it('should compute PageRank successfully', async () => {
      const request: PageRankRequestDto = {
        label: 'Person',
        relationshipType: 'KNOWS',
        iterations: 20,
        dampingFactor: 0.85,
      };

      const expectedResult: AnalyticsResultDto = {
        success: true,
        data: [
          { name: 'Node1', score: 0.5 },
          { name: 'Node2', score: 0.3 },
        ],
      };

      jest.spyOn(service, 'computePageRank').mockResolvedValue(expectedResult);

      const result = await controller.computePageRank(request);

      expect(result).toBe(expectedResult);
      expect(service.computePageRank).toHaveBeenCalledWith(request);
    });

    it('should handle errors during PageRank computation', async () => {
      const request: PageRankRequestDto = {
        label: 'Person',
        relationshipType: 'KNOWS',
      };

      const expectedError: AnalyticsResultDto = {
        success: false,
        error: 'Failed to compute PageRank analytics',
        data: null,
      };

      jest.spyOn(service, 'computePageRank').mockResolvedValue(expectedError);

      const result = await controller.computePageRank(request);

      expect(result).toBe(expectedError);
      expect(service.computePageRank).toHaveBeenCalledWith(request);
    });
  });

  describe('checkHealth', () => {
    it('should return true when Neo4j connection is healthy', async () => {
      jest.spyOn(service, 'verifyNeo4jConnection').mockResolvedValue(true);

      const result = await controller.checkHealth();

      expect(result).toBe(true);
      expect(service.verifyNeo4jConnection).toHaveBeenCalled();
    });

    it('should return false when Neo4j connection is unhealthy', async () => {
      jest.spyOn(service, 'verifyNeo4jConnection').mockResolvedValue(false);

      const result = await controller.checkHealth();

      expect(result).toBe(false);
      expect(service.verifyNeo4jConnection).toHaveBeenCalled();
    });
  });
});