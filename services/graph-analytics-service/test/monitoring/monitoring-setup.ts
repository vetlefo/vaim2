import { jest, beforeEach } from '@jest/globals';
import { Registry, Histogram, Counter } from 'prom-client';

// Clear all registered metrics before each test
beforeEach(() => {
  // Clear the default registry
  const defaultRegistry = new Registry();
  defaultRegistry.clear();
});

// Mock implementations
export const mockHistogram = {
  startTimer: jest.fn().mockReturnValue(jest.fn()),
  observe: jest.fn(),
  labelNames: ['operation_type', 'status'],
} as unknown as jest.Mocked<Histogram<string>>;

export const mockCounter = {
  inc: jest.fn(),
} as unknown as jest.Mocked<Counter<string>>;

// Create a type-safe mock registry
interface RegistryMock {
  setDefaultLabels: (labels: Record<string, string>) => void;
  registerMetric: (metric: any) => void;
  metrics: () => Promise<string>;
  clear: () => void;
}

export const mockRegistry = {
  setDefaultLabels: jest.fn(),
  registerMetric: jest.fn(),
  metrics: jest.fn(async () => 'metrics string'),
  clear: jest.fn(),
} as jest.Mocked<RegistryMock>;

// Mock prom-client
jest.mock('prom-client', () => ({
  Registry: jest.fn().mockImplementation(() => mockRegistry),
  Histogram: jest.fn().mockImplementation(() => mockHistogram),
  Counter: jest.fn().mockImplementation(() => mockCounter),
}));