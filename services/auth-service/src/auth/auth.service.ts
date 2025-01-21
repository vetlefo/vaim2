import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ValidatedUser } from './interfaces/validated-user.interface';
import { RedisService } from '../redis/redis.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { MappedProfile, OAuth2Tokens } from './interfaces/provider.interface';

interface TokenPayload {
  sub: string;
  email: string;
  jti?: string;
  exp?: number;
  iat?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  private generateTokens(payload: TokenPayload) {
    // Generate unique token IDs
    const accessTokenId = uuidv4();
    const refreshTokenId = uuidv4();

    const accessToken = this.jwtService.sign(
      { ...payload, jti: accessTokenId },
      {
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '15m'),
      },
    );

    const refreshToken = this.jwtService.sign(
      { ...payload, jti: refreshTokenId },
      {
        expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION', '7d'),
      },
    );

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, tokenId: string, expiresIn: number) {
    const key = `refresh_token:${userId}:${tokenId}`;
    await this.redisService.storeRefreshToken(key, true, expiresIn * 1000);
  }

  private async validateRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token);
      if (!payload.jti) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const key = `refresh_token:${payload.sub}:${payload.jti}`;
      const isValid = await this.redisService.getRefreshToken(key);

      if (!isValid) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; refresh_token: string; user: ValidatedUser }> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    await this.usersService.update(user.id, { lastLogin: new Date() });

    const payload = {
      sub: user.id,
      email: user.email,
    };

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = this.generateTokens(payload);

    // Store refresh token in Redis
    const decoded = this.jwtService.decode(refreshToken) as TokenPayload;
    if (decoded.jti) {
      const refreshExpiration = parseInt(this.configService.get<string>('REFRESH_TOKEN_EXPIRATION', '7d'));
      await this.storeRefreshToken(user.id, decoded.jti, refreshExpiration * 24 * 60 * 60); // Convert days to seconds
    }

    // Remove password from user object
    const { password, ...validatedUser } = user;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: validatedUser,
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<{ access_token: string; refresh_token: string }> {
    const payload = await this.validateRefreshToken(refreshTokenDto.refreshToken);
    
    // Revoke the old refresh token
    if (payload.jti) {
      const key = `refresh_token:${payload.sub}:${payload.jti}`;
      await this.redisService.deleteRefreshToken(key);
    }

    // Generate new tokens
    const { accessToken, refreshToken } = this.generateTokens({
      sub: payload.sub,
      email: payload.email,
    });

    // Store new refresh token
    const decoded = this.jwtService.decode(refreshToken) as TokenPayload;
    if (decoded.jti) {
      const refreshExpiration = parseInt(this.configService.get<string>('REFRESH_TOKEN_EXPIRATION', '7d'));
      await this.storeRefreshToken(payload.sub, decoded.jti, refreshExpiration * 24 * 60 * 60);
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async findOrCreateOAuth2User(
    provider: string,
    profile: MappedProfile,
    tokens: OAuth2Tokens,
  ): Promise<{ access_token: string; refresh_token: string; user: ValidatedUser }> {
    // Try to find existing user by provider and providerId
    let user = await this.usersService.findByProviderData(provider, profile.providerId);

    if (!user) {
      // Create new user if not found
      user = await this.usersService.create({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        picture: profile.picture,
        provider,
        providerId: profile.providerId,
        providerData: profile.providerData,
        lastLogin: new Date(),
      });
    } else {
      // Update existing user's provider data and last login
      await this.usersService.update(user.id, {
        firstName: profile.firstName || user.firstName,
        lastName: profile.lastName || user.lastName,
        picture: profile.picture || user.picture,
        providerData: profile.providerData,
        lastLogin: new Date(),
      });
    }

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const { accessToken, refreshToken } = this.generateTokens(payload);

    // Store refresh token
    const decoded = this.jwtService.decode(refreshToken) as TokenPayload;
    if (decoded.jti) {
      const refreshExpiration = parseInt(this.configService.get<string>('REFRESH_TOKEN_EXPIRATION', '7d'));
      await this.storeRefreshToken(user.id, decoded.jti, refreshExpiration * 24 * 60 * 60);
    }

    // Store OAuth2 tokens in Redis
    await this.redisService.storeOAuth2Tokens(user.id, provider, tokens);

    // Remove sensitive data
    const { password, ...validatedUser } = user;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: validatedUser,
    };
  }

  async logout(token: string): Promise<void> {
    try {
      // Get token expiration time from JWT
      const decoded = this.jwtService.decode(token) as TokenPayload;
      if (!decoded || !decoded.jti) {
        throw new UnauthorizedException('Invalid token');
      }

      // Add access token to blacklist
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = decoded.exp
        ? decoded.exp - currentTime
        : parseInt(this.configService.get<string>('JWT_EXPIRATION', '900')); // Default 15 minutes in seconds
      
      if (expirationTime > 0) {
        await this.redisService.blacklistToken(token, expirationTime);
      }

      // Revoke refresh token if it exists
      const refreshKey = `refresh_token:${decoded.sub}:${decoded.jti}`;
      await this.redisService.deleteRefreshToken(refreshKey);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}