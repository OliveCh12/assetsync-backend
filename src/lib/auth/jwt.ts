/**
 * JWT Authentication Utilities
 * 
 * JWT token generation, verification, and management using Hono's built-in JWT helpers.
 */

import { sign, verify } from 'hono/jwt';

// JWT configuration constants
export const JWT_ALGORITHM = 'HS256' as const;
export const ACCESS_TOKEN_EXPIRES_IN = 60 * 15; // 15 minutes
export const REFRESH_TOKEN_EXPIRES_IN = 60 * 60 * 24 * 7; // 7 days

// JWT algorithm type for better type safety
export type JWTAlgorithm = typeof JWT_ALGORITHM;

export interface UserJWTPayload {
  userId: string;
  email: string;
  type: 'personal' | 'professional';
  tokenType: 'access' | 'refresh';
  iat: number;
  exp: number;
  [key: string]: any; // Index signature for JWT compatibility
}

/**
 * Generate an access token for a user
 */
export const generateAccessToken = async (
  userId: string,
  email: string,
  userType: 'personal' | 'professional',
  secret: string
): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  const payload: UserJWTPayload = {
    userId,
    email,
    type: userType,
    tokenType: 'access',
    iat: now,
    exp: now + ACCESS_TOKEN_EXPIRES_IN,
  };

  return await sign(payload, secret, JWT_ALGORITHM);
};

/**
 * Generate a refresh token for a user
 */
export const generateRefreshToken = async (
  userId: string,
  email: string,
  userType: 'personal' | 'professional',
  secret: string
): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  const payload: UserJWTPayload = {
    userId,
    email,
    type: userType,
    tokenType: 'refresh',
    iat: now,
    exp: now + REFRESH_TOKEN_EXPIRES_IN,
  };

  return await sign(payload, secret, JWT_ALGORITHM);
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = async (
  userId: string,
  email: string,
  userType: 'personal' | 'professional',
  secret: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(userId, email, userType, secret),
    generateRefreshToken(userId, email, userType, secret),
  ]);

  return { accessToken, refreshToken };
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = async (
  token: string,
  secret: string
): Promise<UserJWTPayload> => {
  try {
    const payload = await verify(token, secret, JWT_ALGORITHM);
    return payload as UserJWTPayload;
  } catch (error) {
    throw new Error(`Invalid token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Extract the JWT string from an Authorization header.
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  return parts[1];
};

