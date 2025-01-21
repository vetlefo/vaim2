import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';
import { createMock } from '@golevelup/ts-jest';
import { User } from '../auth/interfaces/user.interface';

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
          },
        },
      ],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
    rateLimitService = module.get<RateLimitService>(RateLimitService);
  });

  it('should allow request when rate limit is not exceeded', async () => {
    const mockUser: User = {
      id: 'test-user-id',
      email: 'test@example.com',
      roles: ['user'],
    };

    const mockContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          user: mockUser,
          path: '/analytics',
        }),
      }),
    });

    jest.spyOn(rateLimitService, 'isRateLimited').mockResolvedValue(false);

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
    expect(rateLimitService.isRateLimited).toHaveBeenCalledWith('test-user-id', '/analytics');
  });

  it('should throw exception when rate limit is exceeded', async () => {
    const mockUser: User = {
      id: 'test-user-id',
      email: 'test@example.com',
      roles: ['user'],
    };

    const mockContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          user: mockUser,
          path: '/analytics',
        }),
      }),
    });

    jest.spyOn(rateLimitService, 'isRateLimited').mockResolvedValue(true);
    jest.spyOn(rateLimitService, 'getRemainingRequests').mockResolvedValue(0);

    await expect(guard.canActivate(mockContext)).rejects.toThrow(HttpException);
    expect(rateLimitService.isRateLimited).toHaveBeenCalledWith('test-user-id', '/analytics');
  });

  it('should use IP address when user is not authenticated', async () => {
    const mockContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          ip: '127.0.0.1',
          path: '/analytics',
        }),
      }),
    });

    jest.spyOn(rateLimitService, 'isRateLimited').mockResolvedValue(false);

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
    expect(rateLimitService.isRateLimited).toHaveBeenCalledWith('127.0.0.1', '/analytics');
  });
});