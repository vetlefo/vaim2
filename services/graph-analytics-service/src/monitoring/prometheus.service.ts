import { Injectable, Logger } from '@nestjs/common';
import { Registry, Histogram, Counter } from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly logger = new Logger(PrometheusService.name);
  private readonly registry: Registry;
  private readonly metrics: Map<string, Histogram | Counter>;

  constructor() {
    this.registry = new Registry();
    this.metrics = new Map();
    
    // Add default labels
    this.registry.setDefaultLabels({
      app: 'graph-analytics-service',
    });

    // Register metrics from monitoring.md spec
    this.registerMetric(
      'vaim_graph_operations_duration',
      'Duration of graph operations in seconds',
      ['operation_type'],
      'histogram'
    );

    this.registerMetric(
      'vaim_llm_integration_errors',
      'Count of LLM service integration errors',
      ['error_code'],
      'counter'
    );

    // Job execution metrics
    this.registerMetric(
      'vaim_job_execution_duration',
      'Duration of analytics job execution in seconds',
      ['job_type', 'status'],
      'histogram'
    );

    this.registerMetric(
      'vaim_job_status',
      'Status of analytics jobs',
      ['job_type', 'status'],
      'counter'
    );

    // Data retention metrics
    this.registerMetric(
      'vaim_data_retention_operations',
      'Count of data retention operations',
      ['operation_type', 'status'],
      'counter'
    );

    this.registerMetric(
      'vaim_archived_data_size',
      'Size of archived data in bytes',
      ['data_type'],
      'histogram'
    );

    // Resource usage metrics
    this.registerMetric(
      'vaim_memory_usage',
      'Memory usage in bytes',
      ['component'],
      'histogram'
    );

    this.registerMetric(
      'vaim_cpu_usage',
      'CPU usage percentage',
      ['component'],
      'histogram'
    );

    // Performance metrics
    this.registerMetric(
      'vaim_request_latency',
      'API request latency in seconds',
      ['endpoint', 'method'],
      'histogram'
    );

    this.registerMetric(
      'vaim_database_operations',
      'Database operation metrics',
      ['operation_type', 'status'],
      'histogram'
    );
  }

  trackOperation<T>(operation: string, func: () => Promise<T>): Promise<T> {
    const timer = this.metrics.get('vaim_graph_operations_duration') as Histogram;
    const end = timer.startTimer({ operation_type: operation });
    return func().finally(() => end());
  }

  registerMetric(
    name: string,
    help: string,
    labelNames: string[],
    type: 'histogram' | 'counter' = 'histogram',
  ): void {
    if (this.metrics.has(name)) {
      this.logger.warn(`Metric ${name} already registered`);
      return;
    }

    let metric: Histogram | Counter;

    if (type === 'histogram') {
      metric = new Histogram({
        name,
        help,
        labelNames,
        buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30, 60],
      });
    } else {
      metric = new Counter({
        name,
        help,
        labelNames,
      });
    }

    this.registry.registerMetric(metric);
    this.metrics.set(name, metric);
    this.logger.log(`Registered ${type} metric: ${name}`);
  }

  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const metric = this.metrics.get(name);
    if (!metric || !(metric instanceof Histogram)) {
      this.logger.error(`Histogram metric ${name} not found or wrong type`);
      return;
    }

    metric.observe(labels, value);
  }

  incrementCounter(name: string, labels: Record<string, string> = {}, value = 1): void {
    const metric = this.metrics.get(name);
    if (!metric || !(metric instanceof Counter)) {
      this.logger.error(`Counter metric ${name} not found or wrong type`);
      return;
    }

    metric.inc(labels, value);
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  clearMetrics(): void {
    this.registry.clear();
    this.metrics.clear();
    this.logger.log('All metrics cleared');
  }

  // Helper method to get a specific metric
  getMetric(name: string): Histogram | Counter | undefined {
    return this.metrics.get(name);
  }

  // Helper method to check if a metric exists
  hasMetric(name: string): boolean {
    return this.metrics.has(name);
  }
}