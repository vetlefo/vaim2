# Phase 3.5: UI Framework Prototype Implementation

## Overview
This phase focuses on implementing a "mindblowing" UI framework for VAIM2 that highlights the platform's powerful integrations (LLMs, HPC, advanced analytics) through an intuitive and visually appealing interface.

## Current Implementation Status

### 1. Graph-Centric Interface ✅
- Primary Canvas implementation using Cytoscape.js
- Real-time node/edge visualization
- Basic graph operations (add/remove nodes, drag-and-drop)
- Position persistence and layout management
- Optimized node label handling using content property
- Improved cross-platform zoom behavior
- Enhanced graph style type safety

### 2. Collaboration Features 🚧
- Real-time presence indicators
- Socket.io integration for live updates
- User selection synchronization
- Version control preparation

### 3. Core Components Implemented ✅
- Toolbar with essential graph operations
- Sidebar with multiple panels (Chat, Settings, History)
- Context menu for node/edge operations
- Notification system for user feedback
- Chat-based node creation with automatic labeling
- Enhanced LLM Integration
  - ✅ OpenRouter API integration
  - ✅ Streaming responses
    - ✅ Basic streaming implementation
    - ✅ Structured output streaming
      - ✅ JSON schema validation
      - ✅ Schema-based response formatting
    - ✅ CORS and EventSource compatibility
      - ✅ Cross-origin headers
      - ✅ Connection stability
      - ✅ Error handling
  - ✅ Health monitoring
    - ✅ Redis connection status
    - ✅ Provider health checks

### 4. State Management
- Redux store with typed slices ✅
- Graph state management ✅
- UI state control ✅
- Collaboration state sync 🚧

### 5. Real-Time Features
- WebSocket server setup ✅
- Client-server communication ✅
- Event handling system ✅
- State synchronization 🚧

## Technical Implementation Details

### Graph State Management
```typescript
interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodes: string[];
  selectedEdges: string[];
  cyInstance: Core | null;
}

interface GraphNode {
  id: string;
  type: 'thought' | 'llm' | 'hpc' | 'bridge';
  data: {
    content: string;
    metadata: Record<string, unknown>;
    confidence?: number;
  };
  position?: {
    x: number;
    y: number;
  };
}
```

### Component Architecture
1. **GraphCanvas**
   - Core visualization component
   - Handles graph rendering and interactions
   - Integrates with Cytoscape.js
   - Manages viewport and layout
   - Optimized style handling for better performance
   - Cross-platform compatible zoom behavior

2. **Toolbar**
   - Primary user actions
   - Graph operation controls
   - View management
   - Export/Import functionality

3. **Sidebar**
   - Contextual information
   - LLM interaction panel
   - Settings management
   - History tracking
   - Chat-based node creation

## Next Steps

### Immediate Priorities
1. ✅ Complete node creation workflow
2. ✅ Implement streaming functionality
   - ✅ Basic streaming
   - ✅ Structured output
   - ✅ CORS support
3. Implement edge creation between nodes
4. Add node type selection
5. Enhance visual feedback

### Short-term Goals
1. LLM integration panel
2. Advanced graph layouts
3. Node content editing
4. Edge type management

### Medium-term Goals
1. HPC task visualization
2. Advanced analytics integration
3. Collaborative features
4. Version control system

## Technical Debt & Improvements
- [x] Optimize graph rendering performance
- [x] Improve node label handling
- [x] Fix style property type definitions
- [x] Implement streaming functionality
- [x] Add CORS support for streaming
- [x] Implement structured output streaming
- [ ] Add error boundaries for component isolation
- [ ] Implement comprehensive testing
- [ ] Add keyboard shortcuts
- [ ] Improve accessibility

## Setup & Configuration

### Prerequisites
- Node.js >= 18
- npm >= 9
- Redis (for session management)

### Environment Variables
```bash
# Service URLs
VITE_AUTH_URL=http://localhost:3001
VITE_GRAPH_ANALYTICS_URL=http://localhost:3002
VITE_LLM_URL=http://localhost:3003

# WebSocket Configuration
VITE_WS_URL=http://localhost:3004
WS_PORT=3004

# Redis Configuration (for Socket.IO)
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=your-jwt-secret  # Must match Auth service

# LLM Service Configuration
VITE_LLM_STREAM_ENABLED=true
VITE_LLM_STRUCTURED_OUTPUT=true
VITE_LLM_CORS_ORIGIN=http://localhost:3000
VITE_LLM_STREAM_CHUNK_SIZE=1024
VITE_LLM_STREAM_RETRY_ATTEMPTS=3

# Optional Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_HPC=false      # Enable when HPC integration is ready
```

### Installation & Development
```bash
# Install dependencies
cd services/ui-service
npm install

# Start development servers
npm run dev:all    # Both UI and WebSocket
# Or separately:
npm run dev        # UI only (Vite)
npm run server     # WebSocket server only

# Production build
npm run build
npm run preview
```

### Docker Setup
```yaml
ui-service:
  build:
    context: ./services/ui-service
    dockerfile: Dockerfile
  ports:
    - "3000:3000"    # Vite/React
    - "3004:3004"    # WebSocket
  environment:
    - VITE_AUTH_URL=http://auth-service:3001
    - VITE_GRAPH_ANALYTICS_URL=http://graph-analytics-service:3002
    - VITE_LLM_URL=http://llm-service:3003
    - VITE_WS_URL=http://localhost:3004
    - WS_PORT=3004
    - REDIS_HOST=redis
    - REDIS_PORT=6379
    - JWT_SECRET=${JWT_SECRET}
  depends_on:
    - redis
    - auth-service
    - graph-analytics-service
    - llm-service
```

### Health Checks
- UI: http://localhost:3000/health
- WebSocket: http://localhost:3004/health

### Common Issues & Debugging
1. WebSocket Connection Failures
   - Verify WebSocket server is running
   - Check VITE_WS_URL configuration
   - Confirm Redis connection

2. Service Connection Issues
   - Verify service URLs in environment variables
   - Check service health endpoints
   - Confirm network connectivity

3. Authentication Problems
   - Verify JWT_SECRET matches Auth service
   - Check token expiration
   - Confirm Auth service connectivity

## Dependencies
- Cytoscape.js for graph visualization
- Socket.io for real-time features
- Redux Toolkit for state management
- TypeScript for type safety
- Tailwind CSS for styling

## Testing Strategy
1. Unit tests for state management
2. Component testing with React Testing Library
3. Integration tests for graph operations
4. E2E tests for critical workflows

## Documentation
- Component API documentation
- State management guide
- Event system documentation
- Integration guides

## Changelog
### Added
- Basic graph visualization
- Node creation functionality
- Real-time collaboration foundation
- Core UI components
- Optimized node label handling
- Cross-platform zoom behavior
- Enhanced LLM integration
  - OpenRouter API integration
  - ✅ Streaming implementation
    - ✅ Basic streaming
    - ✅ Structured output
    - ✅ CORS support
  - Health monitoring improvements
  - Redis connection monitoring

### In Progress
- Edge creation system
- Node type selection
- Content editing
- Collaborative features

### Planned
- Advanced layouts
- HPC integration
- Analytics visualization
- Version control