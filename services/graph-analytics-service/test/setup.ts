import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '../src/config/config.service';
import { Neo4jService } from '../src/neo4j/neo4j.service';
import { AppModule } from '../src/app.module';

export let app: INestApplication;
export let configService: ConfigService;
export let neo4jService: Neo4jService;

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  
  // Get service instances
  configService = app.get<ConfigService>(ConfigService);
  neo4jService = app.get<Neo4jService>(Neo4jService);

  // Apply global pipes and middleware
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();

  // Verify Neo4j connection
  const isConnected = await neo4jService.verifyConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to Neo4j test database');
  }
});

afterAll(async () => {
  // Clean up test data
  const session = neo4jService.getSession();
  try {
    // Delete all nodes and relationships
    await session.run('MATCH (n) DETACH DELETE n');
    
    // Drop all graph projections
    await session.run('CALL gds.graph.list() YIELD graphName WITH graphName CALL gds.graph.drop(graphName) YIELD graphName as dropped RETURN dropped');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  } finally {
    await session.close();
  }

  await app.close();
});

// Test utilities

export const createTestNode = async (label: string, properties: Record<string, any>) => {
  const session = neo4jService.getSession();
  try {
    const result = await session.run(
      `CREATE (n:${label} $props) RETURN n`,
      { props: properties }
    );
    return result.records[0].get('n');
  } finally {
    await session.close();
  }
};

export const createTestRelationship = async (
  startNodeId: string,
  endNodeId: string,
  type: string,
  properties: Record<string, any> = {}
) => {
  const session = neo4jService.getSession();
  try {
    const result = await session.run(
      `
      MATCH (start), (end)
      WHERE id(start) = $startNodeId AND id(end) = $endNodeId
      CREATE (start)-[r:${type} $props]->(end)
      RETURN r
      `,
      { startNodeId, endNodeId, props: properties }
    );
    return result.records[0].get('r');
  } finally {
    await session.close();
  }
};

export const createTestGraphProjection = async (
  graphName: string,
  nodeLabel: string,
  relationshipType: string
) => {
  const session = neo4jService.getSession();
  try {
    await session.run(
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
      { graphName, nodeLabel, relationshipType }
    );
  } finally {
    await session.close();
  }
};

export const clearTestData = async () => {
  const session = neo4jService.getSession();
  try {
    await session.run('MATCH (n) DETACH DELETE n');
  } finally {
    await session.close();
  }
};