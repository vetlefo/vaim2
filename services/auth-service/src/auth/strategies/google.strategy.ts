import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { ProviderFactory } from '../providers/provider.factory';
import { Request } from 'express';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly providerFactory: ProviderFactory,
  ) {
    const provider = providerFactory.getProvider('google');
    
    const clientID = configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Google OAuth configuration is missing');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: provider.scope,
      passReqToCallback: true,
    });
  }

  async validate(
    request: Request,
    accessToken: string,
    refreshToken: string,
    profile: {
      id: string;
      emails: Array<{ value: string }>;
      name: { givenName: string; familyName: string };
      photos: Array<{ value: string }>;
    },
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