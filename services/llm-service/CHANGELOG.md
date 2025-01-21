# Changelog

All notable changes to the LLM Service will be documented in this file.

## [0.4.0] - 2025-01-22

### Added
- OpenRouter Parameters API integration for dynamic model configuration
- Automatic parameter optimization based on model-specific metrics
- Parameter caching with model-specific defaults
- Support for extended parameter set (top_k, min_p, repetition_penalty, top_a)
- Default DeepSeek-R1 model support
- Support for Claude-3.5-Sonnet through OpenRouter
- Type-safe message handling for all providers

### Changed
- Updated OpenRouter integration to use Parameters API for optimal settings
- Migrated Claude integration to use OpenRouter
- Improved type safety across all provider implementations
- Enhanced error handling with proper type assertions
- Updated parameter handling to use model-specific optimal values

### Removed
- Standalone Claude provider (now using OpenRouter integration)
- Static parameter defaults in favor of dynamic model-specific values

### Fixed
- TypeScript errors in DeepSeek service
- Interface extension issues in provider implementations
- Message type compatibility across providers
- Parameter handling in OpenRouter provider
- Corrected model name from claude-3-sonnet to claude-3.5-sonnet

## [0.3.0] - 2025-01-15

### Added
- OpenRouter integration with OpenAI SDK
- Streaming support for all providers
- Rate limiting implementation
- Health check endpoints

### Changed
- Standardized error handling across providers
- Improved retry mechanisms
- Enhanced monitoring capabilities

## [0.2.0] - 2025-01-08

### Added
- DeepSeek provider implementation
- Basic parameter support
- Error mapping system
- Provider factory pattern

### Changed
- Refactored provider interfaces
- Updated configuration handling
- Improved testing infrastructure

## [0.1.0] - 2025-01-01

### Added
- Initial LLM service setup
- Basic provider interface
- Configuration system
- Health monitoring
- Basic error handling