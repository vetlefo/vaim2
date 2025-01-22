import { Module } from '@nestjs/common';
import { ThoughtGraphService } from './ThoughtGraphService';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { Neo4jModule } from '../neo4j/neo4j.module';

@Module({
  imports: [MonitoringModule, Neo4jModule],
  providers: [ThoughtGraphService],
  exports: [ThoughtGraphService],
})
export class ThoughtGraphModule {}