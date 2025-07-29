/**
 * Asset Routes (Simplified)
 * 
 * Hono RPC routes for basic asset management operations
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { getDatabase } from '../lib/db.js';
import { 
  assets, 
  users,
  organizations,
  userOrganizations,
  assetCategories
} from '../lib/db.js';
import { eq, and, desc, asc, ilike, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const app = new Hono();

// Simplified asset creation schema
const createAssetSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  categoryId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  purchasePrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
  purchaseDate: z.string().datetime(),
  condition: z.enum(['new', 'excellent', 'good', 'fair', 'poor']).optional(),
});

// Asset search schema
const searchAssetsSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['active', 'sold', 'archived', 'damaged', 'lost']).optional(),
  condition: z.enum(['new', 'excellent', 'good', 'fair', 'poor']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'purchaseDate', 'createdAt', 'purchasePrice']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /assets - List Assets
 */
const listAssetsRoute = app.get(
  '/assets',
  authMiddleware,
  zValidator('query', searchAssetsSchema),
  async (c) => {
    const user = c.get('user');
    const { 
      query: searchQuery, 
      categoryId, 
      status,
      condition,
      page, 
      limit, 
      sortBy, 
      sortOrder 
    } = c.req.valid('query');

    const db = getDatabase();

    try {
      // Build where conditions
      const whereConditions = [];
      
      // User can only see their own assets or organization assets they have access to
      if (user.type === 'personal') {
        whereConditions.push(eq(assets.userId, user.id));
      } else {
        // For professional users, show assets from organizations they belong to
        whereConditions.push(eq(assets.userId, user.id));
      }

      // Text search on name and description
      if (searchQuery) {
        whereConditions.push(
          sql`(
            ${assets.name} ILIKE ${`%${searchQuery}%`} OR 
            ${assets.description} ILIKE ${`%${searchQuery}%`}
          )`
        );
      }

      // Filters
      if (categoryId) {
        whereConditions.push(eq(assets.categoryId, categoryId));
      }
      if (status) {
        whereConditions.push(eq(assets.status, status));
      }
      if (condition) {
        whereConditions.push(eq(assets.condition, condition));
      }

      // Pagination
      const offset = (page - 1) * limit;

      // Sort order - use proper column references
      let orderBy;
      switch (sortBy) {
        case 'name':
          orderBy = sortOrder === 'desc' ? desc(assets.name) : asc(assets.name);
          break;
        case 'purchaseDate':
          orderBy = sortOrder === 'desc' ? desc(assets.purchaseDate) : asc(assets.purchaseDate);
          break;
        case 'purchasePrice':
          orderBy = sortOrder === 'desc' ? desc(assets.purchasePrice) : asc(assets.purchasePrice);
          break;
        default:
          orderBy = sortOrder === 'desc' ? desc(assets.createdAt) : asc(assets.createdAt);
      }

      // Execute query
      const assetsResult = await db.select({
        id: assets.id,
        name: assets.name,
        description: assets.description,
        brand: assets.brand,
        model: assets.model,
        condition: assets.condition,
        status: assets.status,
        purchasePrice: assets.purchasePrice,
        purchaseDate: assets.purchaseDate,
        purchaseCurrency: assets.purchaseCurrency,
        images: assets.images,
        tags: assets.tags,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(assets)
      .leftJoin(users, eq(assets.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

      // Get total count for pagination
      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(assets)
        .where(and(...whereConditions));

      const total = countResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return c.json({
        success: true,
        data: assetsResult,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });

    } catch (error) {
      console.error('Assets list error:', error);
      throw new HTTPException(500, { 
        message: 'Failed to fetch assets' 
      });
    }
  }
);

/**
 * GET /assets/:id - Get Asset Details
 */
const getAssetRoute = app.get(
  '/assets/:id',
  authMiddleware,
  async (c) => {
    const assetId = c.req.param('id');
    const user = c.get('user');
    const db = getDatabase();

    try {
      // Get asset with access control
      const assetResult = await db.select({
        id: assets.id,
        name: assets.name,
        description: assets.description,
        brand: assets.brand,
        model: assets.model,
        serialNumber: assets.serialNumber,
        condition: assets.condition,
        status: assets.status,
        purchasePrice: assets.purchasePrice,
        purchaseDate: assets.purchaseDate,
        purchaseCurrency: assets.purchaseCurrency,
        purchaseLocation: assets.purchaseLocation,
        receiptUrl: assets.receiptUrl,
        plannedSaleDate: assets.plannedSaleDate,
        targetSalePrice: assets.targetSalePrice,
        images: assets.images,
        specifications: assets.specifications,
        tags: assets.tags,
        notes: assets.notes,
        userId: assets.userId,
        organizationId: assets.organizationId,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(assets)
      .leftJoin(users, eq(assets.userId, users.id))
      .where(eq(assets.id, assetId))
      .limit(1);

      if (!assetResult[0]) {
        throw new HTTPException(404, { 
          message: 'Asset not found' 
        });
      }

      const asset = assetResult[0];

      // Check access permissions - user can only access their own assets
      if (asset.userId !== user.id) {
        throw new HTTPException(403, { 
          message: 'Access denied' 
        });
      }

      return c.json({
        success: true,
        data: asset,
      });

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('Get asset error:', error);
      throw new HTTPException(500, { 
        message: 'Failed to fetch asset' 
      });
    }
  }
);

/**
 * POST /assets - Create New Asset
 */
const createAssetRoute = app.post(
  '/assets',
  authMiddleware,
  zValidator('json', createAssetSchema),
  async (c) => {
    const user = c.get('user');
    const assetData = c.req.valid('json');
    const db = getDatabase();

    try {
      // Validate category exists
      const category = await db.select()
        .from(assetCategories)
        .where(eq(assetCategories.id, assetData.categoryId))
        .limit(1);

      if (!category[0]) {
        throw new HTTPException(400, { 
          message: 'Invalid category ID' 
        });
      }

      // Create asset
      const newAsset = await db.insert(assets).values({
        userId: user.id,
        name: assetData.name,
        description: assetData.description,
        brand: assetData.brand,
        model: assetData.model,
        categoryId: assetData.categoryId,
        organizationId: assetData.organizationId,
        purchasePrice: assetData.purchasePrice,
        purchaseDate: new Date(assetData.purchaseDate),
        condition: assetData.condition,
        status: 'active',
        createdBy: user.id,
      }).returning();

      const asset = newAsset[0];

      return c.json({
        success: true,
        message: 'Asset created successfully',
        data: asset,
      }, 201);

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('Create asset error:', error);
      throw new HTTPException(500, { 
        message: 'Failed to create asset' 
      });
    }
  }
);

/**
 * PUT /assets/:id - Update Asset
 */
const updateAssetRoute = app.put(
  '/assets/:id',
  authMiddleware,
  zValidator('json', createAssetSchema.partial()),
  async (c) => {
    const assetId = c.req.param('id');
    const user = c.get('user');
    const updates = c.req.valid('json');
    const db = getDatabase();

    try {
      // Get current asset
      const currentAsset = await db.select()
        .from(assets)
        .where(eq(assets.id, assetId))
        .limit(1);

      if (!currentAsset[0]) {
        throw new HTTPException(404, { 
          message: 'Asset not found' 
        });
      }

      const asset = currentAsset[0];

      // Check permissions - user can only update their own assets
      if (asset.userId !== user.id) {
        throw new HTTPException(403, { 
          message: 'Access denied' 
        });
      }

      // Update asset
      const updatedAsset = await db.update(assets)
        .set({
          ...updates,
          purchaseDate: updates.purchaseDate ? new Date(updates.purchaseDate) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(assets.id, assetId))
        .returning();

      return c.json({
        success: true,
        message: 'Asset updated successfully',
        data: updatedAsset[0],
      });

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('Update asset error:', error);
      throw new HTTPException(500, { 
        message: 'Failed to update asset' 
      });
    }
  }
);

/**
 * DELETE /assets/:id - Delete Asset (Soft Delete)
 */
const deleteAssetRoute = app.delete(
  '/assets/:id',
  authMiddleware,
  async (c) => {
    const assetId = c.req.param('id');
    const user = c.get('user');
    const db = getDatabase();

    try {
      // Get current asset
      const currentAsset = await db.select()
        .from(assets)
        .where(eq(assets.id, assetId))
        .limit(1);

      if (!currentAsset[0]) {
        throw new HTTPException(404, { 
          message: 'Asset not found' 
        });
      }

      const asset = currentAsset[0];

      // Check permissions - user can only delete their own assets
      if (asset.userId !== user.id) {
        throw new HTTPException(403, { 
          message: 'Access denied' 
        });
      }

      // Soft delete asset
      await db.update(assets)
        .set({ 
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(assets.id, assetId));

      return c.json({
        success: true,
        message: 'Asset deleted successfully',
      });

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('Delete asset error:', error);
      throw new HTTPException(500, { 
        message: 'Failed to delete asset' 
      });
    }
  }
);

// Combine all routes
const assetRoutes = app
  .route('/', listAssetsRoute)
  .route('/', getAssetRoute)
  .route('/', createAssetRoute)
  .route('/', updateAssetRoute)
  .route('/', deleteAssetRoute);

export default assetRoutes;
export type AssetRoutesType = typeof assetRoutes;
