import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { RateLimitGuard } from '../src/rate-limit/rate-limit.guard';
import { RateLimitService } from '../src/rate-limit/rate-limit.service';

export let app: INestApplication;
export let rateLimitService: RateLimitService;

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    providers: [
      RateLimitGuard,
      {
        provide: RateLimitService,
        useValue: {
          isRateLimited: jest.fn(),
          getRemainingRequests: jest.fn(),
        },
      },
    ],
  }).compile();

  app = moduleFixture.createNestApplication();
  rateLimitService = app.get<RateLimitService>(RateLimitService);
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
});

afterAll(async () => {
  await app.close();
});