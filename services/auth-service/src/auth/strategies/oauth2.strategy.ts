import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { AppConfigService } from '../../config/config.service';
import { AuthService } from '../auth.service';
import { Provider, OAuth2Tokens, MappedProfile } from '../interfaces/provider.interface';

@Injectable()
export class OAuth2Strategy extends PassportStrategy(Strategy, 'oauth2') {
  constructor(
    private configService: AppConfigService,
    private authService: AuthService,
    private provider: Provider,
  ) {
    // Initialize with required non-sensitive values
    super({
      authorizationURL: provider.authorizationURL,
      tokenURL: provider.tokenURL,
      clientID: '', // Will be set in onModuleInit
      clientSecret: '', // Will be set in onModuleInit
      callbackURL: '', // Will be set in onModuleInit
      scope: provider.scope,
      state: true, // Enable CSRF protection
      pkce: true, // Enable PKCE
    });
  }

  async onModuleInit() {
    // Get OAuth config which handles secrets properly
    const oauthConfig = await this.configService.oauthConfig();
    
    // Update strategy config with actual values based on provider
    let providerConfig: { clientId: string; clientSecret: string; callbackUrl: string };
    
    switch (this.provider.name.toLowerCase()) {
      case 'google':
        providerConfig = oauthConfig.google;
        break;
      case 'github':
        providerConfig = oauthConfig.github;
        break;
      default:
        throw new Error(`OAuth provider ${this.provider.name} not configured`);
    }

    Object.assign(this._oauth2, {
      _clientId: providerConfig.clientId,
      _clientSecret: providerConfig.clientSecret,
      _callbackURL: providerConfig.callbackUrl,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    // Map provider profile to our user model
    const mappedProfile = await this.provider.mapProfile(profile);
    
    // Create or update user
    const user = await this.authService.findOrCreateOAuth2User(
      this.provider.name,
      mappedProfile,
      {
        accessToken,
        refreshToken,
      }
    );

    return user;
  }
}