/**
 * JWT Authentication Utilities
 * 
 * JWT token generation, verification, and management using Hono's built-in JWT helpers.
 */

import { sign, verify, decode } from 'hono/jwt';

// JWT configuration
const JWT_ALGORITHM = 'HS256' as const;
const ACCESS_TOKEN_EXPIRES_IN = 60 * 15; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = 60 * 60 * 24 * 7; // 7 days

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
 * Decode a JWT token without verification (for debugging)
 */
export const decodeToken = (token: string): { header: any; payload: UserJWTPayload } => {
  try {
    const decoded = decode(token);
    return {
      header: decoded.header,
      payload: decoded.payload as UserJWTPayload
    };
  } catch (error) {
    throw new Error(`Failed to decode token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Check if a token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const { payload } = decodeToken(token);
    const now = Math.floor(Date.now() / 1000);
    return payload.exp ? payload.exp < now : true;
  } catch {
    return true; // If we can't decode, consider it expired
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

/**
 * Generate a secure random session token for database storage
 */
export const generateSessionToken = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};
