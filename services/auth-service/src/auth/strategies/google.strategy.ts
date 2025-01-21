import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { ProviderFactory } from '../providers/provider.factory';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly providerFactory: ProviderFactory,
  ) {
    const provider = providerFactory.getProvider('google');
    
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: provider.scope,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    const provider = this.providerFactory.getProvider('google');
    const mappedProfile = await provider.mapProfile({
      email: profile.emails[0].value,
      given_name: profile.name.givenName,
      family_name: profile.name.familyName,
      picture: profile.photos[0].value,
      sub: profile.id,
      ...profile,
    });

    return {
      user: mappedProfile,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }
}