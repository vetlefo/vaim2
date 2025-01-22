# Changelog

All notable changes to the Research Corner will be documented in this file.

## [0.3.0] - 2025-01-22

### Added
- Added comprehensive parameter support for DeepSeek API
- Implemented type-safe parameter handling with default values
- Added getSupportedParameters method for parameter discovery
- Added support for all DeepSeek model parameters (temperature, top_p, top_k, etc.)

### Fixed
- Resolved TypeScript type compatibility issues with OpenAI types
- Fixed interface extension issues in DeepseekMessage and DeepseekChatResponse
- Added proper type assertions for API responses
- Implemented proper type definitions for DeepSeek-specific message properties

### Changed
- Refactored DeepSeek service to use standalone type definitions
- Improved type safety in chat completion creation
- Enhanced parameter handling with proper TypeScript types

## [0.2.0] - 2025-01-22

### Added
- Added type-safe DeepSeek AI integration service
- Introduced custom type definitions for DeepSeek message formats
- Added proper handling of reasoning content in responses

### Fixed
- Fixed TypeScript errors in DeepSeek service related to missing type definitions
- Added proper type declarations for DeepSeek-specific message properties

## [0.1.0] - Initial Release

### Added
- Initial quantum experiments service setup
- Basic HPC environment configuration
- Containerization support via Dockerfile.research