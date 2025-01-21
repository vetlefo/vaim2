import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrometheusService } from '../monitoring/prometheus.service';

@Injectable()
export class PipelineService implements OnModuleInit {
  private readonly logger = new Logger(PipelineService.name);
  private readonly retentionPeriodDays: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly analyticsService: AnalyticsService,
    private readonly prometheusService: PrometheusService,
  ) {
    this.retentionPeriodDays = this.configService.getNumber('DATA_RETENTION_DAYS', 90);
  }

  async onModuleInit() {
    await this.initializeMetrics();
    this.logger.log('Pipeline service initialized');
  }

  private async initializeMetrics() {
    // Initialize Prometheus metrics
    this.prometheusService.registerMetric(
      'graph_analytics_job_duration_seconds',
      'Histogram of analytics job duration',
      ['job_type']
    );
    this.prometheusService.registerMetric(
      'graph_analytics_job_failures_total',
      'Counter of failed analytics jobs',
      ['job_type']
    );
    this.prometheusService.registerMetric(
      'graph_data_retention_deletions_total',
      'Counter of deleted nodes/relationships during retention cleanup',
      ['entity_type']
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runDailyAnalytics() {
    this.logger.log('Starting daily analytics jobs');
    const startTime = Date.now();

    try {
      // Run PageRank analysis
      await this.analyticsService.computePageRank({
        label: 'Node',
        relationshipType: 'RELATES_TO',
        iterations: 20,
        dampingFactor: 0.85,
      });

      // Run community detection
      await this.analyticsService.detectCommunities({
        label: 'Node',
        relationshipType: 'RELATES_TO',
        minCommunitySize: 3,
      });

      // Record successful execution metrics
      const duration = (Date.now() - startTime) / 1000;
      this.prometheusService.observeHistogram(
        'graph_analytics_job_duration_seconds',
        duration,
        { job_type: 'daily_analytics' }
      );

      this.logger.log(`Daily analytics completed in ${duration} seconds`);
    } catch (error) {
      this.logger.error('Failed to run daily analytics:', error);
      this.prometheusService.incrementCounter(
        'graph_analytics_job_failures_total',
        { job_type: 'daily_analytics' }
      );
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async runWeeklyAnalytics() {
    this.logger.log('Starting weekly analytics jobs');
    const startTime = Date.now();

    try {
      // Run node similarity analysis
      await this.analyticsService.calculateNodeSimilarity({
        label: 'Node',
        relationshipType: 'RELATES_TO',
        similarityCutoff: 0.5,
      });

      // Record successful execution metrics
      const duration = (Date.now() - startTime) / 1000;
      this.prometheusService.observeHistogram(
        'graph_analytics_job_duration_seconds',
        duration,
        { job_type: 'weekly_analytics' }
      );

      this.logger.log(`Weekly analytics completed in ${duration} seconds`);
    } catch (error) {
      this.logger.error('Failed to run weekly analytics:', error);
      this.prometheusService.incrementCounter(
        'graph_analytics_job_failures_total',
        { job_type: 'weekly_analytics' }
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async enforceDataRetention() {
    this.logger.log('Starting data retention enforcement');
    const startTime = Date.now();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionPeriodDays);

      // Execute retention policy
      const result = await this.executeRetentionPolicy(cutoffDate);

      const duration = (Date.now() - startTime) / 1000;
      this.logger.log(
        `Data retention completed in ${duration} seconds. Deleted: ${result.deletedNodes} nodes, ${result.deletedRelationships} relationships`
      );

      // Record retention metrics
      this.prometheusService.incrementCounter(
        'graph_data_retention_deletions_total',
        { entity_type: 'node' },
        result.deletedNodes
      );
      this.prometheusService.incrementCounter(
        'graph_data_retention_deletions_total',
        { entity_type: 'relationship' },
        result.deletedRelationships
      );
    } catch (error) {
      this.logger.error('Failed to enforce data retention:', error);
      this.prometheusService.incrementCounter(
        'graph_analytics_job_failures_total',
        { job_type: 'data_retention' }
      );
    }
  }

  private async executeRetentionPolicy(cutoffDate: Date): Promise<{ deletedNodes: number; deletedRelationships: number }> {
    // Implementation will be added in neo4j.service.ts
    // This is a placeholder that will be implemented next
    return { deletedNodes: 0, deletedRelationships: 0 };
  }
}