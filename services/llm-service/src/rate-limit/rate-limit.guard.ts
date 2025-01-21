import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { Request } from 'express';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(private readonly rateLimitService: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.user?.['id'] || request.ip;
    
    // Extract provider from request body if it exists
    const provider = request.body?.provider as string | undefined;

    try {
      // Check global rate limit first
      const isGloballyLimited = await this.rateLimitService.isRateLimited(userId);
      if (isGloballyLimited) {
        const remaining = await this.rateLimitService.getRemainingRequests(userId);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Global rate limit exceeded',
            remainingRequests: remaining,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // If provider is specified, check provider-specific rate limit
      if (provider) {
        const isProviderLimited = await this.rateLimitService.isRateLimited(userId, provider);
        if (isProviderLimited) {
          const remaining = await this.rateLimitService.getRemainingRequests(userId, provider);
          throw new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              message: `Rate limit exceeded for provider: ${provider}`,
              remainingRequests: remaining,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      // Check if response is cached
      if (request.method === 'POST' && request.body?.prompt && provider) {
        const cachedResponse = await this.rateLimitService.getCachedResponse(
          request.body.prompt,
          provider,
        );

        if (cachedResponse) {
          this.logger.debug(`Cache hit for prompt with provider: ${provider}`);
          throw new HttpException(
            {
              statusCode: HttpStatus.OK,
              message: 'Cached response',
              data: JSON.parse(cachedResponse),
              cached: true,
            },
            HttpStatus.OK,
          );
        }
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Rate limit check failed:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Rate limit check failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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