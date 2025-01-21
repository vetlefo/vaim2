import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OAuth2Controller } from './controllers/oauth2.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OAuth2Strategy } from './strategies/oauth2.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { ProviderFactory } from './providers/provider.factory';
import { RedisModule } from '../redis/redis.module';

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
    ProviderFactory
  ],
  exports: [AuthService],
})
export class AuthModule {}