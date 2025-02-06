import { CanActivate, ExecutionContext } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
export declare class RateLimitGuard implements CanActivate {
    private readonly rateLimitService;
    private readonly logger;
    constructor(rateLimitService: RateLimitService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare function UseRateLimit(): (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => any;
