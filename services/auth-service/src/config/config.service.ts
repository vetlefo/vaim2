import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretsManagerService } from './secrets-manager.service';

@Injectable()
export class AppConfigService implements OnModuleInit {
  private isProduction: boolean;
  private cachedSecrets: Record<string, string> = {};

  constructor(
    private configService: ConfigService,
    private secretsManager: SecretsManagerService,
  ) {
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
  }

  async onModuleInit() {
    if (this.isProduction) {
      // Pre-load all secrets in production
      this.cachedSecrets = await this.secretsManager.getSecrets([
        'DB_USER',
        'DB_PASSWORD',
        'NEO4J_USER',
        'NEO4J_PASSWORD',
        'JWT_SECRET',
        'OAUTH2_STATE_SECRET',
        'GOOGLE_CLIENT_SECRET',
        'GITHUB_CLIENT_SECRET',
        'REDIS_PASSWORD',
      ]);
    }
  }

  private async getSecretOrEnv(key: string): Promise<string | undefined> {
    if (this.isProduction) {
      return this.cachedSecrets[key] || await this.secretsManager.getSecret(key);
    }
    return this.configService.get<string>(key);
  }

  async dbConfig() {
    const [user, password] = await Promise.all([
      this.getSecretOrEnv('DB_USER'),
      this.getSecretOrEnv('DB_PASSWORD'),
    ]);

    return {
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      user: user!,
      password: password!,
      name: this.configService.get<string>('DB_NAME'),
    };
  }

  async neo4jConfig() {
    const [user, password] = await Promise.all([
      this.getSecretOrEnv('NEO4J_USER'),
      this.getSecretOrEnv('NEO4J_PASSWORD'),
    ]);

    return {
      uri: this.configService.get<string>('NEO4J_URI')!,
      user: user!,
      password: password!,
    };
  }

  async jwtConfig() {
    const secret = await this.getSecretOrEnv('JWT_SECRET');
    return {
      secret: secret!,
      expiresIn: this.configService.get<string>('JWT_EXPIRATION', '24h'),
    };
  }

  async oauthConfig() {
    const [stateSecret, googleSecret, githubSecret] = await Promise.all([
      this.getSecretOrEnv('OAUTH2_STATE_SECRET'),
      this.getSecretOrEnv('GOOGLE_CLIENT_SECRET'),
      this.getSecretOrEnv('GITHUB_CLIENT_SECRET'),
    ]);

    return {
      stateSecret: stateSecret!,
      google: {
        clientId: this.configService.get<string>('GOOGLE_CLIENT_ID')!,
        clientSecret: googleSecret!,
        callbackUrl: this.configService.get<string>('GOOGLE_CALLBACK_URL')!,
      },
      github: {
        clientId: this.configService.get<string>('GITHUB_CLIENT_ID')!,
        clientSecret: githubSecret!,
        callbackUrl: this.configService.get<string>('GITHUB_CALLBACK_URL')!,
      },
    };
  }

  async redisConfig() {
    const password = await this.getSecretOrEnv('REDIS_PASSWORD');
    return {
      host: this.configService.get<string>('REDIS_HOST')!,
      port: this.configService.get<number>('REDIS_PORT')!,
      password: password,
    };
  }

  get port(): number {
    return this.configService.get<number>('PORT')!;
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV')!;
  }
}