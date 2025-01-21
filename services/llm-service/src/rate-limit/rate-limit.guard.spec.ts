import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';
import { createMock } from '@golevelup/ts-jest';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let rateLimitService: RateLimitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitGuard,
        {
          provide: RateLimitService,
          useValue: {
            isRateLimited: jest.fn(),
            getRemainingRequests: jest.fn(),
            getCachedResponse: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
    rateLimitService = module.get<RateLimitService>(RateLimitService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow request when not rate limited', async () => {
      const mockContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            ip: '127.0.0.1',
            path: '/completion',
            method: 'POST',
            body: { provider: 'openrouter' },
          }),
        }),
      });

      jest.spyOn(rateLimitService, 'isRateLimited').mockResolvedValue(false);

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should throw when globally rate limited', async () => {
      const mockContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            ip: '127.0.0.1',
            path: '/completion',
            method: 'POST',
            body: { provider: 'openrouter' },
          }),
        }),
      });

      jest.spyOn(rateLimitService, 'isRateLimited').mockResolvedValueOnce(true);
      jest.spyOn(rateLimitService, 'getRemainingRequests').mockResolvedValueOnce(0);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Global rate limit exceeded',
            remainingRequests: 0,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
    });

    it('should throw when provider rate limited', async () => {
      const mockContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            ip: '127.0.0.1',
            path: '/completion',
            method: 'POST',
            body: { provider: 'openrouter' },
          }),
        }),
      });

      jest.spyOn(rateLimitService, 'isRateLimited')
        .mockResolvedValueOnce(false)  // global check
        .mockResolvedValueOnce(true);  // provider check
      jest.spyOn(rateLimitService, 'getRemainingRequests').mockResolvedValueOnce(0);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Rate limit exceeded for provider: openrouter',
            remainingRequests: 0,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
    });

    it('should return cached response when available', async () => {
      const cachedResponse = { text: 'cached response' };
      const mockContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            ip: '127.0.0.1',
            path: '/completion',
            method: 'POST',
            body: { provider: 'openrouter', prompt: 'test prompt' },
          }),
        }),
      });

      jest.spyOn(rateLimitService, 'isRateLimited').mockResolvedValue(false);
      jest.spyOn(rateLimitService, 'getCachedResponse').mockResolvedValue(JSON.stringify(cachedResponse));

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new HttpException(
          {
            statusCode: HttpStatus.OK,
            message: 'Cached response',
            data: cachedResponse,
            cached: true,
          },
          HttpStatus.OK,
        ),
      );
    });
  });
});