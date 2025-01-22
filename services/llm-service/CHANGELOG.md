# Changelog

## [Unreleased]
### Changed
- Refactored OpenRouter provider implementation with improved error handling and retry logic
- Removed redundant OpenRouter OpenAI provider in favor of unified OpenRouter implementation
- Enhanced streaming response handling in OpenRouter provider
- Improved test coverage for error cases and streaming responses

### Fixed
- Fixed initialization error handling in OpenRouter provider
- Fixed timeout and connection error handling
- Improved retry mechanism for transient errors
- Fixed streaming response parsing and error propagation

## [0.1.0] - 2025-01-20
### Added
- Initial implementation of LLM service
- Basic provider interface and implementations
- REST and GraphQL API endpoints
- Redis caching system
- Rate limiting implementation
- Testing infrastructure
- Basic monitoring setup
- Provider factory with dynamic provider loading
- Health check endpoints
- Configuration system with environment validation
- Docker support with development and production configurations
- E2E testing setup with mock providers