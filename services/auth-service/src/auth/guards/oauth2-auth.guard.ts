import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProviderFactory } from '../providers/provider.factory';

@Injectable()
export class OAuth2AuthGuard extends AuthGuard('oauth2') {
  constructor(private readonly providerFactory: ProviderFactory) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const provider = request.params.provider?.toLowerCase();

    if (!provider || !this.providerFactory.isProviderEnabled(provider)) {
      return false;
    }

    // Use the provider-specific strategy
    return (AuthGuard(provider).prototype.canActivate.call(this, context)) as Promise<boolean>;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const provider = request.params.provider?.toLowerCase();
    return {
      session: false,
      state: true,
      pkce: true,
    };
  }
}