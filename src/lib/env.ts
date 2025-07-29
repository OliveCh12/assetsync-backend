/**
 * Environment Configuration
 * 
 * Centralized environment variable types and utilities for Hono
 */

// Define all environment variables used across the application
export type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  NODE_ENV: string;
  PORT: string;
  EMAIL_HOST?: string;
  EMAIL_PORT?: string;
  EMAIL_USERNAME?: string;
  EMAIL_PASSWORD?: string;
  EMAIL_FROM?: string;
  REDIS_URL?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  S3_BUCKET_NAME?: string;
  CLOUDFRONT_DOMAIN?: string;
};

// Common Hono environment type for reuse
export type HonoEnv = {
  Bindings: Bindings;
};

// Environment validation utilities
export function validateRequiredEnv(env: Partial<Bindings>, required: (keyof Bindings)[]): void {
  const missing = required.filter(key => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Default environment values
export const defaultEnv: Partial<Bindings> = {
  NODE_ENV: 'development',
  PORT: '3001',
  FRONTEND_URL: 'http://localhost:3000',
  AWS_REGION: 'us-east-1',
};
