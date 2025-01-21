import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Add a token to the blacklist
   * @param token The JWT token to blacklist
   * @param expirationTime Time in seconds until the token expires
   */
  async blacklistToken(token: string, expirationTime: number): Promise<void> {
    await this.cacheManager.set(`blacklist:${token}`, true, expirationTime * 1000);
  }

  /**
   * Check if a token is blacklisted
   * @param token The JWT token to check
   * @returns boolean indicating if the token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.cacheManager.get(`blacklist:${token}`);
    return !!blacklisted;
  }

  /**
   * Remove a token from the blacklist
   * @param token The JWT token to remove from blacklist
   */
  async removeFromBlacklist(token: string): Promise<void> {
    await this.cacheManager.del(`blacklist:${token}`);
  }

  /**
   * Store a refresh token
   * @param key The refresh token key
   * @param value The value to store
   * @param expirationTime Time in milliseconds until the token expires
   */
  async storeRefreshToken(key: string, value: any, expirationTime: number): Promise<void> {
    await this.cacheManager.set(key, value, expirationTime);
  }

  /**
   * Get a refresh token
   * @param key The refresh token key
   * @returns The stored value
   */
  async getRefreshToken(key: string): Promise<any> {
    return this.cacheManager.get(key);
  }

  /**
   * Delete a refresh token
   * @param key The refresh token key
   */
  async deleteRefreshToken(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Store OAuth2 provider tokens for a user
   * @param userId The user's ID
   * @param provider The OAuth2 provider name
   * @param tokens The provider tokens to store
   */
  async storeOAuth2Tokens(userId: string, provider: string, tokens: any): Promise<void> {
    const key = `oauth2:${userId}:${provider}`;
    await this.cacheManager.set(key, tokens);
  }

  /**
   * Get OAuth2 provider tokens for a user
   * @param userId The user's ID
   * @param provider The OAuth2 provider name
   * @returns The stored provider tokens
   */
  async getOAuth2Tokens(userId: string, provider: string): Promise<any> {
    const key = `oauth2:${userId}:${provider}`;
    return this.cacheManager.get(key);
  }

  /**
   * Delete OAuth2 provider tokens for a user
   * @param userId The user's ID
   * @param provider The OAuth2 provider name
   */
  async deleteOAuth2Tokens(userId: string, provider: string): Promise<void> {
    const key = `oauth2:${userId}:${provider}`;
    await this.cacheManager.del(key);
  }
}