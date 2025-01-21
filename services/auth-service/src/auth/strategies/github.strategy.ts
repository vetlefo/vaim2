import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { ProviderFactory } from '../providers/provider.factory';
import axios from 'axios';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly configService: ConfigService,
    private readonly providerFactory: ProviderFactory,
  ) {
    const provider = providerFactory.getProvider('github');
    
    const clientID = configService.get('GITHUB_CLIENT_ID');
    const clientSecret = configService.get('GITHUB_CLIENT_SECRET');
    const callbackURL = configService.get('GITHUB_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('GitHub OAuth configuration is missing');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['user:email', ...provider.scope],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    const provider = this.providerFactory.getProvider('github');

    // Get user's primary email from GitHub API if not in profile
    let email = profile.emails?.[0]?.value;
    if (!email) {
      try {
        const response = await axios.get('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const primaryEmail = response.data.find((email: any) => email.primary);
        if (!primaryEmail?.email) {
          throw new UnauthorizedException('No primary email found in GitHub account');
        }
        email = primaryEmail.email;
      } catch (error) {
        throw new UnauthorizedException('Failed to fetch GitHub email');
      }
    }

    // Get additional user data from GitHub API
    try {
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const mappedProfile = await provider.mapProfile({
        email,
        name: userResponse.data.name || profile.username,
        avatar_url: userResponse.data.avatar_url,
        id: profile.id,
        login: userResponse.data.login,
        bio: userResponse.data.bio,
        company: userResponse.data.company,
        location: userResponse.data.location,
        blog: userResponse.data.blog,
        public_repos: userResponse.data.public_repos,
        followers: userResponse.data.followers,
        following: userResponse.data.following,
        created_at: userResponse.data.created_at,
        updated_at: userResponse.data.updated_at,
      });

      return {
        user: mappedProfile,
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to fetch GitHub user data');
    }
  }
}