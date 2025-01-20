import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
  PageRankRequestDto,
  CommunityDetectionRequestDto,
  NodeSimilarityRequestDto,
  ShortestPathRequestDto,
  GraphProjectionRequestDto,
  AnalyticsResultDto,
} from './dto/graph-analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('pagerank')
  @ApiOperation({ summary: 'Compute PageRank for nodes in the graph' })
  @ApiResponse({
    status: 200,
    description: 'PageRank computed successfully',
    type: AnalyticsResultDto,
  })
  async computePageRank(
    @Body() request: PageRankRequestDto,
  ): Promise<AnalyticsResultDto> {
    this.logger.log('Computing PageRank analytics');
    return this.analyticsService.computePageRank(request);
  }

  @Post('communities')
  @ApiOperation({ summary: 'Detect communities in the graph' })
  @ApiResponse({
    status: 200,
    description: 'Communities detected successfully',
    type: AnalyticsResultDto,
  })
  async detectCommunities(
    @Body() request: CommunityDetectionRequestDto,
  ): Promise<AnalyticsResultDto> {
    this.logger.log('Detecting communities');
    return this.analyticsService.detectCommunities(request);
  }

  @Post('similarity')
  @ApiOperation({ summary: 'Calculate node similarity' })
  @ApiResponse({
    status: 200,
    description: 'Node similarity calculated successfully',
    type: AnalyticsResultDto,
  })
  async calculateNodeSimilarity(
    @Body() request: NodeSimilarityRequestDto,
  ): Promise<AnalyticsResultDto> {
    this.logger.log('Calculating node similarity');
    return this.analyticsService.calculateNodeSimilarity(request);
  }

  @Post('shortest-path')
  @ApiOperation({ summary: 'Find shortest path between nodes' })
  @ApiResponse({
    status: 200,
    description: 'Shortest path found successfully',
    type: AnalyticsResultDto,
  })
  async findShortestPath(
    @Body() request: ShortestPathRequestDto,
  ): Promise<AnalyticsResultDto> {
    this.logger.log('Finding shortest path');
    return this.analyticsService.findShortestPath(request);
  }

  @Post('graph-projections')
  @ApiOperation({ summary: 'Create a new graph projection' })
  @ApiResponse({
    status: 200,
    description: 'Graph projection created successfully',
    type: AnalyticsResultDto,
  })
  async createGraphProjection(
    @Body() request: GraphProjectionRequestDto,
  ): Promise<AnalyticsResultDto> {
    this.logger.log(`Creating graph projection: ${request.graphName}`);
    return this.analyticsService.createGraphProjection(request);
  }

  @Delete('graph-projections/:name')
  @ApiOperation({ summary: 'Drop a graph projection' })
  @ApiResponse({
    status: 200,
    description: 'Graph projection dropped successfully',
    type: AnalyticsResultDto,
  })
  async dropGraphProjection(
    @Param('name') graphName: string,
  ): Promise<AnalyticsResultDto> {
    this.logger.log(`Dropping graph projection: ${graphName}`);
    return this.analyticsService.dropGraphProjection(graphName);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check Neo4j connection health' })
  @ApiResponse({
    status: 200,
    description: 'Neo4j connection status',
    type: Boolean,
  })
  async checkHealth(): Promise<boolean> {
    this.logger.log('Checking Neo4j connection health');
    return this.analyticsService.verifyNeo4jConnection();
  }
}