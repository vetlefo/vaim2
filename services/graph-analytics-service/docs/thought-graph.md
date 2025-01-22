# Visual Agentic Idea Manager (VAIM)

**Version**: 1.0  
**Last Updated**: 2025-01-22

## Overview

The Visual Agentic Idea Manager (VAIM) is implemented through a ThoughtGraph system that manages LLM chain-of-thought and multi-step reasoning in a graph data structure. This document describes the technical implementation within the Graph Analytics Service.

### What Problem Does It Solve?

- **Rich, branching reasoning**: Instead of a simple list of "messages," we store each thought as a node in a graph structure.
- **Revisions & branching**: We handle revisions and branching logic so that partial rewrites or forks are maintained in a single graph.
- **Metadata tracking**: Each thought node can be annotated with type (insight, question, evidence, conclusion), status (active, revised, deprecated), timestamps, or LLM usage info.
- **Neo4j & HPC synergy**: Leverages Neo4j + GDS library for advanced queries (like PageRank, bridging detection). HPC can expand or revise large branches in parallel.

## Implementation Details

### 1. ThoughtGraph Core

The ThoughtGraph system consists of several key components:

1. **ThoughtGraphService**
   - Core service managing thought nodes and relationships
   - Handles graph operations and queries
   - Interfaces with Neo4j through existing graph-analytics infrastructure

2. **ThoughtNode Schema**
   ```typescript
   interface ThoughtNode {
     id: number;
     content: string;
     type: 'insight' | 'question' | 'evidence' | 'conclusion';
     status: 'active' | 'revised' | 'deprecated';
     metadata: {
       llmUsage?: any;
       hpcInfo?: any;
       created: string;
       modified: string;
     };
   }
   ```

3. **Relationships**
   - `:REVISES` - Links revised thoughts to originals
   - `:BRANCHES_FROM` - Shows branching points in thought development
   - `:RELATED_TO` - General relationship for HPC expansions

### 2. Integration Points

#### LLM Service Integration
```typescript
// Example integration with LLM Service
const thoughtGraph = new ThoughtGraphService();
await thoughtGraph.addThought({
  content: llmResponse.text,
  type: 'insight',
  metadata: { llmUsage: llmResponse.usage }
});
```

#### HPC Integration
- Parallel processing of thought branches
- Advanced graph analytics
- Automated thought expansion

## Code Organization

```
services/graph-analytics-service/
├── src/
│   ├── thoughtGraph/
│   │   ├── ThoughtGraphService.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   └── neo4j/
│       └── thoughtGraph.queries.ts
└── test/
    └── thoughtGraph.spec.ts
```

## Usage Examples

### 1. Basic Thought Creation
```typescript
await thoughtGraph.addThought({
  content: "Initial hypothesis",
  type: "insight",
  status: "active"
});
```

### 2. Branching Thoughts
```typescript
await thoughtGraph.createBranch({
  fromThoughtId: originalId,
  content: "Alternative approach",
  type: "insight"
});
```

### 3. Revising Thoughts
```typescript
await thoughtGraph.reviseThought({
  thoughtId: originalId,
  newContent: "Updated hypothesis",
  metadata: { reason: "New evidence" }
});
```

## Advanced Features

### 1. Graph Analytics
- Community detection for related thought clusters
- Centrality measures for key insights
- Path analysis for reasoning chains

### 2. Visualization
- Interactive graph visualization
- Real-time updates
- Collaborative viewing

## Future Enhancements

1. **Enhanced Analytics**
   - Automated insight detection
   - Pattern recognition in thought chains
   - Quality metrics for reasoning paths

2. **Advanced Integration**
   - Real-time collaboration features
   - External knowledge base connections
   - Custom visualization layouts

## Testing Strategy

1. **Unit Tests**
   - Core graph operations
   - Data validation
   - Error handling

2. **Integration Tests**
   - LLM service interaction
   - HPC integration
   - Neo4j operations

3. **Performance Tests**
   - Large graph operations
   - Concurrent access
   - Memory usage

## Monitoring

- Prometheus metrics for graph operations
- Performance monitoring
- Usage analytics
- Error tracking

## Documentation Structure

- This technical implementation guide
- API documentation (separate file)
- Integration guides (per service)
- Visualization documentation (UI team)