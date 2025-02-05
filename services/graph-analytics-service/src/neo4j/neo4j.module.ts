import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Neo4jService } from './neo4j.service';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    forwardRef(() => MonitoringModule)
  ],
  providers: [Neo4jService],
  exports: [Neo4jService],
})
export class Neo4jModule {}