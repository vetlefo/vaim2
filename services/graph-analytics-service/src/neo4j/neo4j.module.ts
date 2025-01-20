import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { Neo4jService } from './neo4j.service';

@Module({
  imports: [ConfigModule],
  providers: [Neo4jService],
  exports: [Neo4jService],
})
export class Neo4jModule {}