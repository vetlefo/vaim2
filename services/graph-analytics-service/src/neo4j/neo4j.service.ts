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
            return await tx.run(query, params);
          }
        );
        return result;
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