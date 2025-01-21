import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Provider } from '../interfaces/provider.interface';

@Injectable()
export class ProviderFactory {
  private readonly providers: Map<string, Provider>;

  constructor(private readonly configService: ConfigService) {
    this.providers = new Map();
    this.initializeProviders();
  }

  private initializeProviders() {
    // Google Provider
    this.providers.set('google', {
      name: 'google',
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://oauth2.googleapis.com/token',
      scope: ['email', 'profile'],
      async mapProfile(profile: any) {
        return {
          email: profile.email,
          firstName: profile.given_name,
          lastName: profile.family_name,
          picture: profile.picture,
          providerId: profile.sub,
          providerData: profile,
        };
      },
    });

    // GitHub Provider
    this.providers.set('github', {
      name: 'github',
      authorizationURL: 'https://github.com/login/oauth/authorize',
      tokenURL: 'https://github.com/login/oauth/access_token',
      scope: ['user:email'],
      async mapProfile(profile: any) {
        return {
          email: profile.email,
          firstName: profile.name ? profile.name.split(' ')[0] : undefined,
          lastName: profile.name ? profile.name.split(' ')[1] : undefined,
          picture: profile.avatar_url,
          providerId: profile.id.toString(),
          providerData: profile,
        };
      },
    });
  }

  getProvider(name: string): Provider {
    const provider = this.providers.get(name.toLowerCase());
    if (!provider) {
      throw new Error(`Provider ${name} not found`);
    }
    return provider;
  }

  getEnabledProviders(): string[] {
    const enabledProviders = this.configService.get<string>('OAUTH2_ENABLED_PROVIDERS', '');
    return enabledProviders.split(',').map(p => p.trim()).filter(Boolean);
  }

  isProviderEnabled(name: string): boolean {
    return this.getEnabledProviders().includes(name.toLowerCase());
  }
}