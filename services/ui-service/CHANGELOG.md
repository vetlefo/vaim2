# Changelog

All notable changes to the UI service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Graph-centric interface using Cytoscape.js
- Real-time collaboration foundation with Socket.io
- Core UI components (Toolbar, Sidebar, Modal)
- Redux store with typed slices
- Custom hooks for graph management
- Testing infrastructure and guidelines
- WebSocket server for real-time updates
- Basic node creation functionality
- Graph layout management
- Component documentation

### Changed
- Updated TypeScript configuration for better module support
- Improved error handling in WebSocket communication
- Enhanced type definitions for graph operations
- Optimized graph visualization performance
- Improved node label handling using content property
- Removed custom wheel sensitivity for better cross-platform compatibility

### Fixed
- WebSocket connection handling for development
- Node position calculation in graph canvas
- TypeScript configuration for server
- Node label display issues in graph visualization
- Graph style property type definitions
- Cytoscape.js warning messages for node labels

## [0.1.0] - 2025-01-22

### Added
- Initial project setup
- Basic React application structure
- Development environment configuration
- Essential dependencies
  - React
  - Redux Toolkit
  - Cytoscape.js
  - Socket.io
  - TypeScript
  - Tailwind CSS
- Core component scaffolding
- Basic routing setup
- Development scripts
  - `dev` - Start development server
  - `build` - Production build
  - `test` - Run tests
  - `server` - Start WebSocket server

### Changed
- Updated project structure for better modularity
- Enhanced TypeScript configuration

### Fixed
- Development server configuration
- Module resolution issues

## Upcoming Features
- Advanced graph operations
  - Edge creation
  - Node grouping
  - Custom node types
- Enhanced collaboration features
  - Presence indicators
  - Version control
  - Change history
- LLM integration
  - Context-aware suggestions
  - Automated node linking
- Performance optimizations
  - Virtualization
  - Batch updates
  - Caching
- Advanced visualization
  - Custom layouts
  - Theme support
  - Animation system
- HPC integration
  - Task management
  - Progress visualization
  - Resource monitoring