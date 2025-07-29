/**
 * Drizzle-Zod Schema Exports
 * 
 * This module generates and exports Zod schemas for all database tables
 * using drizzle-zod for type-safe validation across the application.
 */

import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  users,
  sessions,
  passwordResets,
  organizations,
  userOrganizations,
  assets,
  assetCategories,
  assetValuations,
  platforms,
  userPlatformConnections,
  assetListings,
  transactions,
  subscriptionPlans,
  userSubscriptions,
  notifications,
  assetHistory,
} from '../db.js';

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email('Invalid email format'),
  firstName: (schema) => schema.min(1, 'First name is required').max(100, 'First name too long'),
  lastName: (schema) => schema.min(1, 'Last name is required').max(100, 'Last name too long'),
  passwordHash: (schema) => schema.min(8, 'Password must be at least 8 characters'),
});

export const selectUserSchema = createSelectSchema(users);

export const updateUserSchema = createUpdateSchema(users, {
  email: (schema) => schema.email('Invalid email format'),
  firstName: (schema) => schema.min(1, 'First name is required').max(100, 'First name too long'),
  lastName: (schema) => schema.min(1, 'Last name is required').max(100, 'Last name too long'),
});

// Public user schema (without sensitive data)
export const publicUserSchema = selectUserSchema.omit({
  passwordHash: true,
  emailVerified: true,
  deletedAt: true,
});

// ============================================================================
// SESSION SCHEMAS
// ============================================================================

export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);
export const updateSessionSchema = createUpdateSchema(sessions);

// ============================================================================
// PASSWORD RESET SCHEMAS
// ============================================================================

export const insertPasswordResetSchema = createInsertSchema(passwordResets);
export const selectPasswordResetSchema = createSelectSchema(passwordResets);

// ============================================================================
// ORGANIZATION SCHEMAS
// ============================================================================

export const insertOrganizationSchema = createInsertSchema(organizations, {
  name: (schema) => schema.min(1, 'Organization name is required').max(200, 'Name too long'),
  website: (schema) => schema.url('Invalid website URL').optional(),
});

export const selectOrganizationSchema = createSelectSchema(organizations);
export const updateOrganizationSchema = createUpdateSchema(organizations);

export const insertUserOrganizationSchema = createInsertSchema(userOrganizations);
export const selectUserOrganizationSchema = createSelectSchema(userOrganizations);
export const updateUserOrganizationSchema = createUpdateSchema(userOrganizations);

// ============================================================================
// ASSET SCHEMAS
// ============================================================================

export const insertAssetSchema = createInsertSchema(assets, {
  name: (schema) => schema.min(1, 'Asset name is required').max(200, 'Name too long'),
  description: (schema) => schema.max(2000, 'Description too long').optional(),
});

export const selectAssetSchema = createSelectSchema(assets);
export const updateAssetSchema = createUpdateSchema(assets);

// ============================================================================
// ASSET CATEGORY SCHEMAS
// ============================================================================

export const insertAssetCategorySchema = createInsertSchema(assetCategories, {
  name: (schema) => schema.min(1, 'Category name is required').max(100, 'Name too long'),
  description: (schema) => schema.max(500, 'Description too long').optional(),
});

export const selectAssetCategorySchema = createSelectSchema(assetCategories);
export const updateAssetCategorySchema = createUpdateSchema(assetCategories);

// ============================================================================
// ASSET VALUATION SCHEMAS
// ============================================================================

export const insertAssetValuationSchema = createInsertSchema(assetValuations, {
  currentValue: (schema) => schema.refine(
    (val) => parseFloat(val) > 0, 
    { message: 'Current value must be positive' }
  ),
  methodology: (schema) => schema.max(1000, 'Methodology too long').optional(),
});

export const selectAssetValuationSchema = createSelectSchema(assetValuations);
export const updateAssetValuationSchema = createUpdateSchema(assetValuations);

// ============================================================================
// PLATFORM SCHEMAS
// ============================================================================

export const insertPlatformSchema = createInsertSchema(platforms, {
  name: (schema) => schema.min(1, 'Platform name is required').max(100, 'Name too long'),
  baseUrl: (schema) => schema.url('Invalid base URL'),
});

export const selectPlatformSchema = createSelectSchema(platforms);
export const updatePlatformSchema = createUpdateSchema(platforms);

export const insertUserPlatformConnectionSchema = createInsertSchema(userPlatformConnections);
export const selectUserPlatformConnectionSchema = createSelectSchema(userPlatformConnections);
export const updateUserPlatformConnectionSchema = createUpdateSchema(userPlatformConnections);

// ============================================================================
// LISTING SCHEMAS
// ============================================================================

export const insertAssetListingSchema = createInsertSchema(assetListings, {
  title: (schema) => schema.min(1, 'Listing title is required').max(200, 'Title too long'),
  description: (schema) => schema.max(5000, 'Description too long').optional(),
  price: (schema) => schema.refine(
    (val) => parseFloat(val) > 0, 
    { message: 'Price must be positive' }
  ),
});

export const selectAssetListingSchema = createSelectSchema(assetListings);
export const updateAssetListingSchema = createUpdateSchema(assetListings);

// ============================================================================
// TRANSACTION SCHEMAS
// ============================================================================

export const insertTransactionSchema = createInsertSchema(transactions, {
  amount: (schema) => schema.refine(
    (val) => parseFloat(val) > 0, 
    { message: 'Transaction amount must be positive' }
  ),
  description: (schema) => schema.max(500, 'Description too long').optional(),
});

export const selectTransactionSchema = createSelectSchema(transactions);
export const updateTransactionSchema = createUpdateSchema(transactions);

// ============================================================================
// SUBSCRIPTION SCHEMAS
// ============================================================================

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const selectSubscriptionPlanSchema = createSelectSchema(subscriptionPlans);
export const updateSubscriptionPlanSchema = createUpdateSchema(subscriptionPlans);

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions);
export const selectUserSubscriptionSchema = createSelectSchema(userSubscriptions);
export const updateUserSubscriptionSchema = createUpdateSchema(userSubscriptions);

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const insertNotificationSchema = createInsertSchema(notifications, {
  title: (schema) => schema.min(1, 'Notification title is required').max(255, 'Title too long'),
  message: (schema) => schema.min(1, 'Message is required'),
});

export const selectNotificationSchema = createSelectSchema(notifications);
export const updateNotificationSchema = createUpdateSchema(notifications);

// ============================================================================
// ASSET HISTORY SCHEMAS
// ============================================================================

export const insertAssetHistorySchema = createInsertSchema(assetHistory);
export const selectAssetHistorySchema = createSelectSchema(assetHistory);

// ============================================================================
// COMMON VALIDATION UTILITIES
// ============================================================================

// Custom refinements for common use cases
export const emailValidation = z.string().email('Invalid email format');
export const phoneValidation = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');
export const urlValidation = z.string().url('Invalid URL format');
export const positiveNumberValidation = z.number().positive('Must be a positive number');
export const nonEmptyStringValidation = z.string().min(1, 'Cannot be empty');

// Password validation schema (for registration/password change)
export const passwordValidationSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// ============================================================================
// INFERRED TYPES FOR EXPORTS
// ============================================================================

// User types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;

// Asset types
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type SelectAsset = z.infer<typeof selectAssetSchema>;
export type UpdateAsset = z.infer<typeof updateAssetSchema>;

// Organization types
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type SelectOrganization = z.infer<typeof selectOrganizationSchema>;
export type UpdateOrganization = z.infer<typeof updateOrganizationSchema>;

// Listing types
export type InsertAssetListing = z.infer<typeof insertAssetListingSchema>;
export type SelectAssetListing = z.infer<typeof selectAssetListingSchema>;
export type UpdateAssetListing = z.infer<typeof updateAssetListingSchema>;

// Transaction types
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type SelectTransaction = z.infer<typeof selectTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
