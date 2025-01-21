import { Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import neo4j, { Driver, Session, Result } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnApplicationShutdown {
  private readonly logger = new Logger(Neo4jService.name);
  private readonly driver: Driver;

  constructor(private readonly configService: ConfigService) {
    this.driver = neo4j.driver(
      this.configService.neo4jUri,
      neo4j.auth.basic(
        this.configService.neo4jUsername,
        this.configService.neo4jPassword,
      ),
    );
  }

  async onApplicationShutdown() {
    await this.driver.close();
    this.logger.log('Neo4j connection closed');
  }

  getSession(): Session {
    return this.driver.session({
      database: this.configService.neo4jDatabase,
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const session = this.getSession();
      await session.run('RETURN 1');
      await session.close();
      this.logger.log('Neo4j connection verified');
      return true;
    } catch (error) {
      this.logger.error('Failed to verify Neo4j connection:', error.message);
      return false;
    }
  }

  // Graph Analytics Methods

  async runPageRank(options: {
    label?: string;
    relationshipType?: string;
    iterations?: number;
    dampingFactor?: number;
  }): Promise<Result> {
    const {
      label = 'Node',
      relationshipType = 'RELATES_TO',
      iterations = 20,
      dampingFactor = 0.85,
    } = options;

    const session = this.getSession();
    try {
      return await session.run(
        `
        CALL gds.pageRank.stream('${label}Graph', {
          maxIterations: $iterations,
          dampingFactor: $dampingFactor
        })
        YIELD nodeId, score
        RETURN gds.util.asNode(nodeId).name AS name, score
        ORDER BY score DESC
        `,
        { iterations, dampingFactor },
      );
    } finally {
      await session.close();
    }
  }

  async findCommunities(options: {
    label?: string;
    relationshipType?: string;
    minCommunitySize?: number;
  }): Promise<Result> {
    const {
      label = 'Node',
      relationshipType = 'RELATES_TO',
      minCommunitySize = 3,
    } = options;

    const session = this.getSession();
    try {
      return await session.run(
        `
        CALL gds.louvain.stream('${label}Graph', {
          relationshipWeightProperty: 'weight',
          includeIntermediateCommunities: true,
          minCommunitySize: $minCommunitySize
        })
        YIELD nodeId, communityId, intermediateCommunityIds
        RETURN gds.util.asNode(nodeId).name AS name,
               communityId,
               intermediateCommunityIds
        ORDER BY communityId ASC
        `,
        { minCommunitySize },
      );
    } finally {
      await session.close();
    }
  }

  async calculateNodeSimilarity(options: {
    label?: string;
    relationshipType?: string;
    similarityCutoff?: number;
  }): Promise<Result> {
    const {
      label = 'Node',
      relationshipType = 'RELATES_TO',
      similarityCutoff = 0.5,
    } = options;

    const session = this.getSession();
    try {
      return await session.run(
        `
        CALL gds.nodeSimilarity.stream('${label}Graph', {
          similarityCutoff: $similarityCutoff
        })
        YIELD node1, node2, similarity
        RETURN gds.util.asNode(node1).name AS node1Name,
               gds.util.asNode(node2).name AS node2Name,
               similarity
        ORDER BY similarity DESC
        `,
        { similarityCutoff },
      );
    } finally {
      await session.close();
    }
  }

  async findShortestPath(
    startNodeId: string,
    endNodeId: string,
    options: {
      relationshipType?: string;
      weightProperty?: string;
    },
  ): Promise<Result> {
    const {
      relationshipType = 'RELATES_TO',
      weightProperty = 'weight',
    } = options;

    const session = this.getSession();
    try {
      return await session.run(
        `
        MATCH (start), (end)
        WHERE id(start) = $startNodeId AND id(end) = $endNodeId
        CALL gds.shortestPath.dijkstra.stream('myGraph', {
          sourceNode: start,
          targetNode: end,
          relationshipWeightProperty: $weightProperty
        })
        YIELD index, sourceNode, targetNode, totalCost, nodeIds, costs
        RETURN
          [nodeId IN nodeIds | gds.util.asNode(nodeId).name] AS path,
          costs,
          totalCost
        `,
        { startNodeId, endNodeId, weightProperty },
      );
    } finally {
      await session.close();
    }
  }

  // Graph Management Methods

  async createGraphProjection(options: {
    graphName: string;
    nodeLabel: string;
    relationshipType: string;
  }): Promise<Result> {
    const session = this.getSession();
    try {
      return await session.run(
        `
        CALL gds.graph.project(
          $graphName,
          $nodeLabel,
          $relationshipType,
          {
            relationshipProperties: ['weight']
          }
        )
        `,
        options,
      );
    } finally {
      await session.close();
    }
  }

  async dropGraphProjection(graphName: string): Promise<Result> {
    const session = this.getSession();
    try {
      return await session.run(
        'CALL gds.graph.drop($graphName)',
        { graphName },
      );
    } finally {
      await session.close();
    }
  }

  // Data Retention Methods

  async enforceDataRetention(cutoffDate: Date): Promise<{
    deletedNodes: number;
    deletedRelationships: number;
  }> {
    const session = this.getSession();
    try {
      // First, count the nodes and relationships that will be deleted
      const countResult = await session.run(
        `
        MATCH (n)
        WHERE n.createdAt < $cutoffDate
        WITH count(n) as nodeCount
        MATCH (n)-[r]-()
        WHERE n.createdAt < $cutoffDate OR r.createdAt < $cutoffDate
        RETURN nodeCount, count(DISTINCT r) as relCount
        `,
        { cutoffDate: cutoffDate.toISOString() }
      );

      const nodesToDelete = countResult.records[0]?.get('nodeCount').toNumber() || 0;
      const relsToDelete = countResult.records[0]?.get('relCount').toNumber() || 0;

      // Then perform the actual deletion
      await session.run(
        `
        MATCH (n)
        WHERE n.createdAt < $cutoffDate
        WITH n
        LIMIT 1000
        DETACH DELETE n
        `,
        { cutoffDate: cutoffDate.toISOString() }
      );

      return {
        deletedNodes: nodesToDelete,
        deletedRelationships: relsToDelete,
      };
    } finally {
      await session.close();
    }
  }

  async getDataRetentionStats(): Promise<{
    totalNodes: number;
    totalRelationships: number;
    oldestNodeDate: string;
    oldestRelationshipDate: string;
  }> {
    const session = this.getSession();
    try {
      const result = await session.run(`
        MATCH (n)
        WITH count(n) as nodeCount, min(n.createdAt) as oldestNode
        MATCH ()-[r]->()
        RETURN
          nodeCount,
          count(r) as relCount,
          oldestNode,
          min(r.createdAt) as oldestRel
      `);

      const record = result.records[0];
      return {
        totalNodes: record.get('nodeCount').toNumber(),
        totalRelationships: record.get('relCount').toNumber(),
        oldestNodeDate: record.get('oldestNode'),
        oldestRelationshipDate: record.get('oldestRel'),
      };
    } finally {
      await session.close();
    }
  }

  async archiveOldData(cutoffDate: Date, archivePath: string): Promise<{
    archivedNodes: number;
    archivedRelationships: number;
  }> {
    const session = this.getSession();
    try {
      // Export old data to CSV before deletion
      const result = await session.run(
        `
        CALL apoc.export.csv.query(
          "MATCH (n) WHERE n.createdAt < $cutoffDate
           OPTIONAL MATCH (n)-[r]-()
           WHERE r.createdAt < $cutoffDate
           RETURN n, r",
          $archivePath,
          {params: {cutoffDate: $cutoffDate}}
        )
        RETURN count(n) as nodes, count(r) as rels
        `,
        {
          cutoffDate: cutoffDate.toISOString(),
          archivePath,
        }
      );

      const record = result.records[0];
      return {
        archivedNodes: record.get('nodes').toNumber(),
        archivedRelationships: record.get('rels').toNumber(),
      };
    } finally {
      await session.close();
    }
  }
}