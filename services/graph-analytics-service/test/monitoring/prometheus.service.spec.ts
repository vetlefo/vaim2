import { Test, TestingModule } from '@nestjs/testing';
import { PrometheusService } from '../../src/monitoring/prometheus.service';
import * as promClient from 'prom-client';
import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { mockHistogram, mockCounter, mockRegistry } from './monitoring-setup';

// Import setup
import './monitoring-setup';

describe('PrometheusService', () => {
  let service: PrometheusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrometheusService],
    }).compile();

    service = module.get<PrometheusService>(PrometheusService);
  });

  afterEach(() => {
    service.clearMetrics();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('metric registration', () => {
    it('should register graph operations duration metric', () => {
      expect(service.hasMetric('vaim_graph_operations_duration')).toBeTruthy();
      const metric = service.getMetric('vaim_graph_operations_duration');
      expect(metric).toBeDefined();
      expect(mockRegistry.registerMetric).toHaveBeenCalled();
    });

    it('should register job execution metrics', () => {
      expect(service.hasMetric('vaim_job_execution_duration')).toBeTruthy();
      expect(service.hasMetric('vaim_job_status')).toBeTruthy();
    });

    it('should register data retention metrics', () => {
      expect(service.hasMetric('vaim_data_retention_operations')).toBeTruthy();
      expect(service.hasMetric('vaim_archived_data_size')).toBeTruthy();
    });

    it('should register resource usage metrics', () => {
      expect(service.hasMetric('vaim_memory_usage')).toBeTruthy();
      expect(service.hasMetric('vaim_cpu_usage')).toBeTruthy();
    });
  });

  describe('trackOperation', () => {
    it('should track operation duration', async () => {
      const result = await service.trackOperation('test_operation', async () => {
        return 'test result';
      });

      expect(result).toBe('test result');
      expect(mockHistogram.startTimer).toHaveBeenCalled();
    });

    it('should handle operation errors', async () => {
      const error = new Error('Test error');
      await expect(
        service.trackOperation('test_operation', async () => {
          throw error;
        })
      ).rejects.toThrow(error);
    });
  });

  describe('observeHistogram', () => {
    it('should observe histogram values', () => {
      service.observeHistogram('vaim_job_execution_duration', 100, {
        job_type: 'test',
        status: 'success',
      });

      expect(mockHistogram.observe).toHaveBeenCalled();
    });
  });

  describe('incrementCounter', () => {
    it('should increment counter values', () => {
      service.incrementCounter('vaim_job_status', {
        job_type: 'test',
        status: 'completed',
      });

      expect(mockCounter.inc).toHaveBeenCalled();
    });
  });

  describe('getMetrics', () => {
    it('should return prometheus formatted metrics', async () => {
      const metrics = await service.getMetrics();
      expect(typeof metrics).toBe('string');
      expect(metrics).toBe('metrics string');
      expect(mockRegistry.metrics).toHaveBeenCalled();
    });
  });
});