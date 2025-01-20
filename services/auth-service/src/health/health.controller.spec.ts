import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            checkDatabaseHealth: jest.fn().mockResolvedValue({
              status: 'healthy',
              postgres: 'connected',
              neo4j: 'connected',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const result = await controller.checkHealth();
      expect(result).toEqual({
        status: 'healthy',
        postgres: 'connected',
        neo4j: 'connected',
      });
      expect(healthService.checkDatabaseHealth).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      jest.spyOn(healthService, 'checkDatabaseHealth').mockRejectedValue(new Error('Service unavailable'));
      
      await expect(controller.checkHealth()).rejects.toThrow('Service unavailable');
    });
  });
});