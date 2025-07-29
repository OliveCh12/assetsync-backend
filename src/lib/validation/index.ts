/**
 * Common Validation Schemas
 * 
 * Basic Zod schemas for common validation patterns used throughout the application.
 */

import { z } from 'zod';

// ============================================================================
// BASIC FIELD VALIDATIONS
// ============================================================================

export const emailSchema = z.string().email('Invalid email format');
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');
export const urlSchema = z.string().url('Invalid URL format');
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const positiveNumberSchema = z.number().positive('Must be a positive number');
export const nonEmptyStringSchema = z.string().min(1, 'Cannot be empty');

// ============================================================================
// USER VALIDATION SCHEMAS
// ============================================================================

export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  type: z.enum(['personal', 'professional']).default('personal'),
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const userUpdateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long').optional(),
  avatar: urlSchema.optional(),
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});

export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// ============================================================================
// ASSET VALIDATION SCHEMAS
// ============================================================================

export const assetCreateSchema = z.object({
  name: z.string().min(1, 'Asset name is required').max(200, 'Name too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  categoryId: uuidSchema,
  originalPrice: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Original price must be a positive number'
  ).optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
  location: z.string().max(200, 'Location too long').optional(),
  model: z.string().max(100, 'Model too long').optional(),
  brand: z.string().max(100, 'Brand too long').optional(),
  serialNumber: z.string().max(100, 'Serial number too long').optional(),
  purchaseDate: z.string().datetime().optional(),
  warrantyUntil: z.string().datetime().optional(),
});

export const assetUpdateSchema = assetCreateSchema.partial();

export const assetSearchSchema = z.object({
  query: z.string().optional(),
  categoryId: uuidSchema.optional(),
  status: z.enum(['active', 'sold', 'archived', 'damaged', 'lost']).optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  minPrice: z.string().refine(
    (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    'Min price must be a non-negative number'
  ).optional(),
  maxPrice: z.string().refine(
    (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    'Max price must be a non-negative number'
  ).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// ============================================================================
// ORGANIZATION VALIDATION SCHEMAS
// ============================================================================

export const organizationCreateSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  website: urlSchema.optional(),
  industry: z.string().max(100, 'Industry too long').optional(),
});

export const organizationUpdateSchema = organizationCreateSchema.partial();

export const organizationMemberInviteSchema = z.object({
  email: emailSchema,
  role: z.enum(['owner', 'admin', 'manager', 'viewer', 'accountant']).default('viewer'),
});

// ============================================================================
// LISTING VALIDATION SCHEMAS
// ============================================================================

export const listingCreateSchema = z.object({
  assetId: uuidSchema,
  platformId: uuidSchema,
  title: z.string().min(1, 'Listing title is required').max(200, 'Title too long'),
  description: z.string().max(5000, 'Description too long').optional(),
  price: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Price must be a positive number'
  ),
  category: z.string().max(100, 'Category too long').optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
  tags: z.array(z.string().max(50, 'Tag too long')).max(10, 'Too many tags').optional(),
  images: z.array(urlSchema).max(20, 'Too many images').optional(),
});

export const listingUpdateSchema = listingCreateSchema.partial().omit({ assetId: true });

// ============================================================================
// VALUATION VALIDATION SCHEMAS
// ============================================================================

export const valuationCreateSchema = z.object({
  assetId: uuidSchema,
  scenario: z.enum(['pessimistic', 'realistic', 'optimistic']).default('realistic'),
  currentValue: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Current value must be a positive number'
  ),
  projectedValue: z.string().refine(
    (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0),
    'Projected value must be a positive number'
  ).optional(),
  methodology: z.string().max(1000, 'Methodology too long').optional(),
  marketCondition: z.enum(['strong', 'normal', 'weak']).optional(),
  confidenceLevel: z.number().min(1).max(100).optional(),
});

// ============================================================================
// TRANSACTION VALIDATION SCHEMAS
// ============================================================================

export const transactionCreateSchema = z.object({
  assetId: uuidSchema.optional(),
  listingId: uuidSchema.optional(),
  type: z.enum(['sale', 'purchase', 'commission', 'subscription', 'refund']),
  amount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Amount must be a positive number'
  ),
  description: z.string().max(500, 'Description too long').optional(),
  platformTransactionId: z.string().max(255, 'Platform transaction ID too long').optional(),
});

// ============================================================================
// PLATFORM CONNECTION VALIDATION SCHEMAS
// ============================================================================

export const platformConnectionSchema = z.object({
  platformId: uuidSchema,
  credentials: z.record(z.string(), z.any()), // Platform-specific credentials
  isActive: z.boolean().default(true),
});

// ============================================================================
// NOTIFICATION VALIDATION SCHEMAS
// ============================================================================

export const notificationCreateSchema = z.object({
  type: z.string().max(50, 'Type too long'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  message: z.string().min(1, 'Message is required'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  category: z.enum(['alert', 'info', 'success', 'warning', 'error']).default('info'),
  actionUrl: urlSchema.optional(),
  actionLabel: z.string().max(100, 'Action label too long').optional(),
});

// ============================================================================
// COMMON QUERY SCHEMAS
// ============================================================================

export const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type UserUpdateProfile = z.infer<typeof userUpdateProfileSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;

export type AssetCreate = z.infer<typeof assetCreateSchema>;
export type AssetUpdate = z.infer<typeof assetUpdateSchema>;
export type AssetSearch = z.infer<typeof assetSearchSchema>;

export type OrganizationCreate = z.infer<typeof organizationCreateSchema>;
export type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>;

export type ListingCreate = z.infer<typeof listingCreateSchema>;
export type ListingUpdate = z.infer<typeof listingUpdateSchema>;

export type ValuationCreate = z.infer<typeof valuationCreateSchema>;
export type TransactionCreate = z.infer<typeof transactionCreateSchema>;
export type PlatformConnection = z.infer<typeof platformConnectionSchema>;
export type NotificationCreate = z.infer<typeof notificationCreateSchema>;

export type Pagination = z.infer<typeof paginationSchema>;
export type Sort = z.infer<typeof sortSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
