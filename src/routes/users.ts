import { router, publicProcedure, protectedProcedure } from '../lib/trpc.js';
import { z } from 'zod';
import { getDatabase } from '../lib/db.js';
import { users, assets, assetCategories, assetValuations } from '../lib/db.js';
import { eq, and, desc } from 'drizzle-orm';

export const usersRouter = router({
  // Get current user profile
  me: protectedProcedure
    .query(async ({ ctx }) => {
      const db = getDatabase();
      const user = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatar: users.avatar,
        type: users.type,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);

      if (!user[0]) {
        throw new Error('User not found');
      }

      return user[0];
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      avatar: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDatabase();
      
      const updatedUser = await db.update(users)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.userId))
        .returning({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar,
        });

      return updatedUser[0];
    }),

  // Get user stats
  stats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = getDatabase();
      
      // Get asset count and total value
      const userAssets = await db.select({
        count: assets.id,
        purchasePrice: assets.purchasePrice,
        status: assets.status,
      })
      .from(assets)
      .where(eq(assets.userId, ctx.userId));

      const totalAssets = userAssets.length;
      const activeAssets = userAssets.filter(a => a.status === 'active').length;
      const soldAssets = userAssets.filter(a => a.status === 'sold').length;
      
      const totalPurchaseValue = userAssets.reduce((sum, asset) => {
        return sum + parseFloat(asset.purchasePrice || '0');
      }, 0);

      return {
        totalAssets,
        activeAssets,
        soldAssets,
        totalPurchaseValue,
      };
    }),
});
