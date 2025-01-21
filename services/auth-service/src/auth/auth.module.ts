import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthService } from '@auth/auth.service';
import { AuthController } from '@auth/auth.controller';
import { OAuth2Controller } from '@auth/controllers/oauth2.controller';
import { JwtStrategy } from '@auth/strategies/jwt.strategy';
import { OAuth2Strategy } from '@auth/strategies/oauth2.strategy';
import { GoogleStrategy } from '@auth/strategies/google.strategy';
import { GitHubStrategy } from '@auth/strategies/github.strategy';
import { ProviderFactory } from '@auth/providers/provider.factory';
import { RedisModule } from '../redis/redis.module';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    UsersModule,
    RedisModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, OAuth2Controller],
  providers: [
    AuthService,
    JwtStrategy,
    OAuth2Strategy,
    GoogleStrategy,
    GitHubStrategy,
    ProviderFactory,
    RolesGuard
  ],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}