import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get dbConfig() {
    return {
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      user: this.configService.get<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD'),
      name: this.configService.get<string>('DB_NAME'),
    };
  }

  get neo4jConfig() {
    return {
      uri: this.configService.get<string>('NEO4J_URI')!,
      user: this.configService.get<string>('NEO4J_USER')!,
      password: this.configService.get<string>('NEO4J_PASSWORD')!,
    };
  }

  get port(): number {
    return this.configService.get<number>('PORT')!;
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV')!;
  }
}