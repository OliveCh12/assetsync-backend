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
import { eq, and, desc, asc, ilike, sql, isNull } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { 
  insertAssetSchema, 
  selectAssetSchema, 
  updateAssetSchema 
} from '../lib/validation/schemas.js';

const app = new Hono();

// Enhanced asset schemas using drizzle-zod
const createAssetSchema = insertAssetSchema.pick({
  name: true,
  description: true,
  brand: true,
  model: true,
  serialNumber: true,
  condition: true,
  categoryId: true,
  organizationId: true,
  purchasePrice: true,
  purchaseDate: true,
  purchaseCurrency: true,
  purchaseLocation: true,
  plannedSaleDate: true,
  targetSalePrice: true,
  assignedTo: true,
  department: true,
  location: true,
  accountingDepreciationPeriod: true,
  assetTag: true,
  images: true,
  specifications: true,
  tags: true,
  notes: true,
});

// Enhanced asset search schema
const searchAssetsSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['active', 'sold', 'archived', 'damaged', 'lost']).optional(),
  condition: z.enum(['new', 'excellent', 'good', 'fair', 'poor']).optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  purchaseDateFrom: z.string().datetime().optional(),
  purchaseDateTo: z.string().datetime().optional(),
  organizationId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'purchaseDate', 'createdAt', 'purchasePrice', 'brand', 'condition']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Asset image upload schema
const assetImageSchema = z.object({
  assetId: z.string().uuid(),
  images: z.array(z.object({
    url: z.string().url(),
    filename: z.string(),
    size: z.number().optional(),
    alt: z.string().optional(),
  })).min(1).max(10),
});

/**
 * GET / - List Assets
 */
const listAssetsRoute = app.get(
  '/',
  authMiddleware,
  zValidator('query', searchAssetsSchema),
  async (c) => {
    const user = c.get('user');
    const { 
      query: searchQuery, 
      categoryId, 
      status,
      condition,
      brand,
      minPrice,
      maxPrice,
      purchaseDateFrom,
      purchaseDateTo,
      organizationId,
      assignedTo,
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
      if (brand) {
        whereConditions.push(ilike(assets.brand, `%${brand}%`));
      }
      if (minPrice) {
        whereConditions.push(sql`CAST(${assets.purchasePrice} AS DECIMAL) >= ${minPrice}`);
      }
      if (maxPrice) {
        whereConditions.push(sql`CAST(${assets.purchasePrice} AS DECIMAL) <= ${maxPrice}`);
      }
      if (purchaseDateFrom) {
        whereConditions.push(sql`${assets.purchaseDate} >= ${new Date(purchaseDateFrom)}`);
      }
      if (purchaseDateTo) {
        whereConditions.push(sql`${assets.purchaseDate} <= ${new Date(purchaseDateTo)}`);
      }
      if (organizationId) {
        whereConditions.push(eq(assets.organizationId, organizationId));
      }
      if (assignedTo) {
        whereConditions.push(eq(assets.assignedTo, assignedTo));
      }

      // Exclude soft deleted assets
      whereConditions.push(isNull(assets.deletedAt));

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
        case 'brand':
          orderBy = sortOrder === 'desc' ? desc(assets.brand) : asc(assets.brand);
          break;
        case 'condition':
          orderBy = sortOrder === 'desc' ? desc(assets.condition) : asc(assets.condition);
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
 * GET /:id - Get Asset Details
 */
const getAssetRoute = app.get(
  '/:id',
  authMiddleware,
  async (c) => {
    const assetId = c.req.param('id');
    const user = c.get('user');
    const db = getDatabase();

    try {
      // Get asset with access control (exclude soft deleted)
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
        assignedTo: assets.assignedTo,
        department: assets.department,
        location: assets.location,
        accountingDepreciationPeriod: assets.accountingDepreciationPeriod,
        assetTag: assets.assetTag,
        actualSalePrice: assets.actualSalePrice,
        actualSaleDate: assets.actualSaleDate,
        images: assets.images,
        specifications: assets.specifications,
        tags: assets.tags,
        notes: assets.notes,
        userId: assets.userId,
        organizationId: assets.organizationId,
        categoryId: assets.categoryId,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
        deletedAt: assets.deletedAt,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(assets)
      .leftJoin(users, eq(assets.userId, users.id))
      .where(and(eq(assets.id, assetId), isNull(assets.deletedAt)))
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
 * POST / - Create New Asset
 */
const createAssetRoute = app.post(
  '/',
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
        .where(eq(assetCategories.id, assetData.categoryId as string))
        .limit(1);

      if (!category[0]) {
        throw new HTTPException(400, { 
          message: 'Invalid category ID' 
        });
      }

      // Prepare asset data for insertion - let drizzle handle the types
      const assetInsertData = {
        ...assetData,
        userId: user.id,
        status: 'active' as const,
        createdBy: user.id,
        purchaseDate: assetData.purchaseDate ? new Date(assetData.purchaseDate) : new Date(),
        plannedSaleDate: assetData.plannedSaleDate ? new Date(assetData.plannedSaleDate) : null,
        purchaseCurrency: assetData.purchaseCurrency || 'EUR',
      };

      // Create asset
      const newAsset = await db.insert(assets).values(assetInsertData).returning();

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
 * PUT /:id - Update Asset
 */
const updateAssetRoute = app.put(
  '/:id',
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
 * DELETE /:id - Delete Asset (Soft Delete)
 */
const deleteAssetRoute = app.delete(
  '/:id',
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

/**
 * POST /:id/images - Upload Asset Images
 */
const uploadAssetImagesRoute = app.post(
  '/:id/images',
  authMiddleware,
  zValidator('json', assetImageSchema.omit({ assetId: true })),
  async (c) => {
    const assetId = c.req.param('id');
    const user = c.get('user');
    const { images } = c.req.valid('json');
    const db = getDatabase();

    try {
      // Get current asset
      const currentAsset = await db.select()
        .from(assets)
        .where(and(eq(assets.id, assetId), isNull(assets.deletedAt)))
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

      // Merge with existing images
      const existingImages = (asset.images as any[]) || [];
      const updatedImages = [...existingImages, ...images];

      // Update asset with new images
      const updatedAsset = await db.update(assets)
        .set({
          images: updatedImages,
          updatedAt: new Date(),
        })
        .where(eq(assets.id, assetId))
        .returning();

      return c.json({
        success: true,
        message: 'Images uploaded successfully',
        data: {
          assetId,
          images: updatedImages,
        },
      });

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('Upload asset images error:', error);
      throw new HTTPException(500, { 
        message: 'Failed to upload images' 
      });
    }
  }
);

/**
 * GET /stats - Get Asset Statistics for User
 */
const getAssetStatsRoute = app.get(
  '/stats',
  authMiddleware,
  async (c) => {
    const user = c.get('user');
    const db = getDatabase();

    try {
      // Get comprehensive asset statistics
      const statsQueries = await Promise.all([
        // Total assets count
        db.select({ count: sql<number>`count(*)` })
          .from(assets)
          .where(and(eq(assets.userId, user.id), isNull(assets.deletedAt))),
        
        // Assets by status
        db.select({ 
          status: assets.status, 
          count: sql<number>`count(*)` 
        })
          .from(assets)
          .where(and(eq(assets.userId, user.id), isNull(assets.deletedAt)))
          .groupBy(assets.status),
        
        // Total purchase value
        db.select({ 
          totalValue: sql<number>`SUM(CAST(${assets.purchasePrice} AS DECIMAL))` 
        })
          .from(assets)
          .where(and(eq(assets.userId, user.id), isNull(assets.deletedAt))),
        
        // Assets by condition
        db.select({ 
          condition: assets.condition, 
          count: sql<number>`count(*)` 
        })
          .from(assets)
          .where(and(eq(assets.userId, user.id), isNull(assets.deletedAt)))
          .groupBy(assets.condition),
        
        // Recent assets (last 30 days)
        db.select({ count: sql<number>`count(*)` })
          .from(assets)
          .where(and(
            eq(assets.userId, user.id), 
            isNull(assets.deletedAt),
            sql`${assets.createdAt} >= NOW() - INTERVAL '30 days'`
          )),
      ]);

      const [totalCount, statusBreakdown, totalValue, conditionBreakdown, recentCount] = statsQueries;

      return c.json({
        success: true,
        data: {
          totalAssets: totalCount[0]?.count || 0,
          totalValue: totalValue[0]?.totalValue || 0,
          recentAssets: recentCount[0]?.count || 0,
          breakdown: {
            byStatus: statusBreakdown.reduce((acc, item) => {
              if (item.status) acc[item.status] = item.count;
              return acc;
            }, {} as Record<string, number>),
            byCondition: conditionBreakdown.reduce((acc, item) => {
              if (item.condition) acc[item.condition] = item.count;
              return acc;
            }, {} as Record<string, number>),
          },
        },
      });

    } catch (error) {
      console.error('Get asset stats error:', error);
      throw new HTTPException(500, { 
        message: 'Failed to fetch asset statistics' 
      });
    }
  }
);

// Combine all routes - Order matters! More specific routes first
const assetRoutes = app
  .route('/', listAssetsRoute)
  .route('/', createAssetRoute)
  .route('/', getAssetStatsRoute)  // /stats must come before /:id
  .route('/', getAssetRoute)
  .route('/', updateAssetRoute)
  .route('/', deleteAssetRoute)
  .route('/', uploadAssetImagesRoute);

export default assetRoutes;
export type AssetRoutesType = typeof assetRoutes;
