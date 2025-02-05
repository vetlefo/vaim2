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