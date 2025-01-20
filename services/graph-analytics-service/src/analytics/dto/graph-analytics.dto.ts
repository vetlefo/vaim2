import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class PageRankRequestDto {
  @ApiProperty({ required: false, description: 'Node label to analyze' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({ required: false, description: 'Relationship type to traverse' })
  @IsString()
  @IsOptional()
  relationshipType?: string;

  @ApiProperty({ required: false, description: 'Number of iterations', minimum: 1, maximum: 50 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  iterations?: number;

  @ApiProperty({ required: false, description: 'Damping factor', minimum: 0, maximum: 1 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  dampingFactor?: number;
}

export class CommunityDetectionRequestDto {
  @ApiProperty({ required: false, description: 'Node label to analyze' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({ required: false, description: 'Relationship type to traverse' })
  @IsString()
  @IsOptional()
  relationshipType?: string;

  @ApiProperty({ required: false, description: 'Minimum community size', minimum: 2 })
  @IsNumber()
  @IsOptional()
  @Min(2)
  minCommunitySize?: number;
}

export class NodeSimilarityRequestDto {
  @ApiProperty({ required: false, description: 'Node label to analyze' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({ required: false, description: 'Relationship type to traverse' })
  @IsString()
  @IsOptional()
  relationshipType?: string;

  @ApiProperty({ required: false, description: 'Similarity cutoff threshold', minimum: 0, maximum: 1 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  similarityCutoff?: number;
}

export class ShortestPathRequestDto {
  @ApiProperty({ description: 'Start node ID' })
  @IsString()
  startNodeId: string;

  @ApiProperty({ description: 'End node ID' })
  @IsString()
  endNodeId: string;

  @ApiProperty({ required: false, description: 'Relationship type to traverse' })
  @IsString()
  @IsOptional()
  relationshipType?: string;

  @ApiProperty({ required: false, description: 'Weight property name' })
  @IsString()
  @IsOptional()
  weightProperty?: string;
}

export class GraphProjectionRequestDto {
  @ApiProperty({ description: 'Name of the graph projection' })
  @IsString()
  graphName: string;

  @ApiProperty({ description: 'Node label to project' })
  @IsString()
  nodeLabel: string;

  @ApiProperty({ description: 'Relationship type to project' })
  @IsString()
  relationshipType: string;
}

export class GraphProjectionResponseDto {
  @ApiProperty()
  graphName: string;

  @ApiProperty()
  nodeCount: number;

  @ApiProperty()
  relationshipCount: number;

  @ApiProperty()
  projectMillis: number;
}

export class AnalyticsResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: any;

  @ApiProperty({ required: false })
  error?: string;
}