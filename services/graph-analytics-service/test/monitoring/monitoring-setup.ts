import { jest, beforeEach } from '@jest/globals';
import * as promClient from 'prom-client';

// Clear all registered metrics before each test
beforeEach(() => {
  // Clear the default registry
  const defaultRegistry = new promClient.Registry();
  defaultRegistry.clear();
});

// Mock implementations
export const mockHistogram = {
  startTimer: jest.fn().mockReturnValue(jest.fn()),
  observe: jest.fn(),
  labelNames: ['operation_type', 'status'],
};

export const mockCounter = {
  inc: jest.fn(),
};

export const mockRegistry = {
  setDefaultLabels: jest.fn(),
  registerMetric: jest.fn(),
  metrics: jest.fn().mockResolvedValue('metrics string'),
  clear: jest.fn(),
};

// Mock prom-client
jest.mock('prom-client', () => ({
  Registry: jest.fn().mockImplementation(() => mockRegistry),
  Histogram: jest.fn().mockImplementation(() => mockHistogram),
  Counter: jest.fn().mockImplementation(() => mockCounter),
}));