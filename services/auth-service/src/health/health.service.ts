import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';
import { Client } from 'pg';
import neo4j from 'neo4j-driver';

@Injectable()
export class HealthService {
  constructor(private configService: AppConfigService) {}

  async checkDatabaseHealth() {
    const status = {
      status: 'healthy',
      postgres: 'disconnected',
      neo4j: 'disconnected',
      details: {
        postgres: null,
        neo4j: null,
      },
    };

    // Get configurations
    const [dbConfig, neo4jConfig] = await Promise.all([
      this.configService.dbConfig(),
      this.configService.neo4jConfig(),
    ]);

    // Check PostgreSQL
    const pgClient = new Client({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.name,
    });

    try {
      await pgClient.connect();
      await pgClient.query('SELECT 1');
      status.postgres = 'connected';
    } catch (error) {
      status.details.postgres = error.message;
    } finally {
      await pgClient.end().catch(() => {});
    }

    // Check Neo4j
    try {
      const neo4jDriver = neo4j.driver(
        neo4jConfig.uri,
        neo4j.auth.basic(
          neo4jConfig.user,
          neo4jConfig.password
        )
      );

      const neo4jSession = neo4jDriver.session();
      await neo4jSession.run('RETURN 1');
      await neo4jSession.close();
      await neo4jDriver.close();
      status.neo4j = 'connected';
    } catch (error) {
      status.details.neo4j = error.message;
    }

    // Overall status is healthy only if both databases are connected
    if (status.postgres !== 'connected' || status.neo4j !== 'connected') {
      status.status = 'unhealthy';
    }

    return status;
  }
}