# VAIM2 UI Service

The UI service provides a modern, real-time collaborative interface for the VAIM2 platform. It features a graph-based visualization system with LLM integration and advanced collaboration features.

## Features

- Graph-centric visualization using Cytoscape.js
- Real-time collaboration with cursor and selection synchronization
- LLM-powered chat interface with context awareness
- Dynamic layout management
- Theme customization
- Performance monitoring and metrics

## Tech Stack

- React + TypeScript
- Redux Toolkit for state management
- Cytoscape.js for graph visualization
- Socket.io for real-time collaboration
- Tailwind CSS for styling
- Vite for development and building

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
  ├── components/          # React components
  │   ├── GraphCanvas/    # Graph visualization
  │   ├── Sidebar/        # Application sidebar
  │   ├── Toolbar/        # Main toolbar
  │   ├── ContextMenu/    # Context menu
  │   ├── Modal/          # Modal dialogs
  │   └── NotificationStack/ # Notifications
  ├── hooks/              # Custom React hooks
  ├── store/              # Redux store and slices
  │   └── slices/         # Redux slices
  ├── types/              # TypeScript type definitions
  ├── App.tsx            # Root component
  └── main.tsx           # Entry point
```

## Development

### Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Maintain proper component documentation
- Write unit tests for components and hooks

## Integration Points

### LLM Service

The UI integrates with the LLM service for:
- Context-aware chat
- Graph node suggestions
- Bridging concept generation

### Graph Analytics Service

Connects to the graph service for:
- Node and edge data
- Graph analytics results
- Layout computations

### Collaboration Features

Real-time collaboration is handled through:
- WebSocket connections
- User presence tracking
- Cursor and selection synchronization
- Change propagation

## Performance Considerations

- Lazy loading of components
- Efficient graph rendering
- Debounced real-time updates
- Optimized Redux state management

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Update documentation
5. Submit a pull request

## License

Private - VAIM2 Platform