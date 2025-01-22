# Changelog

## [Unreleased]
### Added
- Environment configuration alignment with other services:
  - Neo4j connection using shared auth-neo4j instance (bolt://auth-neo4j:7687)
    - Verified healthy Neo4j enterprise instance with GDS plugins
    - Confirmed bolt connectivity on port 7688
  - Redis configuration aligned with central redis instance
    - Verified Redis connectivity on port 6380
    - Persistence enabled with appendonly
  - JWT secret sharing for consistent authentication
  - Port mappings adjusted to avoid conflicts (3002:3002)
  - Kafka broker configuration standardized
    - Verified Kafka connectivity on port 9093
    - Zookeeper connection established on port 2182
    - Broker ID and listener configuration validated

### Changed
- Updated Neo4j connection to use shared auth-neo4j instance
- Aligned Redis configuration with other services
- Standardized environment variable naming across services

## [0.3.0] - 2025-01-22
### Added
- Comprehensive monitoring system implementation
  - Enhanced Prometheus metrics for job execution, data retention, and resource usage
  - Persistent audit logging with Neo4j integration
  - Security event tracking and retention policy enforcement
  - Performance and resource utilization metrics
- New metrics:
  - Job execution duration and status tracking
  - Data retention operations and archive size monitoring
  - Memory and CPU usage metrics
  - Request latency and database operation tracking
- Audit system enhancements:
  - Neo4j-based persistent storage for audit events
  - Security context tracking
  - Data retention metadata
  - Queryable audit history
- Test coverage:
  - Unit tests for PrometheusService
  - Unit tests for AuditService
  - Mock implementations for testing

### Changed
- Updated MonitoringModule with Neo4j integration
- Enhanced PrometheusService with granular metrics
- Improved audit logging with structured metadata

## [0.2.1] - 2025-01-21
### Added
- Dedicated test setup for rate limiting functionality
- New testing documentation with best practices
- Enhanced mocking strategies for external services

### Fixed
- Rate limit test dependencies on external services
- Jest configuration for proper test isolation
- Integration issues with @golevelup/ts-jest

### Changed
- Improved test organization with dedicated setup files
- Updated testing approach to use mock services instead of real connections

## [0.2.0] - Previous version
# Changelog

All notable changes to the graph-analytics-service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-21

### Changed
- Migrated from `redis` to `ioredis` for improved TypeScript support and better connection management
- Updated Redis client configuration with retry strategy and connection event handling
- Enhanced rate limiting implementation with proper TypeScript types for Redis pipeline results

### Added
- Added retry strategy for Redis connections with exponential backoff
- Added connection event logging for better observability
- Added proper error handling for Redis operations

### Fixed
- Fixed TypeScript errors in Redis service implementation
- Fixed type definitions for Redis multi-exec results in rate limiting service
- Improved error handling in rate limiting operations

### Dependencies
- Added `ioredis` and `@types/ioredis` for Redis operations
- Added `@nestjs/config` for configuration management
- Added `@nestjs/schedule` for scheduling tasks
- Added `@nestjs/terminus` and `prom-client` for monitoring
- Added `neo4j-driver` for Neo4j database connectivity