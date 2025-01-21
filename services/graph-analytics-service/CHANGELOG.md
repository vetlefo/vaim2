# Changelog

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