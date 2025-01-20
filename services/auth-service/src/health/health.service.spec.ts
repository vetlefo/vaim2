import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { AppConfigService } from '../config/config.service';

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
            dbConfig: {
              host: 'localhost',
              port: 5432,
              user: 'test',
              password: 'test',
              name: 'test',
            },
            neo4jConfig: {
              uri: 'bolt://localhost:7687',
              user: 'neo4j',
              password: 'test',
            },
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
    it('should return healthy status when databases are connected', async () => {
      const result = await service.checkDatabaseHealth();
      expect(result.status).toBe('healthy');
    });

    it('should return unhealthy status when databases are not connected', async () => {
      jest.spyOn(service, 'checkDatabaseHealth').mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await service.checkDatabaseHealth();
      expect(result.status).toBe('unhealthy');
    });
  });
});