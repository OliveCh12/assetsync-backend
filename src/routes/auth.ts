/**
 * Authentication Routes
 * 
 * Hono RPC routes for user authentication (register, login, password reset, etc.)
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';
import { env } from 'hono/adapter';
import { z } from 'zod';
import { getDatabase } from '../lib/db.js';
import { users, sessions, passwordResets } from '../lib/db.js';
import { eq, and, gt } from 'drizzle-orm';
import { 
  userRegistrationSchema, 
  userLoginSchema, 
  passwordResetRequestSchema,
  passwordResetSchema,
  emailVerificationSchema
} from '../lib/validation/index.js';
import { hashPassword, verifyPassword, generateResetToken, generateVerificationToken } from '../lib/auth/passwords.js';
import { generateTokenPair, verifyToken } from '../lib/auth/jwt.js';
import type { HonoEnv } from '../lib/env.js';

const app = new Hono<HonoEnv>();

/**
 * POST /register - User Registration
 */
const registerRoute = app.post(
  '/register',
  zValidator('json', userRegistrationSchema),
  async (c) => {
    const { email, password, firstName, lastName, type } = c.req.valid('json');
    const db = getDatabase();

    try {
      // Check if user already exists
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new HTTPException(409, { 
          message: 'User with this email already exists' 
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Generate email verification token
      const verificationToken = generateVerificationToken();

      // Create user
      const newUser = await db.insert(users).values({
        email,
        passwordHash,
        firstName,
        lastName,
        type,
        emailVerified: false, // Will be verified later
      }).returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        type: users.type,
        createdAt: users.createdAt,
      });

      const user = newUser[0];

      // Generate JWT tokens
      const { JWT_SECRET } = env<{ JWT_SECRET: string }>(c);
      if (!JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
      }

      const { accessToken, refreshToken } = await generateTokenPair(
        user.id, 
        user.email, 
        user.type, 
        JWT_SECRET
      );

      // Store session in database
      await db.insert(sessions).values({
        userId: user.id,
        token: accessToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      return c.json({
        success: true,
        message: 'User registered successfully',
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
        // In real app, send verification email instead of returning token
        verificationToken, // Remove this in production
      }, 201);

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('Registration error:', error);
      throw new HTTPException(500, { 
        message: 'Internal server error during registration' 
      });
    }
  }
);

/**
 * POST /login - User Login
 */
const loginRoute = app.post(
  '/login',
  zValidator('json', userLoginSchema),
  async (c) => {
    const { email, password } = c.req.valid('json');
    const db = getDatabase();

    try {
      // Find user by email
      const userResult = await db.select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        firstName: users.firstName,
        lastName: users.lastName,
        type: users.type,
        emailVerified: users.emailVerified,
        deletedAt: users.deletedAt,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

      if (!userResult[0] || userResult[0].deletedAt) {
        throw new HTTPException(401, { 
          message: 'Invalid email or password' 
        });
      }

      const user = userResult[0];

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new HTTPException(401, { 
          message: 'Invalid email or password' 
        });
      }

      // Generate JWT tokens
      const { JWT_SECRET } = env<{ JWT_SECRET: string }>(c);
      if (!JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
      }

      const { accessToken, refreshToken } = await generateTokenPair(
        user.id, 
        user.email, 
        user.type, 
        JWT_SECRET
      );

      // Store session in database
      await db.insert(sessions).values({
        userId: user.id,
        token: accessToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      // Update last login
      await db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      return c.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          type: user.type,
          emailVerified: user.emailVerified,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      });

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('Login error:', error);
      throw new HTTPException(500, { 
        message: 'Internal server error during login' 
      });
    }
  }
);

/**
 * POST /logout - User Logout
 */
const logoutRoute = app.post(
  '/logout',
  async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: true, message: 'Already logged out' });
    }

    const token = authHeader.substring(7);
    const db = getDatabase();

    try {
      // Remove session from database
      await db.delete(sessions)
        .where(eq(sessions.token, token));

      return c.json({
        success: true,
        message: 'Logout successful',
      });

    } catch (error) {
      console.error('Logout error:', error);
      return c.json({
        success: true,
        message: 'Logout completed',
      });
    }
  }
);

/**
 * POST /refresh-token - Refresh Access Token
 */
const refreshTokenRoute = app.post(
  '/refresh-token',
  zValidator('json', z.object({ refreshToken: z.string() })),
  async (c) => {
    const { refreshToken } = c.req.valid('json');
    
    try {
      const { JWT_SECRET } = env<{ JWT_SECRET: string }>(c);
      if (!JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
      }

      // Verify refresh token
      const payload = await verifyToken(refreshToken, JWT_SECRET);
      
      if (payload.tokenType !== 'refresh') {
        throw new HTTPException(401, { 
          message: 'Invalid token type' 
        });
      }

      const db = getDatabase();
      
      // Verify user still exists
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
          message: 'User not found' 
        });
      }

      // Generate new token pair
      const { accessToken, refreshToken: newRefreshToken } = await generateTokenPair(
        user[0].id, 
        user[0].email, 
        user[0].type, 
        JWT_SECRET
      );

      // Store new session
      await db.insert(sessions).values({
        userId: user[0].id,
        token: accessToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      return c.json({
        success: true,
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      });

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      throw new HTTPException(401, { 
        message: 'Invalid or expired refresh token' 
      });
    }
  }
);

/**
 * POST /password-reset-request - Request Password Reset
 */
const passwordResetRequestRoute = app.post(
  '/password-reset-request',
  zValidator('json', passwordResetRequestSchema),
  async (c) => {
    const { email } = c.req.valid('json');
    const db = getDatabase();

    try {
      // Find user by email
      const user = await db.select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

      // Always return success to prevent email enumeration attacks
      if (!user[0]) {
        return c.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        });
      }

      // Generate reset token
      const resetToken = generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await db.insert(passwordResets).values({
        userId: user[0].id,
        token: resetToken,
        expiresAt,
      });

      // TODO: Send email with reset link
      // In production, use email service like Resend, SendGrid, etc.
      console.log(`Password reset token for ${email}: ${resetToken}`);

      return c.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
        // Remove in production:
        resetToken, 
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      throw new HTTPException(500, { 
        message: 'Internal server error' 
      });
    }
  }
);

/**
 * POST /password-reset - Reset Password
 */
const passwordResetRoute = app.post(
  '/password-reset',
  zValidator('json', passwordResetSchema),
  async (c) => {
    const { token, newPassword } = c.req.valid('json');
    const db = getDatabase();

    try {
      // Find valid reset token
      const resetRequest = await db.select({
        id: passwordResets.id,
        userId: passwordResets.userId,
        expiresAt: passwordResets.expiresAt,
        usedAt: passwordResets.usedAt,
      })
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.token, token),
          gt(passwordResets.expiresAt, new Date())
        )
      )
      .limit(1);

      if (!resetRequest[0] || resetRequest[0].usedAt) {
        throw new HTTPException(400, { 
          message: 'Invalid or expired reset token' 
        });
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update user password
      await db.update(users)
        .set({ 
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, resetRequest[0].userId));

      // Mark reset token as used
      await db.update(passwordResets)
        .set({ usedAt: new Date() })
        .where(eq(passwordResets.id, resetRequest[0].id));

      // Invalidate all existing sessions for this user
      await db.delete(sessions)
        .where(eq(sessions.userId, resetRequest[0].userId));

      return c.json({
        success: true,
        message: 'Password reset successful',
      });

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('Password reset error:', error);
      throw new HTTPException(500, { 
        message: 'Internal server error' 
      });
    }
  }
);

/**
 * GET /me - Get Current User Profile
 */
const meRoute = app.get(
  '/me',
  async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { 
        message: 'Authentication required' 
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const { JWT_SECRET } = env<{ JWT_SECRET: string }>(c);
      if (!JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
      }

      // Verify token
      const payload = await verifyToken(token, JWT_SECRET);
      
      if (payload.tokenType !== 'access') {
        throw new HTTPException(401, { 
          message: 'Invalid token type' 
        });
      }

      const db = getDatabase();
      
      // Get user profile
      const user = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatar: users.avatar,
        type: users.type,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

      if (!user[0]) {
        throw new HTTPException(404, { 
          message: 'User not found' 
        });
      }

      return c.json({
        success: true,
        user: user[0],
      });

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      throw new HTTPException(401, { 
        message: 'Invalid or expired token' 
      });
    }
  }
);

// Combine all routes
const authRoutes = app
  .route('/', registerRoute)
  .route('/', loginRoute)
  .route('/', logoutRoute)
  .route('/', refreshTokenRoute)
  .route('/', passwordResetRequestRoute)
  .route('/', passwordResetRoute)
  .route('/', meRoute);

export default authRoutes;
export type AuthRoutesType = typeof authRoutes;
