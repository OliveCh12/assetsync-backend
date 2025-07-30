/**
 * Authentication Middleware
 * 
 * Hono middleware for JWT authentication and user context injection.
 */

import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { env } from 'hono/adapter';
import { verifyToken, extractTokenFromHeader, type UserJWTPayload } from '../lib/auth/jwt.js';
import { getDatabase } from '../lib/db.js';
import { users } from '../lib/db.js';
import { eq, and } from 'drizzle-orm';

// Extend Hono's Variables type to include our user context
declare module 'hono' {
  interface ContextVariableMap {
    user: UserJWTPayload;
    userId: string;
  }
}

/**
 * Middleware to authenticate JWT tokens and inject user context
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    throw new HTTPException(401, { 
      message: 'Authentication required' 
    });
  }

  try {
    // Get JWT secret from environment using Hono's env helper
    const { JWT_SECRET } = env<{ JWT_SECRET: string }>(c);
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    // Verify the JWT token
    const payload = await verifyToken(token, JWT_SECRET);

    // Validate that this is an access token
    if (payload.tokenType !== 'access') {
      throw new HTTPException(401, { 
        message: 'Invalid token type' 
      });
    }

    // Optional: Check if user still exists and is active
    const db = getDatabase();
    const user = await db.select({
      id: users.id,
      email: users.email,
      type: users.type,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

    if (!user[0] || user[0].deletedAt) {
      throw new HTTPException(401, { 
        message: 'User account not found or deactivated' 
      });
    }

    // Set user context in Hono variables
    c.set('user', payload);
    c.set('userId', payload.userId);

    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    
    throw new HTTPException(401, { 
      message: 'Invalid or expired token' 
    });
  }
});

/**
 * Optional middleware to validate session in database (for stricter security)
 */

/**
 * Middleware to check user type (personal vs professional)
 */
export const requireUserType = (requiredType: 'personal' | 'professional') => {
  return createMiddleware(async (c, next) => {
    const user = c.get('user');
    
    if (!user) {
      throw new HTTPException(401, { 
        message: 'Authentication required' 
      });
    }

    if (user.type !== requiredType) {
      throw new HTTPException(403, { 
        message: `This endpoint requires ${requiredType} account type` 
      });
    }

    await next();
  });
};

/**
 * Middleware to check organization membership (for professional features)
 */
export const requireOrganizationAccess = (organizationId?: string) => {
  return createMiddleware(async (c, next) => {
    const userId = c.get('userId');
    
    if (!userId) {
      throw new HTTPException(401, { 
        message: 'Authentication required' 
      });
    }

    // If organizationId is provided, check specific org access
    // If not, just ensure user has access to some organization
    const orgId = organizationId || c.req.param('organizationId');
    
    if (orgId) {
      const db = getDatabase();
      const { userOrganizations } = await import('../lib/db.js');
      
      const membership = await db.select({
        id: userOrganizations.id,
        role: userOrganizations.role,
      })
      .from(userOrganizations)
      .where(
        and(
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.organizationId, orgId)
        )
      )
      .limit(1);

      if (!membership[0]) {
        throw new HTTPException(403, { 
          message: 'Access denied to this organization' 
        });
      }

      // Add organization context to variables
      c.set('organizationId', orgId);
      c.set('userRole', membership[0].role);
    }

    await next();
  });
};
