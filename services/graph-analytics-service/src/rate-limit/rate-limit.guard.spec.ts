/**
 * @jest-environment node
 * @jest-setup ../../test/rate-limit-setup.ts
 */

import { ExecutionContext, HttpException } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';
import { createMock } from '@golevelup/ts-jest';
import { User } from '../auth/interfaces/user.interface';
import { app } from '../../test/rate-limit-setup';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let rateLimitService: RateLimitService;

  beforeEach(async () => {
    guard = app.get<RateLimitGuard>(RateLimitGuard);
    rateLimitService = app.get<RateLimitService>(RateLimitService);
    jest.clearAllMocks();
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