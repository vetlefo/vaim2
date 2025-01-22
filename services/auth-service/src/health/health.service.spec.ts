import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { AppConfigService } from '../config/config.service';

jest.mock('pg', () => ({
  Client: jest.fn(),
}));

jest.mock('neo4j-driver', () => ({
  auth: {
    basic: jest.fn().mockReturnValue('basic-auth'),
  },
  driver: jest.fn().mockReturnValue({
    session: jest.fn().mockReturnValue({
      run: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(undefined),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('HealthService', () => {
  let service: HealthService;
  let configService: AppConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: AppConfigService,
          useValue: {
            dbConfig: async () => ({
              host: 'localhost',
              port: 5432,
              user: 'test',
              password: 'test',
              name: 'test',
            }),
            neo4jConfig: async () => ({
              uri: 'bolt://localhost:7687',
              user: 'neo4j',
              password: 'test',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    configService = module.get<AppConfigService>(AppConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkDatabaseHealth', () => {
    const mockDbConfig = {
      host: 'localhost',
      port: 5432,
      user: 'test',
      password: 'test',
      name: 'test',
    };
    const mockNeo4jConfig = {
      uri: 'bolt://localhost:7687',
      user: 'neo4j',
      password: 'test',
    };

    beforeEach(() => {
      jest.spyOn(configService, 'dbConfig').mockResolvedValue(mockDbConfig);
      jest.spyOn(configService, 'neo4jConfig').mockResolvedValue(mockNeo4jConfig);
    });

    it('should return healthy status when databases are connected', async () => {
      // Mock successful PostgreSQL connection
      const mockPgClient = {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue({ rows: [] }),
        end: jest.fn().mockResolvedValue(undefined),
      };
      require('pg').Client.mockImplementation(() => mockPgClient);

      // Mock successful Neo4j connection
      require('neo4j-driver').driver.mockReturnValue({
        session: jest.fn().mockReturnValue({
          run: jest.fn().mockResolvedValue(true),
          close: jest.fn().mockResolvedValue(undefined),
        }),
        close: jest.fn().mockResolvedValue(undefined),
      });

      const result = await service.checkDatabaseHealth();
      expect(result.status).toBe('healthy');
      expect(result.postgres).toBe('connected');
      expect(result.neo4j).toBe('connected');
    });

    it('should return unhealthy status when databases are not connected', async () => {
      // Mock failed PostgreSQL connection
      const mockPgClient = {
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
        query: jest.fn(),
        end: jest.fn().mockResolvedValue(undefined),
      };
      require('pg').Client.mockImplementation(() => mockPgClient);

      // Mock failed Neo4j connection
      require('neo4j-driver').driver.mockReturnValue({
        session: jest.fn().mockReturnValue({
          run: jest.fn().mockRejectedValue(new Error('Neo4j connection failed')),
          close: jest.fn().mockResolvedValue(undefined),
        }),
        close: jest.fn().mockResolvedValue(undefined),
      });

      const result = await service.checkDatabaseHealth();
      expect(result.status).toBe('unhealthy');
      expect(result.postgres).toBe('disconnected');
      expect(result.neo4j).toBe('disconnected');
      expect(result.details.postgres).toBe('Connection failed');
      expect(result.details.neo4j).toBe('Neo4j connection failed');
    });
  });
});