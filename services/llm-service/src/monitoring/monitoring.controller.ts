import { Controller, Get } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { RedisService } from '../redis/redis.service';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { MetricsResponse } from './interfaces/metrics.interface';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly prometheusService: PrometheusService,
    private readonly healthCheckService: HealthCheckService,
    private readonly httpHealthIndicator: HttpHealthIndicator,
    private readonly redisService: RedisService,
  ) {}

  @Get('metrics')
  async getMetrics(): Promise<string> {
    return this.prometheusService.getMetrics();
  }

  @Get('metrics/detailed')
  async getDetailedMetrics(): Promise<MetricsResponse> {
    return this.prometheusService.getMetricsResponse();
  }

  @Get('health')
  @HealthCheck()
  async checkHealth(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      async () => this.checkRedisHealth(),
      async () => this.checkProviderHealth(),
      async () => this.checkSystemHealth(),
    ]);
  }

  private async checkRedisHealth(): Promise<Record<string, any>> {
    try {
      await this.redisService.ping();
      return {
        redis: {
          status: 'up',
          details: {
            connection: true,
            latency: await this.measureRedisLatency(),
          },
        },
      };
    } catch (error) {
      return {
        redis: {
          status: 'down',
          error: error.message,
        },
      };
    }
  }

  private async checkProviderHealth(): Promise<Record<string, any>> {
    // In a real implementation, we would check each provider's health
    // For now, we'll return a basic status
    return {
      providers: {
        status: 'up',
        details: {
          openrouter: {
            status: 'up',
            latency: await this.measureProviderLatency('openrouter'),
          },
          openrouterOpenAI: {
            status: 'up',
            latency: await this.measureProviderLatency('openrouterOpenAI'),
          },
        },
      },
    };
  }

  private async checkSystemHealth(): Promise<Record<string, any>> {
    const metrics = await this.prometheusService.getMetricsResponse();
    const errorRate = metrics.request.failedRequests / 
      (metrics.request.totalRequests || 1);

    return {
      system: {
        status: errorRate < 0.05 ? 'up' : 'degraded',
        details: {
          errorRate,
          activeRequests: metrics.request.totalRequests,
          averageLatency: metrics.request.averageLatency,
        },
      },
    };
  }

  private async measureRedisLatency(): Promise<number> {
    const start = Date.now();
    await this.redisService.ping();
    return Date.now() - start;
  }

  private async measureProviderLatency(provider: string): Promise<number> {
    // In a real implementation, we would do a lightweight health check
    // For now, we'll return a simulated latency
    return Math.random() * 100;
  }
}