/**
 * User Routes
 * 
 * Hono RPC routes for user management and profile operations
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { getDatabase } from '../lib/db.js';
import { users, assets, assetCategories } from '../lib/db.js';
import { eq, and, desc, count, sql, isNull } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const app = new Hono();

// User profile update schema
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
});

/**
 * GET /me - Get Current User Profile
 */
const getMeRoute = app.get(
  '/me',
  authMiddleware,
  async (c) => {
    const user = c.get('user');
    const db = getDatabase();

    try {
      // Get user profile with additional stats
      const userProfile = await db.select({
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
      .where(eq(users.id, user.id))
      .limit(1);

      if (!userProfile[0]) {
        throw new HTTPException(404, { 
          message: 'User not found' 
        });
      }

      // Get user's asset count
      const assetCountResult = await db.select({ count: count() })
        .from(assets)
        .where(and(
          eq(assets.userId, user.id),
          isNull(assets.deletedAt) // Only count non-deleted assets
        ));

      const assetCount = assetCountResult[0]?.count || 0;

      return c.json({
        success: true,
        data: {
          ...userProfile[0],
          stats: {
            totalAssets: assetCount,
          },
        },
      });

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('Get user profile error:', error);
      throw new HTTPException(500, { 
        message: 'Failed to fetch user profile' 
      });
    }
  }
);

/**
 * PUT /me - Update User Profile
 */
const updateMeRoute = app.put(
  '/me',
  authMiddleware,
  zValidator('json', updateProfileSchema),
  async (c) => {
    const user = c.get('user');
    const updates = c.req.valid('json');
    const db = getDatabase();

    try {
      // Update user profile
      const updatedUser = await db.update(users)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar,
          type: users.type,
          emailVerified: users.emailVerified,
          updatedAt: users.updatedAt,
        });

      return c.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser[0],
      });

    } catch (error) {
      console.error('Update user profile error:', error);
      throw new HTTPException(500, { 
        message: 'Failed to update profile' 
      });
    }
  }
);

/**
 * GET /dashboard - Get User Dashboard Data
 */
const getDashboardRoute = app.get(
  '/dashboard',
  authMiddleware,
  async (c) => {
    const user = c.get('user');
    const db = getDatabase();

    try {
      // Get recent assets
      const recentAssets = await db.select({
        id: assets.id,
        name: assets.name,
        brand: assets.brand,
        model: assets.model,
        purchasePrice: assets.purchasePrice,
        purchaseDate: assets.purchaseDate,
        status: assets.status,
        images: assets.images,
        createdAt: assets.createdAt,
      })
      .from(assets)
      .where(and(
        eq(assets.userId, user.id),
        isNull(assets.deletedAt)
      ))
      .orderBy(desc(assets.createdAt))
      .limit(5);

      // Get asset statistics
      const assetStats = await db.select({
        status: assets.status,
        count: count(),
      })
      .from(assets)
      .where(and(
        eq(assets.userId, user.id),
        isNull(assets.deletedAt)
      ))
      .groupBy(assets.status);

      // Calculate portfolio value (sum of purchase prices)
      const portfolioValue = await db.select({
        total: sql<number>`SUM(CAST(${assets.purchasePrice} AS DECIMAL))`,
      })
      .from(assets)
      .where(and(
        eq(assets.userId, user.id),
        isNull(assets.deletedAt),
        eq(assets.status, 'active')
      ));

      const totalValue = portfolioValue[0]?.total || 0;

      return c.json({
        success: true,
        data: {
          recentAssets,
          statistics: {
            totalAssets: assetStats.reduce((acc, stat) => acc + stat.count, 0),
            assetsByStatus: assetStats,
            portfolioValue: totalValue,
          },
        },
      });

    } catch (error) {
      console.error('Get dashboard error:', error);
      throw new HTTPException(500, { 
        message: 'Failed to fetch dashboard data' 
      });
    }
  }
);

// Combine all routes
const userRoutes = app
  .route('/', getMeRoute)
  .route('/', updateMeRoute)
  .route('/', getDashboardRoute);

export default userRoutes;
export type UserRoutesType = typeof userRoutes;
