# Changelog

All notable changes to the auth-service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Updated external port mapping from 3001 to 1337 to avoid conflicts
- Aligned internal service ports with docker-compose networking:
  - PostgreSQL using internal port 5432
  - Neo4j using internal port 7687
  - Redis using internal port 6379

### Added
- Environment configuration validation
- Integration with shared infrastructure:
  - PostgreSQL database for user data
  - Neo4j database for advanced user relationships
  - Redis for caching and rate limiting
- Basic service health checks
- Docker container configuration