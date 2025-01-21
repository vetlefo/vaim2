export interface Provider {
  name: string;
  authorizationURL: string;
  tokenURL: string;
  scope: string[];
  mapProfile: (profile: any) => Promise<MappedProfile>;
}

export interface OAuth2Tokens {
  accessToken: string;
  refreshToken?: string;
}

export interface MappedProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  providerId: string;
  providerData?: any;
}

export interface OAuth2User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  provider: string;
  providerId: string;
  providerData?: any;
  tokens: OAuth2Tokens;
}