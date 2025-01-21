import { Controller, Get, Param, UseGuards, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { OAuth2AuthGuard } from '../guards/oauth2-auth.guard';
import { ProviderFactory } from '../providers/provider.factory';

@Controller('auth/oauth2')
export class OAuth2Controller {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly providerFactory: ProviderFactory,
  ) {}

  @Get(':provider')
  @UseGuards(OAuth2AuthGuard)
  async auth(@Param('provider') provider: string) {
    if (!this.providerFactory.isProviderEnabled(provider)) {
      throw new UnauthorizedException(`Provider ${provider} is not enabled`);
    }
    // The guard will handle the redirect to the provider
  }

  @Get(':provider/callback')
  @UseGuards(OAuth2AuthGuard)
  async callback(
    @Param('provider') provider: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('Authentication failed');
    }

    const { user, tokens } = req.user;
    const { access_token, refresh_token } = await this.authService.findOrCreateOAuth2User(
      provider,
      user,
      tokens,
    );

    // Redirect to frontend with tokens
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
      throw new Error('FRONTEND_URL environment variable is not set');
    }

    const redirectUrl = new URL('/auth/callback', frontendUrl);
    redirectUrl.searchParams.set('access_token', access_token);
    redirectUrl.searchParams.set('refresh_token', refresh_token);
    redirectUrl.searchParams.set('provider', provider);

    res.redirect(redirectUrl.toString());
  }
}