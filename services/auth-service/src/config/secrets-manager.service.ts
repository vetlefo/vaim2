import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecretsManagerService implements OnModuleInit {
  private secretsManager: SecretsManagerClient;
  private cachedSecrets: { [key: string]: string } = {};

  constructor(private configService: ConfigService) {
    this.secretsManager = new SecretsManagerClient({
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  async onModuleInit() {
    // Load secrets on startup if not in development mode
    if (this.configService.get<string>('NODE_ENV') !== 'development') {
      await this.loadSecrets();
    }
  }

  private async loadSecrets() {
    const secretId = this.configService.get<string>('AWS_SECRET_ID');
    if (!secretId) {
      throw new Error('AWS_SECRET_ID is required in production');
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: secretId });
      const response = await this.secretsManager.send(command);
      
      if (response.SecretString) {
        this.cachedSecrets = JSON.parse(response.SecretString);
      }
    } catch (error) {
      console.error('Failed to load secrets:', error);
      throw error;
    }
  }

  async getSecret(key: string): Promise<string | undefined> {
    // In development, fall back to environment variables
    if (this.configService.get<string>('NODE_ENV') === 'development') {
      return this.configService.get<string>(key);
    }

    // Ensure secrets are loaded
    if (Object.keys(this.cachedSecrets).length === 0) {
      await this.loadSecrets();
    }

    return this.cachedSecrets[key];
  }

  // Helper method to get multiple secrets at once
  async getSecrets(keys: string[]): Promise<{ [key: string]: string }> {
    const secrets: { [key: string]: string } = {};
    
    for (const key of keys) {
      secrets[key] = await this.getSecret(key) || '';
    }
    
    return secrets;
  }
}