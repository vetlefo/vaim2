# Neo4j Service Fixes

## Update `Neo4jService` to Return `Result` Object

To resolve the type issues, the `executeQuery` method in the `Neo4jService` class needs to return a `Result` object. This ensures that the `result` variable is correctly typed.

### Updated `Neo4jService`

```typescript
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import neo4j, { Driver, Session, ManagedTransaction, Result } from 'neo4j-driver';
import { PrometheusService } from '../monitoring/prometheus.service';
import { ThoughtGraphQueries } from './thoughtGraph.queries';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: Driver;

  constructor(
    private readonly config: ConfigService,
    private readonly prometheus: PrometheusService
  ) {}

  async onModuleInit() {
    const uri = this.config.getOrThrow<string>('NEO4J_URI');
    const user = this.config.getOrThrow<string>('NEO4J_USER');
    const password = this.config.getOrThrow<string>('NEO4J_PASSWORD');

    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionPoolSize: 50,
    });

    // Verify connection
    try {
      await this.driver.verifyConnectivity();
    } catch (error) {
      throw new Error(`Neo4j connection failed: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    await this.driver?.close();
  }

  private getSession(): Session {
    return this.driver.session();
  }

  async executeQuery<T>(
    query: string,
    params: Record<string, any>,
    operation: string
  ): Promise<Result> {
    return this.prometheus.trackOperation(`neo4j_${operation}`, async () => {
      const session = this.getSession();
      try {
        const result = await session.executeWrite(
          async (tx: ManagedTransaction) => {
            const response = await tx.run(query, params);
            return response;
          }
        );
        return result as Result;
      } finally {
        await session.close();
      }
    });
  }

  // ThoughtGraph Operations
  async createThought(params: {
    id: number;
    content: string;
    type: string;
    status: string;
    metadata: any;
  }) {
    return this.executeQuery(
      ThoughtGraphQueries.CREATE_THOUGHT,
      params,
      'create_thought'
    );
  }

  async getThought(id: number) {
    return this.executeQuery(
      ThoughtGraphQueries.GET_THOUGHT,
      { id },
      'get_thought'
    );
  }

  async updateThought(params: {
    id: number;
    content: string;
    status: string;
    metadata: any;
  }) {
    return this.executeQuery(
      ThoughtGraphQueries.UPDATE_THOUGHT,
      params,
      'update_thought'
    );
  }

  async createRevision(params: {
    originalId: number;
    revisionId: number;
    reason?: string;
  }) {
    return this.executeQuery(
      ThoughtGraphQueries.CREATE_REVISION,
      params,
      'create_revision'
    );
  }

  async createBranch(params: {
    parentId: number;
    branchId: number;
    metadata?: any;
  }) {
    return this.executeQuery(
      ThoughtGraphQueries.CREATE_BRANCH,
      params,
      'create_branch'
    );
  }

  async getThoughtChain(startId: number) {
    return this.executeQuery(
      ThoughtGraphQueries.GET_THOUGHT_CHAIN,
      { startId },
      'get_thought_chain'
    );
  }

  async getRelatedThoughts(thoughtId: number) {
    return this.executeQuery(
      ThoughtGraphQueries.GET_RELATED_THOUGHTS,
      { thoughtId },
      'get_related_thoughts'
    );
  }

  // HPC Integration
  async markThoughtsForProcessing(batchSize: number) {
    return this.executeQuery(
      ThoughtGraphQueries.MARK_FOR_PROCESSING,
      { batchSize },
      'mark_for_processing'
    );
  }

  async updateHPCResult(params: {
    thoughtId: number;
    status: string;
    result: any;
  }) {
    return this.executeQuery(
      ThoughtGraphQueries.UPDATE_HPC_RESULT,
      params,
      'update_hpc_result'
    );
  }

  // Additional Methods
  async runPageRank(params: any) {
    return this.executeQuery(
      'CALL algo.pageRank() YIELD node, score RETURN node, score',
      params,
      'run_page_rank'
    );
  }

  async findCommunities(params: any) {
    return this.executeQuery(
      'CALL algo.louvain() YIELD nodeId, community RETURN nodeId, community',
      params,
      'find_communities'
    );
  }

  async calculateNodeSimilarity(params: any) {
    return this.executeQuery(
      'CALL algo.similarity.cosine.stream({data:[[1,2],[3,4]]}) YIELD node1, node2, similarity RETURN node1, node2, similarity',
      params,
      'calculate_node_similarity'
    );
  }

  async findShortestPath(params: any) {
    return this.executeQuery(
      'MATCH (a:Node), (b:Node) WHERE id(a) = $startNodeId AND id(b) = $endNodeId CALL algo.shortestPath.stream(a, b) YIELD nodeId, cost RETURN nodeId, cost',
      params,
      'find_shortest_path'
    );
  }

  async createGraphProjection(params: any) {
    return this.executeQuery(
      'CALL gds.graph.project($graphName, $nodeLabels, $relationshipTypes)',
      params,
      'create_graph_projection'
    );
  }

  async dropGraphProjection(graphName: string) {
    return this.executeQuery(
      'CALL gds.graph.drop($graphName)',
      { graphName },
      'drop_graph_projection'
    );
  }

  async verifyConnection() {
    return this.driver.verifyConnectivity();
  }
}
```

## Update `AnalyticsService` to Handle `Result` Object

The `AnalyticsService` needs to handle the `Result` object returned by the `Neo4jService`.

### Updated `AnalyticsService`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import {
  PageRankRequestDto,
  CommunityDetectionRequestDto,
  NodeSimilarityRequestDto,
  ShortestPathRequestDto,
  GraphProjectionRequestDto,
  AnalyticsResultDto,
} from './dto/graph-analytics.dto';
import { Record } from 'neo4j-driver';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly neo4jService: Neo4jService) {}

  async computePageRank(request: PageRankRequestDto): Promise<AnalyticsResultDto> {
    try {
      const result = await this.neo4jService.runPageRank({
        label: request.label,
        relationshipType: request.relationshipType,
        iterations: request.iterations,
        dampingFactor: request.dampingFactor,
      });

      return {
        success: true,
        data: result.records.map((record: Record) => ({
          name: record.get('name'),
          score: record.get('score'),
        })),
      };
    } catch (error) {
      this.logger.error('Failed to compute PageRank:', error);
      return {
        success: false,
        error: 'Failed to compute PageRank analytics',
        data: null,
      };
    }
  }

  async detectCommunities(request: CommunityDetectionRequestDto): Promise<AnalyticsResultDto> {
    try {
      const result = await this.neo4jService.findCommunities({
        label: request.label,
        relationshipType: request.relationshipType,
        minCommunitySize: request.minCommunitySize,
      });

      return {
        success: true,
        data: result.records.map((record: Record) => ({
          name: record.get('name'),
          communityId: record.get('communityId'),
          intermediateCommunityIds: record.get('intermediateCommunityIds'),
        })),
      };
    } catch (error) {
      this.logger.error('Failed to detect communities:', error);
      return {
        success: false,
        error: 'Failed to perform community detection',
        data: null,
      };
    }
  }

  async calculateNodeSimilarity(request: NodeSimilarityRequestDto): Promise<AnalyticsResultDto> {
    try {
      const result = await this.neo4jService.calculateNodeSimilarity({
        label: request.label,
        relationshipType: request.relationshipType,
        similarityCutoff: request.similarityCutoff,
      });

      return {
        success: true,
        data: result.records.map((record: Record) => ({
          node1: record.get('node1Name'),
          node2: record.get('node2Name'),
          similarity: record.get('similarity'),
        })),
      };
    } catch (error) {
      this.logger.error('Failed to calculate node similarity:', error);
      return {
        success: false,
        error: 'Failed to calculate node similarity',
        data: null,
      };
    }
  }

  async findShortestPath(request: ShortestPathRequestDto): Promise<AnalyticsResultDto> {
    try {
      const result = await this.neo4jService.findShortestPath({
        startNodeId: request.startNodeId,
        endNodeId: request.endNodeId,
        relationshipType: request.relationshipType,
        weightProperty: request.weightProperty,
      });

      return {
        success: true,
        data: result.records.map((record: Record) => ({
          path: record.get('path'),
          costs: record.get('costs'),
          totalCost: record.get('totalCost'),
        })),
      };
    } catch (error) {
      this.logger.error('Failed to find shortest path:', error);
      return {
        success: false,
        error: 'Failed to find shortest path',
        data: null,
      };
    }
  }

  async createGraphProjection(request: GraphProjectionRequestDto): Promise<AnalyticsResultDto> {
    try {
      const result = await this.neo4jService.createGraphProjection({
        graphName: request.graphName,
        nodeLabel: request.nodeLabel,
        relationshipType: request.relationshipType,
      });

      return {
        success: true,
        data: {
          graphName: request.graphName,
          nodeCount: result.records[0].get('nodeCount'),
          relationshipCount: result.records[0].get('relationshipCount'),
          projectMillis: result.records[0].get('projectMillis'),
        },
      };
    } catch (error) {
      this.logger.error('Failed to create graph projection:', error);
      return {
        success: false,
        error: 'Failed to create graph projection',
        data: null,
      };
    }
  }

  async dropGraphProjection(graphName: string): Promise<AnalyticsResultDto> {
    try {
      await this.neo4jService.dropGraphProjection(graphName);
      return {
        success: true,
        data: { message: `Graph projection ${graphName} dropped successfully` },
      };
    } catch (error) {
      this.logger.error('Failed to drop graph projection:', error);
      return {
        success: false,
        error: 'Failed to drop graph projection',
        data: null,
      };
    }
  }

  // Expose Neo4j connection verification
  async verifyNeo4jConnection(): Promise<boolean> {
    try {
      await this.neo4jService.verifyConnection();
      return true;
    } catch (error) {
      this.logger.error('Failed to verify Neo4j connection:', error);
      return false;
    }
  }
}
```

## Instructions for Manual Implementation

1. **Update `Neo4jService`**:
   - Replace the content of `services/graph-analytics-service/src/neo4j/neo4j.service.ts` with the updated `Neo4jService` code provided above.

2. **Update `AnalyticsService`**:
   - Replace the content of `services/graph-analytics-service/src/analytics/analytics.service.ts` with the updated `AnalyticsService` code provided above.

3. **Rebuild the `graph-analytics-service`**:
   - Navigate to the `graph-analytics-service` directory:
     ```sh
     cd services/graph-analytics-service
     ```
   - Build the Docker image:
     ```sh
     docker-compose up --build
     ```

This will ensure that all changes are applied correctly and the service is rebuilt with the updated `Neo4jService` and `AnalyticsService`.

For further assistance, refer to the troubleshooting tips provided in the `implementation/redis-port-configuration.md` file.