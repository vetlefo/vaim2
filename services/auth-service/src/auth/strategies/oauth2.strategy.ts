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
    super({
      authorizationURL: provider.authorizationURL,
      tokenURL: provider.tokenURL,
      clientID: configService.configService.get(`${provider.name.toUpperCase()}_CLIENT_ID`),
      clientSecret: configService.configService.get(`${provider.name.toUpperCase()}_CLIENT_SECRET`),
      callbackURL: configService.configService.get(`${provider.name.toUpperCase()}_CALLBACK_URL`),
      scope: provider.scope,
      state: true, // Enable CSRF protection
      pkce: true, // Enable PKCE
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