/**
 * Asset Categories Routes
 * 
 * Hono RPC routes for asset category management with full CRUD operations
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { eq, and, isNull, desc, asc } from 'drizzle-orm';
import { getDatabase, assetCategories } from '../lib/db.js';
import { authMiddleware, requireUserType } from '../middleware/auth.js';
import type { HonoEnv } from '../lib/env.js';

const app = new Hono<HonoEnv>();

// Validation schemas following Hono best practices
const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(1000, 'Description too long').optional(),
  parentId: z.string().uuid('Invalid parent ID').optional(),
  icon: z.string().max(100, 'Icon name too long').optional(),
  depreciationProfile: z.object({
    curve_type: z.string(),
    annual_rate: z.number(),
    factors: z.array(z.string())
  }).optional(),
  marketplaces: z.array(z.string()).optional()
});

const updateCategorySchema = createCategorySchema.partial();

const categoriesQuerySchema = z.object({
  parent: z.enum(['root', 'all']).default('all'),
  active: z.enum(['true', 'false', 'all']).default('true'),
  sortBy: z.enum(['name', 'createdAt', 'sortOrder']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});

/**
 * GET /categories - List all categories with filtering
 */
const listCategoriesRoute = app.get(
  '/categories',
  zValidator('query', categoriesQuerySchema),
  async (c) => {
    const { parent, active, sortBy, sortOrder, limit, offset } = c.req.valid('query');
    const db = getDatabase();

    try {
      // Build where conditions
      const whereConditions = [];

      // Filter by parent (root = no parent, all = everything)
      if (parent === 'root') {
        whereConditions.push(isNull(assetCategories.parentId));
      }

      // Filter by active status
      if (active === 'true') {
        whereConditions.push(eq(assetCategories.isActive, true));
      } else if (active === 'false') {
        whereConditions.push(eq(assetCategories.isActive, false));
      }

      // Build order by
      let orderByClause;
      const sortDirection = sortOrder === 'desc' ? desc : asc;
      
      switch (sortBy) {
        case 'name':
          orderByClause = sortDirection(assetCategories.name);
          break;
        case 'createdAt':
          orderByClause = sortDirection(assetCategories.createdAt);
          break;
        default:
          orderByClause = sortDirection(assetCategories.sortOrder);
      }

      // Execute query
      const categories = await db.select({
        id: assetCategories.id,
        name: assetCategories.name,
        slug: assetCategories.slug,
        description: assetCategories.description,
        parentId: assetCategories.parentId,
        icon: assetCategories.icon,
        depreciationProfile: assetCategories.depreciationProfile,
        marketplaces: assetCategories.marketplaces,
        isActive: assetCategories.isActive,
        sortOrder: assetCategories.sortOrder,
        createdAt: assetCategories.createdAt,
        updatedAt: assetCategories.updatedAt
      })
      .from(assetCategories)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

      // Get total count for pagination  
      const totalResult = await db.select()
        .from(assetCategories)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

      const total = totalResult.length;

      return c.json({
        success: true,
        data: categories,
        pagination: {
          offset,
          limit,
          total,
          hasMore: offset + limit < total
        }
      });

    } catch (error) {
      console.error('List categories error:', error);
      throw new HTTPException(500, {
        message: 'Failed to fetch categories'
      });
    }
  }
);

/**
 * GET /categories/:id - Get category by ID
 */
const getCategoryRoute = app.get(
  '/categories/:id',
  async (c) => {
    const categoryId = c.req.param('id');
    
    if (!categoryId || !z.string().uuid().safeParse(categoryId).success) {
      throw new HTTPException(400, {
        message: 'Invalid category ID'
      });
    }

    const db = getDatabase();

    try {
      const category = await db.select()
        .from(assetCategories)
        .where(eq(assetCategories.id, categoryId))
        .limit(1);

      if (!category[0]) {
        throw new HTTPException(404, {
          message: 'Category not found'
        });
      }

      return c.json({
        success: true,
        data: category[0]
      });

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('Get category error:', error);
      throw new HTTPException(500, {
        message: 'Failed to fetch category'
      });
    }
  }
);

/**
 * POST /categories - Create new category (Admin only)
 */
const createCategoryRoute = app.post(
  '/categories',
  authMiddleware,
  requireUserType('professional'), // Only professional users can create categories
  zValidator('json', createCategorySchema),
  async (c) => {
    const categoryData = c.req.valid('json');
    const user = c.get('user');
    const db = getDatabase();

    try {
      // Check if slug already exists
      const existingCategory = await db.select()
        .from(assetCategories)
        .where(eq(assetCategories.slug, categoryData.slug))
        .limit(1);

      if (existingCategory.length > 0) {
        throw new HTTPException(409, {
          message: 'Category with this slug already exists'
        });
      }

      // Validate parent exists if provided
      if (categoryData.parentId) {
        const parentCategory = await db.select()
          .from(assetCategories)
          .where(eq(assetCategories.id, categoryData.parentId))
          .limit(1);

        if (!parentCategory[0]) {
          throw new HTTPException(400, {
            message: 'Parent category not found'
          });
        }
      }

      // Create category
      const newCategory = await db.insert(assetCategories)
        .values({
          ...categoryData,
          isActive: true,
          sortOrder: 999 // New categories go to the end by default
        })
        .returning();

      return c.json({
        success: true,
        message: 'Category created successfully',
        data: newCategory[0]
      }, 201);

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('Create category error:', error);
      throw new HTTPException(500, {
        message: 'Failed to create category'
      });
    }
  }
);

/**
 * PUT /categories/:id - Update category (Admin only)
 */
const updateCategoryRoute = app.put(
  '/categories/:id',
  authMiddleware,
  requireUserType('professional'),
  zValidator('json', updateCategorySchema),
  async (c) => {
    const categoryId = c.req.param('id');
    const updates = c.req.valid('json');
    
    if (!z.string().uuid().safeParse(categoryId).success) {
      throw new HTTPException(400, {
        message: 'Invalid category ID'
      });
    }

    const db = getDatabase();

    try {
      // Check if category exists
      const existingCategory = await db.select()
        .from(assetCategories)
        .where(eq(assetCategories.id, categoryId))
        .limit(1);

      if (!existingCategory[0]) {
        throw new HTTPException(404, {
          message: 'Category not found'
        });
      }

      // Check slug uniqueness if slug is being updated
      if (updates.slug && updates.slug !== existingCategory[0].slug) {
        const slugExists = await db.select()
          .from(assetCategories)
          .where(eq(assetCategories.slug, updates.slug))
          .limit(1);

        if (slugExists.length > 0) {
          throw new HTTPException(409, {
            message: 'Category with this slug already exists'
          });
        }
      }

      // Validate parent exists if provided
      if (updates.parentId) {
        const parentCategory = await db.select()
          .from(assetCategories)
          .where(eq(assetCategories.id, updates.parentId))
          .limit(1);

        if (!parentCategory[0]) {
          throw new HTTPException(400, {
            message: 'Parent category not found'
          });
        }

        // Prevent circular references
        if (updates.parentId === categoryId) {
          throw new HTTPException(400, {
            message: 'Category cannot be its own parent'
          });
        }
      }

      // Update category
      const updatedCategory = await db.update(assetCategories)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(assetCategories.id, categoryId))
        .returning();

      return c.json({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory[0]
      });

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('Update category error:', error);
      throw new HTTPException(500, {
        message: 'Failed to update category'
      });
    }
  }
);

/**
 * DELETE /categories/:id - Soft delete category (Admin only)
 */
const deleteCategoryRoute = app.delete(
  '/categories/:id',
  authMiddleware,
  requireUserType('professional'),
  async (c) => {
    const categoryId = c.req.param('id');
    
    if (!z.string().uuid().safeParse(categoryId).success) {
      throw new HTTPException(400, {
        message: 'Invalid category ID'
      });
    }

    const db = getDatabase();

    try {
      // Check if category exists
      const existingCategory = await db.select()
        .from(assetCategories)
        .where(eq(assetCategories.id, categoryId))
        .limit(1);

      if (!existingCategory[0]) {
        throw new HTTPException(404, {
          message: 'Category not found'
        });
      }

      // Check if category has assets (prevent deletion if in use)
      const { assets } = await import('../lib/db.js');
      const assetsUsingCategory = await db.select()
        .from(assets)
        .where(eq(assets.categoryId, categoryId));

      if (assetsUsingCategory.length > 0) {
        throw new HTTPException(400, {
          message: 'Cannot delete category that is in use by assets'
        });
      }

      // Soft delete by setting isActive to false
      await db.update(assetCategories)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(assetCategories.id, categoryId));

      return c.json({
        success: true,
        message: 'Category deleted successfully'
      });

    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      
      console.error('Delete category error:', error);
      throw new HTTPException(500, {
        message: 'Failed to delete category'
      });
    }
  }
);

// Combine all routes
const categoryRoutes = app
  .route('/', listCategoriesRoute)
  .route('/', getCategoryRoute)
  .route('/', createCategoryRoute)
  .route('/', updateCategoryRoute)
  .route('/', deleteCategoryRoute);

export default categoryRoutes;
export type CategoryRoutesType = typeof categoryRoutes;