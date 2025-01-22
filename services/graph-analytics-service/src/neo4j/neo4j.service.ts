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
  ): Promise<T> {
    return this.prometheus.trackOperation(`neo4j_${operation}`, async () => {
      const session = this.getSession();
      try {
        const result = await session.executeWrite(
          async (tx: ManagedTransaction) => {
            const response = await tx.run(query, params);
            return response.records;
          }
        );
        return result as unknown as T;
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
}