# Changelog

All notable changes to the LLM service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive Prometheus metrics for monitoring
- Detailed health checks for all components
- Support for all OpenRouter models including Claude-3.5-Sonnet
- Enhanced streaming response handling
- Automated model discovery through OpenRouter API
- Integrated model capabilities tracking system
- Detailed model comparison data for all supported models
- Runtime model capabilities in response metadata
- Comprehensive model performance metrics and pricing data

### Changed
- Consolidated all model access through OpenRouter
- Removed standalone Claude provider in favor of OpenRouter integration
- Updated provider factory to support dynamic model listing
- Improved error handling and retry mechanisms
- Enhanced monitoring documentation
- Updated default model to Claude-3.5-Sonnet
- Enhanced response metadata to include model capabilities
- Improved model selection logic with capability awareness

### Removed
- Standalone Claude provider (now accessed through OpenRouter)
- Direct Anthropic API integration
- Legacy model configurations

## [1.2.0] - 2025-01-15

### Added
- Rate limiting per provider and model
- Redis caching for responses
- Basic monitoring endpoints
- Health check system
- Support for DeepSeek models

### Changed
- Improved error handling
- Enhanced logging system
- Updated configuration management
- Optimized caching strategy

### Fixed
- Token counting accuracy
- Stream handling edge cases
- Memory leaks in long-running streams

## [1.1.0] - 2024-12-20

### Added
- Streaming response support
- Basic provider metrics
- Initial Claude integration
- Configuration validation

### Changed
- Refactored provider interface
- Improved error messages
- Enhanced type safety

### Fixed
- Connection handling issues
- Memory management in streams
- Type conversion bugs

## [1.0.0] - 2024-12-01

### Added
- Initial release
- Basic LLM provider interface
- OpenRouter integration
- Simple caching
- Basic error handling
- Configuration system
- Health checks

[Unreleased]: https://github.com/yourusername/llm-service/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/yourusername/llm-service/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/yourusername/llm-service/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/yourusername/llm-service/releases/tag/v1.0.0