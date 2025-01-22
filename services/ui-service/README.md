# UI Service

## Overview
The UI service provides a graph-centric interface for VAIM2, enabling real-time collaboration and visualization of complex knowledge networks. It integrates with LLMs, HPC, and advanced analytics to provide an intuitive and powerful user experience.

## Features

### Core Components ✅
- Graph Canvas (Cytoscape.js)
- Real-time Collaboration
- Redux State Management
- WebSocket Integration
- Custom React Hooks

### Visualization Features
- Node/Edge Creation ✅
- Interactive Layout ✅
- Drag-and-Drop Support ✅
- Zoom/Pan Controls ✅
- Custom Styling 🚧

### Collaboration Features
- Real-time Updates ✅
- Multi-user Editing ✅
- Presence Indicators 🚧
- Version Control 🚧

### Integration Features
- LLM Integration 🚧
- HPC Task Management 🚧
- Analytics Visualization 🚧

## Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9
- Redis (for session management)

### Installation
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev:all
```

### Development Scripts
```bash
# Start UI development server
npm run dev

# Start WebSocket server
npm run server

# Start both UI and WebSocket servers
npm run dev:all

# Run tests
npm run test
npm run test:coverage
npm run test:e2e

# Build for production
npm run build
```

## Testing Requirements
See [Testing Guidelines](docs/testing-guidelines.md) for detailed testing requirements and examples.

### Coverage Targets
- Components: 90%
- Hooks: 95%
- Store: 100%
- Utils: 100%

### Test Types
1. Unit Tests
   - Components
   - Hooks
   - Store
   - Utils

2. Integration Tests
   - Component Interactions
   - Socket Communication
   - State Management

3. E2E Tests
   - Critical User Flows
   - Graph Operations
   - Collaboration Features

4. Performance Tests
   - Rendering Performance
   - Network Operations
   - State Updates

## Architecture

### Component Structure
```
src/
├── components/
│   ├── GraphCanvas/     # Core visualization
│   ├── Toolbar/         # Graph operations
│   ├── Sidebar/         # Context panels
│   └── Modal/           # Overlays
├── hooks/
│   ├── useGraphLayout/  # Layout management
│   ├── useGraphEvents/  # Event handling
│   └── useCollaboration/# Real-time features
├── store/
│   ├── graphSlice/      # Graph state
│   ├── uiSlice/         # UI state
│   └── collaborationSlice/ # Collaboration state
└── services/
    └── socket/          # WebSocket client
```

### State Management
- Redux for global state
- React Context for local state
- WebSocket for real-time updates

### Performance Considerations
- Virtualization for large graphs
- Batch updates for state changes
- Optimized rendering cycles

## Contributing
1. Create feature branch
2. Add tests for new features
3. Ensure all tests pass
4. Submit pull request

## Documentation
- [Testing Guidelines](docs/testing-guidelines.md)
- [Implementation Status](../../implementation/phase3.5-prototype.md)
- [API Documentation](docs/api.md)

## License
MIT