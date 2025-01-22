# Visual Agentic Idea Manager (VAIM)

**Version**: 1.0  
**Last Updated**: 2025-01-22

## 1. Overview

This document describes the Visual Agentic Idea Manager (VAIM), a core component of VAIM2 that manages LLM chain-of-thought and multi-step reasoning in a graph data structure. It provides a visual, agentic approach to managing ideas and their relationships.

### What Problem Does It Solve?

- **Rich, branching reasoning**: Instead of a simple list of "messages," we store each idea as a node in a graph.
- **Revisions & branching**: We handle isRevision, revisesIdea, and branching logic so that partial rewrites or forks are all maintained in a single graph.
- **Metadata tracking**: Each idea can be annotated with type (insight, question, evidence, conclusion), status (active, revised, deprecated), timestamps, or LLM usage info.
- **Neo4j & HPC synergy**: Leverages Graph Analytics Service (Neo4j + GDS library) for advanced queries (like PageRank, bridging detection). HPC can expand or revise large branches in parallel.

### Summary of Key Features

1. **Idea Graph**  
   - Each "idea" is a node (`:IdeaNode`), with edges for revision, branching, or generic relationships.  
   - Potential node properties:
     - `ideaNumber`, `content`, `isRevision`, `branchFromIdea`, `metadata`, `created`, etc.

2. **Operations**  
   - `addIdea()`: Insert a new node, create edges if it's a revision or a branch.  
   - `getRelatedIdeas()`: Query connected ideas.  
   - `toMarkdown()` / `toJSON()`: Export idea graph in a user-friendly format.

3. **LLM Integration**  
   - Each time an LLM step is completed, store it in the graph.  
   - For partial streaming or HPC expansions, keep forking new nodes or referencing the original.

4. **Revision & Branching**  
   - If a node is a revision of a previous idea, store an edge.  
   - If it branches from an earlier step, we store a separate "branch" reference.  
   - This allows the system to maintain a persistent record of how ideas evolved or how alternate solutions diverged.

## 2. Implementation Structure

1. **Core Service**  
   - Located in `services/vaim-service/`
   - Implements core idea management logic
   - Interfaces with Graph Analytics Service for storage
   - Provides API for other services to interact with

2. **LLM Service Integration**  
   - In `services/llm-service/src/`, hooks for storing LLM outputs as ideas
   - Support for both complete responses and streaming chunks

3. **Testing**  
   - Unit tests in `services/vaim-service/test/`
   - Integration tests with LLM and Graph Analytics services
   - E2E tests for complete idea management workflows

4. **UI / Visualization**  
   - Visual graph interface in Phase 5 UI project
   - Interactive idea exploration and manipulation
   - Real-time updates for streaming ideas

## 3. Data Model & Examples

### 3.1 Idea Node Schema

**Label**: `:IdeaNode`

Common properties:

| Property        | Type      | Description                                                    |
|----------------|-----------|----------------------------------------------------------------|
| `ideaNumber`   | `Integer` | Sequential ID or user-supplied ID of the idea                  |
| `content`      | `String`  | Actual content of the idea                                     |
| `isRevision`   | `Boolean` | Indicates if this node modifies or revisits a previous idea    |
| `revisesIdea`  | `Integer` | Optional ID of the idea being revised                          |
| `branchFrom`   | `Integer` | Optional ID if this idea branches off a prior node             |
| `type`         | `String`  | e.g., `'insight', 'question', 'evidence', 'conclusion'`        |
| `status`       | `String`  | `'active', 'revised', 'deprecated'`                            |
| `metadata`     | `Map`     | Arbitrary JSON object for LLM usage, HPC job info, etc.        |
| `created`      | `String`  | Timestamp for creation (ISO date)                              |
| `modified`     | `String`  | Timestamp for last update                                      |

### 3.2 Relationships

- `:REVISES`: Links a revision to its original idea
- `:BRANCHES_FROM`: Indicates branching points in idea development
- `:RELATED_TO`: General relationship for HPC expansions or other connections

## 4. Integration Points

### 4.1 Graph Analytics Service

The VAIM service uses the Graph Analytics Service for:
- Persistent storage of idea nodes and relationships
- Advanced graph queries and analytics
- Community detection and centrality measures

### 4.2 LLM Service

Integration with LLM Service enables:
- Automatic idea capture from LLM responses
- Streaming idea updates
- Parallel idea expansion through HPC

### 4.3 HPC Integration

- Parallel processing of idea branches
- Advanced analytics on the idea graph
- Automated idea expansion and exploration

## 5. Future Enhancements

1. **Advanced Visualization**
   - Interactive graph exploration
   - Real-time collaboration features
   - Custom visualization layouts

2. **AI-Driven Features**
   - Automated idea clustering
   - Suggestion of potential connections
   - Intelligent branch merging

3. **Integration Expansions**
   - Additional LLM provider support
   - Enhanced HPC capabilities
   - External tool integration

## 6. Documentation & Testing

### 6.1 Documentation Structure

- Implementation details (this file)
- API documentation
- Integration guides
- Visualization documentation

### 6.2 Testing Strategy

- Unit tests for core operations
- Integration tests with dependent services
- Performance testing for large idea graphs
- UI/UX testing for visualization components

## 7. Monitoring & Metrics

- Prometheus metrics for idea operations
- Performance monitoring
- Usage analytics
- Error tracking and reporting