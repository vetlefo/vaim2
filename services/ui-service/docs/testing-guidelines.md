# UI Service Testing Guidelines

## Overview
This document outlines the testing strategy and requirements for the UI service, ensuring robust and reliable functionality across all components.

## Testing Layers

### 1. Unit Tests
- **Components**
  - Test individual component rendering
  - Verify component props handling
  - Check component state management
  - Validate event handlers
  - Example:
  ```typescript
  describe('Toolbar', () => {
    it('should trigger node creation when add button is clicked', () => {
      const mockDispatch = jest.fn();
      const { getByTitle } = render(<Toolbar dispatch={mockDispatch} />);
      
      fireEvent.click(getByTitle('Add Node'));
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'graph/addNode'
      }));
    });
  });
  ```

- **Hooks**
  - Test custom hook behavior
  - Verify state updates
  - Check effect cleanup
  - Example:
  ```typescript
  describe('useGraphEvents', () => {
    it('should handle node position updates', () => {
      const { result } = renderHook(() => useGraphEvents());
      const mockCy = createMockCytoscape();
      
      act(() => {
        result.current.setupGraphEvents(mockCy);
      });
      
      // Trigger dragfree event
      mockCy.emit('dragfree', { target: mockNode });
      
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'graph/updateNodePosition'
      }));
    });
  });
  ```

- **Store**
  - Test reducer logic
  - Verify action creators
  - Check selector functions
  - Example:
  ```typescript
  describe('graphSlice', () => {
    it('should handle node addition', () => {
      const initialState = { nodes: [] };
      const newNode = {
        type: 'thought',
        data: { content: 'Test' }
      };
      
      const nextState = graphReducer(initialState, addNode(newNode));
      expect(nextState.nodes).toHaveLength(1);
      expect(nextState.nodes[0]).toMatchObject(newNode);
    });
  });
  ```

### 2. Integration Tests
- **Component Interactions**
  - Test component communication
  - Verify Redux integration
  - Check WebSocket interactions
  - Example:
  ```typescript
  describe('Graph Operations', () => {
    it('should update graph when node is added through toolbar', async () => {
      const { getByTitle, findByText } = render(<App />);
      
      fireEvent.click(getByTitle('Add Node'));
      
      const newNode = await findByText('New Thought');
      expect(newNode).toBeInTheDocument();
    });
  });
  ```

- **Socket Communication**
  - Test real-time updates
  - Verify collaboration features
  - Check reconnection logic
  - Example:
  ```typescript
  describe('Collaboration', () => {
    it('should sync node positions across clients', async () => {
      const { socket, cleanup } = setupTestSocket();
      
      // Simulate node movement from another client
      socket.emit('nodeMove', { id: 'node1', position: { x: 100, y: 100 } });
      
      await waitFor(() => {
        expect(getNodePosition('node1')).toEqual({ x: 100, y: 100 });
      });
      
      cleanup();
    });
  });
  ```

### 3. End-to-End Tests
- **Critical Paths**
  - Graph creation and editing
  - Collaboration workflows
  - Data persistence
  - Example:
  ```typescript
  describe('Graph Editing', () => {
    it('should create and connect nodes', async () => {
      await page.goto('http://localhost:3000');
      
      // Create first node
      await page.click('[title="Add Node"]');
      await page.type('[data-testid="node-content"]', 'Node 1');
      
      // Create second node
      await page.click('[title="Add Node"]');
      await page.type('[data-testid="node-content"]', 'Node 2');
      
      // Connect nodes
      await page.click('[title="Add Edge"]');
      await page.click('text=Node 1');
      await page.click('text=Node 2');
      
      const edge = await page.$('[data-testid="edge"]');
      expect(edge).toBeTruthy();
    });
  });
  ```

### 4. Performance Tests
- **Rendering Performance**
  - Large graph handling
  - Animation smoothness
  - Memory usage
  ```typescript
  describe('Performance', () => {
    it('should maintain 60fps with 1000 nodes', async () => {
      const fps = await measureFPS(() => {
        renderLargeGraph(1000);
      });
      expect(fps).toBeGreaterThan(55);
    });
  });
  ```

- **Network Performance**
  - WebSocket latency
  - State sync efficiency
  - Batch operation handling

## Test Coverage Requirements
- Components: 90% coverage
- Hooks: 95% coverage
- Store: 100% coverage
- Utils: 100% coverage

## Testing Tools
- Jest for unit testing
- React Testing Library for component testing
- Cypress for E2E testing
- Playwright for cross-browser testing
- Jest-axe for accessibility testing

## CI/CD Integration
```yaml
test:
  script:
    - npm run test:unit
    - npm run test:integration
    - npm run test:e2e
    - npm run test:performance
  coverage:
    report:
      - junit
      - cobertura
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

## Best Practices
1. **Isolation**
   - Mock external dependencies
   - Reset state between tests
   - Use test databases

2. **Maintainability**
   - Follow AAA pattern (Arrange, Act, Assert)
   - Use test helpers and factories
   - Keep tests focused and atomic

3. **Reliability**
   - Avoid flaky tests
   - Handle async operations properly
   - Clean up resources after tests

4. **Documentation**
   - Document test setup requirements
   - Explain complex test scenarios
   - Keep test descriptions clear

## Test Organization
```
tests/
├── unit/
│   ├── components/
│   ├── hooks/
│   └── store/
├── integration/
│   ├── graph-operations/
│   └── collaboration/
├── e2e/
│   └── workflows/
└── performance/
    ├── rendering/
    └── network/
```

## Running Tests
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance

# All tests with coverage
npm run test:all