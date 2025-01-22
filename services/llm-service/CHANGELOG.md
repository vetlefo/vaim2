# Changelog

## [Unreleased]

### Changed
- Consolidated OpenRouter provider implementation for better maintainability
- Enhanced streaming support with proper AsyncIterator implementation
- Improved parameter caching with TTL management
- Strengthened error handling and cleanup in streaming responses

### Fixed
- Fixed AsyncIterator implementation in GraphQL subscription for streaming completions
- Fixed import paths to use relative paths instead of path aliases
- Fixed streaming response types in LLM service and resolver
- Fixed import paths in provider factory and service tests
- Fixed missing MonitoringModule import in LLMModule
- Fixed OpenRouter provider's completeStream method to properly implement AsyncIterator interface
- Fixed streaming response handling in OpenRouter provider to match interface contract

### Removed
- Removed deprecated openrouter-openai provider implementation in favor of consolidated OpenRouter provider

### Changed
- Simplified streaming implementation by removing PubSub layer
- Improved error handling in streaming responses
- Updated test files to use correct import paths
- Streamlined provider factory by removing redundant method definition

### Documentation
- Added detailed comments for provider capabilities
- Updated streaming implementation documentation
- Added error handling documentation for providers

### Removed
- Removed unused openrouter-openai provider in favor of consolidated openrouter provider