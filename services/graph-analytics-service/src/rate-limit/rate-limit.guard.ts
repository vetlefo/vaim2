import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { Request } from 'express';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly rateLimitService: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.user?.['id'] || request.ip; // Fallback to IP if no user
    const endpoint = request.path;

    const isRateLimited = await this.rateLimitService.isRateLimited(userId, endpoint);
    if (isRateLimited) {
      const remaining = await this.rateLimitService.getRemainingRequests(userId, endpoint);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          remainingRequests: remaining,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}

// Decorator for applying rate limiting to controllers or methods
export function UseRateLimit() {
  return function (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) {
    if (descriptor) {
      const originalMethod = descriptor.value;
      descriptor.value = async function (...args: any[]) {
        return originalMethod.apply(this, args);
      };
    }
    return target;
  };
}