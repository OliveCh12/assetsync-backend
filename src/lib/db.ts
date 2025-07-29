import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  timestamp, 
  decimal, 
  integer, 
  boolean, 
  jsonb, 
  pgEnum,
  primaryKey,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

// Database instance - will be initialized in the main application
let db: ReturnType<typeof drizzle>;

export const initDatabase = (connectionString: string) => {
  // Initialize Drizzle with node-postgres using connection string
  db = drizzle(connectionString);
  return db;
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
};

// ============================================================================
// ENUMS - Define all possible values for specific fields
// ============================================================================

export const userTypeEnum = pgEnum('user_type', ['personal', 'professional']);
export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'manager', 'viewer', 'accountant']);
export const assetStatusEnum = pgEnum('asset_status', ['active', 'sold', 'archived', 'damaged', 'lost']);
export const valuationScenarioEnum = pgEnum('valuation_scenario', ['pessimistic', 'realistic', 'optimistic']);
export const listingStatusEnum = pgEnum('listing_status', ['draft', 'active', 'sold', 'expired', 'cancelled']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'cancelled', 'expired', 'trial', 'past_due']);
export const planTypeEnum = pgEnum('plan_type', ['free', 'premium', 'starter', 'business', 'enterprise']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed', 'refunded', 'cancelled']);
export const transactionTypeEnum = pgEnum('transaction_type', ['sale', 'purchase', 'commission', 'subscription', 'refund']);

// ============================================================================
// AUTHENTICATION & USER MANAGEMENT
// Core user system supporting both personal and professional contexts
// ============================================================================

/**
 * USERS TABLE
 * 
 * Central user entity supporting both personal users (tracking personal belongings)
 * and professional users (managing business assets). Users can belong to multiple
 * organizations in professional context.
 * 
 * Key Features:
 * - Dual context support (personal/professional)
 * - Email verification system
 * - Login tracking for security
 * - Soft user type distinction for different UX flows
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(), // bcrypt/argon2 hash
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  avatar: text('avatar'), // URL to profile image (CDN/S3)
  type: userTypeEnum('type').notNull().default('personal'), // Determines UI/UX flow
  emailVerified: boolean('email_verified').default(false),
  emailVerifiedAt: timestamp('email_verified_at'),
  lastLoginAt: timestamp('last_login_at'), // Security tracking
  
  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete for data retention
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  typeIdx: index('users_type_idx').on(table.type),
  deletedIdx: index('users_deleted_idx').on(table.deletedAt),
}));

/**
 * SESSIONS TABLE
 * 
 * Manages user authentication sessions with token-based approach.
 * Supports both web and mobile app sessions with expiration tracking.
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(), // JWT or random token
  expiresAt: timestamp('expires_at').notNull(),
  deviceInfo: jsonb('device_info'), // {userAgent, ip, deviceType, etc.}
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index('sessions_token_idx').on(table.token),
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  expiresIdx: index('sessions_expires_idx').on(table.expiresAt),
}));

/**
 * PASSWORD_RESETS TABLE
 * 
 * Handles secure password reset workflow with token expiration and usage tracking.
 */
export const passwordResets = pgTable('password_resets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'), // Prevents token reuse
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index('password_resets_token_idx').on(table.token),
  userIdx: index('password_resets_user_idx').on(table.userId),
}));

// ============================================================================
// ORGANIZATIONS & PROFESSIONAL CONTEXT
// Multi-tenant system for business asset management
// ============================================================================

/**
 * ORGANIZATIONS TABLE
 * 
 * Represents companies/businesses in professional context. Enables B2B features like:
 * - Multi-user asset management
 * - Departmental asset assignment
 * - Accounting integration
 * - Role-based permissions
 * 
 * Supports the professional use case where companies track depreciable assets
 * alongside their accounting book value vs. market value.
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(), // URL-friendly identifier
  description: text('description'),
  logo: text('logo'), // URL to logo image
  website: varchar('website', { length: 255 }),
  industry: varchar('industry', { length: 100 }), // For industry-specific features
  size: varchar('size', { length: 50 }), // startup, small, medium, large, enterprise
  address: jsonb('address'), // {street, city, postal_code, country, coordinates}
  
  // Organization-specific configuration
  settings: jsonb('settings').default({}), // {currency, timezone, fiscal_year, etc.}
  
  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete
}, (table) => ({
  slugIdx: index('organizations_slug_idx').on(table.slug),
  industryIdx: index('organizations_industry_idx').on(table.industry),
  deletedIdx: index('organizations_deleted_idx').on(table.deletedAt),
}));

/**
 * USER_ORGANIZATIONS TABLE
 * 
 * Many-to-many relationship between users and organizations with role-based access.
 * Implements the professional context permission system mentioned in the spec.
 * 
 * Roles:
 * - owner: Full access, billing management
 * - admin: All asset operations, user management
 * - manager: Add/modify assets, view reports
 * - viewer: Read-only access
 * - accountant: Export data, depreciation calculations
 */
export const userOrganizations = pgTable('user_organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  role: userRoleEnum('role').notNull().default('viewer'),
  isActive: boolean('is_active').default(true), // Enable/disable without deletion
  
  // Invitation system
  invitedBy: uuid('invited_by').references(() => users.id),
  invitedAt: timestamp('invited_at'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'),
}, (table) => ({
  userOrgIdx: index('user_organizations_user_org_idx').on(table.userId, table.organizationId),
  unique_active_membership: unique('unique_active_user_org').on(table.userId, table.organizationId),
  roleIdx: index('user_organizations_role_idx').on(table.role),
}));

// ============================================================================
// ASSET CATEGORIES & TAXONOMY
// Hierarchical categorization system for all resellable goods
// ============================================================================

/**
 * ASSET_CATEGORIES TABLE
 * 
 * Hierarchical categorization supporting all asset types mentioned in the spec:
 * - Vehicles (cars, motorcycles, boats, RVs, bicycles, scooters)
 * - Electronics (phones, laptops, tablets, consoles, cameras, audio)
 * - Home Appliances (refrigerators, washing machines, ovens, vacuums)
 * - Clothing & Fashion (designer items, shoes, bags, jewelry, watches)
 * - Furniture (sofas, tables, chairs, beds, storage, decorative)
 * - Sports & Leisure (gym equipment, bikes, ski gear, golf, instruments)
 * - Tools & Equipment (power tools, garden equipment, machinery)
 * - Collectibles (art, vintage, books, vinyl, trading cards)
 * 
 * Each category can have specific depreciation profiles and suitable marketplaces.
 */
export const assetCategories = pgTable('asset_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  parentId: uuid('parent_id').references(() => assetCategories.id), // Hierarchical structure
  icon: varchar('icon', { length: 100 }), // Icon name or URL for UI
  
  // Category-specific valuation data
  depreciationProfile: jsonb('depreciation_profile'), // {curve_type, annual_rate, factors}
  marketplaces: jsonb('marketplaces'), // Array of suitable platforms for this category
  
  // Metadata
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0), // Display ordering
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('asset_categories_slug_idx').on(table.slug),
  parentIdx: index('asset_categories_parent_idx').on(table.parentId),
  activeIdx: index('asset_categories_active_idx').on(table.isActive),
}));

// ============================================================================
// CORE ASSET MANAGEMENT
// Central asset tracking for both personal and professional contexts
// ============================================================================

/**
 * ASSETS TABLE
 * 
 * Core entity representing any owned item that can be resold. Supports both:
 * 1. Personal context: Individual belongings for resale optimization
 * 2. Professional context: Business assets with accounting integration
 * 
 * Key features:
 * - Purchase tracking (price, date, location, receipt)
 * - Resale planning (target date, price expectations)
 * - Professional assignment (employee, department, location)
 * - Accounting integration (depreciation periods, book value)
 * - Rich metadata (images, specifications, notes)
 * 
 * This implements the core concept: "register purchases with original price 
 * and date, then continuously calculate estimated resale value."
 */
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => assetCategories.id),
  
  // Basic asset identification
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  brand: varchar('brand', { length: 100 }),
  model: varchar('model', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  condition: varchar('condition', { length: 50 }), // new, excellent, good, fair, poor
  
  // Purchase information - Core to valuation system
  purchasePrice: decimal('purchase_price', { precision: 12, scale: 2 }).notNull(),
  purchaseDate: timestamp('purchase_date').notNull(),
  purchaseCurrency: varchar('purchase_currency', { length: 3 }).default('EUR'),
  purchaseLocation: text('purchase_location'), // Store/website where purchased
  receiptUrl: text('receipt_url'), // URL to receipt image for verification
  
  // Resale planning - Implements "planned resale timeframe" concept
  plannedSaleDate: timestamp('planned_sale_date'),
  targetSalePrice: decimal('target_sale_price', { precision: 12, scale: 2 }),
  
  // Professional context fields
  assignedTo: uuid('assigned_to').references(() => users.id), // Employee assignment
  department: varchar('department', { length: 100 }),
  location: varchar('location', { length: 255 }), // Physical location/office
  accountingDepreciationPeriod: integer('accounting_depreciation_period'), // Months for book value
  assetTag: varchar('asset_tag', { length: 50 }), // Physical asset tag number
  
  // Asset lifecycle
  status: assetStatusEnum('status').default('active'),
  actualSalePrice: decimal('actual_sale_price', { precision: 12, scale: 2 }), // When sold
  actualSaleDate: timestamp('actual_sale_date'),
  
  // Rich metadata
  images: jsonb('images'), // Array of image URLs
  specifications: jsonb('specifications'), // Technical specs, size, color, etc.
  tags: jsonb('tags'), // User-defined tags for organization
  notes: text('notes'), // Free-form notes
  
  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id), // Who added this asset
  deletedAt: timestamp('deleted_at'), // Soft delete
}, (table) => ({
  userIdx: index('assets_user_idx').on(table.userId),
  orgIdx: index('assets_org_idx').on(table.organizationId),
  categoryIdx: index('assets_category_idx').on(table.categoryId),
  statusIdx: index('assets_status_idx').on(table.status),
  assignedIdx: index('assets_assigned_idx').on(table.assignedTo),
  purchaseDateIdx: index('assets_purchase_date_idx').on(table.purchaseDate),
  plannedSaleDateIdx: index('assets_planned_sale_date_idx').on(table.plannedSaleDate),
  brandModelIdx: index('assets_brand_model_idx').on(table.brand, table.model),
  deletedIdx: index('assets_deleted_idx').on(table.deletedAt),
}));

// ============================================================================
// VALUATION SYSTEM
// Multi-scenario estimation engine - Core differentiator of AssetSync
// ============================================================================

/**
 * ASSET_VALUATIONS TABLE
 * 
 * Implements the core "Three-Tier Estimation Approach":
 * - Pessimistic: Worst market conditions (urgent sale, saturated market)
 * - Realistic: Average trends from last 3 years (normal market conditions)  
 * - Optimistic: Best conditions (patient sale, collector demand)
 * 
 * This table stores time-series valuation data to track how estimates evolve.
 * Each asset gets regular valuation updates across all three scenarios.
 * 
 * Example: BMW worth €25k today might be valued at:
 * - Pessimistic: €8k in 4 years
 * - Realistic: €12k in 4 years  
 * - Optimistic: €16k in 4 years
 */
export const assetValuations = pgTable('asset_valuations', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  scenario: valuationScenarioEnum('scenario').notNull(),
  
  // Core valuation data
  currentValue: decimal('current_value', { precision: 12, scale: 2 }).notNull(),
  projectedValue: decimal('projected_value', { precision: 12, scale: 2 }), // At planned sale date
  depreciationRate: decimal('depreciation_rate', { precision: 5, scale: 4 }), // Annual depreciation %
  
  // Market context affecting valuation
  marketCondition: varchar('market_condition', { length: 50 }), // strong, normal, weak
  confidenceLevel: integer('confidence_level'), // 1-100 based on data quality
  
  // Data sources and methodology transparency
  dataSources: jsonb('data_sources'), // Which platforms/sources were used
  methodology: text('methodology'), // Explanation of calculation for transparency
  sampleSize: integer('sample_size'), // Number of comparable sales found
  
  // Temporal aspects
  valuationDate: timestamp('valuation_date').defaultNow().notNull(),
  validUntil: timestamp('valid_until'), // When this valuation expires
  nextUpdateAt: timestamp('next_update_at'), // Scheduled refresh
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  assetScenarioIdx: index('valuations_asset_scenario_idx').on(table.assetId, table.scenario),
  valuationDateIdx: index('valuations_date_idx').on(table.valuationDate),
  validUntilIdx: index('valuations_valid_until_idx').on(table.validUntil),
  nextUpdateIdx: index('valuations_next_update_idx').on(table.nextUpdateAt),
}));

/**
 * MARKET_DATA_SOURCES TABLE
 * 
 * Registry of platforms and services providing market data for valuations.
 * Supports the "Real-Time Market Data Sources" mentioned in spec:
 * - Live marketplace data (Leboncoin, Vinted, eBay, Facebook Marketplace)
 * - Specialized platforms by category
 * - Partner APIs for professional valuations
 */
export const marketDataSources = pgTable('market_data_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  websiteUrl: varchar('website_url', { length: 255 }).notNull(),
  apiEndpoint: varchar('api_endpoint', { length: 255 }),
  
  // Integration configuration
  categories: jsonb('categories'), // Which asset categories this source covers
  apiKey: text('api_key'), // Encrypted API key if required
  rateLimits: jsonb('rate_limits'), // {requests_per_hour, daily_limit}
  
  // Status and health
  isActive: boolean('is_active').default(true),
  lastSyncAt: timestamp('last_sync_at'),
  lastErrorAt: timestamp('last_error_at'),
  errorCount: integer('error_count').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * MARKET_DATA_POINTS TABLE
 * 
 * Raw market data collected from various sources. This feeds the valuation
 * algorithms with real transaction data to calculate the three scenarios.
 * 
 * Supports "automated data collection" and "historical depreciation analysis"
 * by storing both listing prices and actual sale prices over time.
 */
export const marketDataPoints = pgTable('market_data_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').notNull().references(() => marketDataSources.id),
  categoryId: uuid('category_id').notNull().references(() => assetCategories.id),
  
  // Item identification for matching with user assets
  productName: varchar('product_name', { length: 255 }).notNull(),
  brand: varchar('brand', { length: 100 }),
  model: varchar('model', { length: 100 }),
  year: integer('year'), // Manufacturing/release year
  condition: varchar('condition', { length: 50 }),
  
  // Price data - core for valuation algorithms
  listingPrice: decimal('listing_price', { precision: 12, scale: 2 }).notNull(),
  soldPrice: decimal('sold_price', { precision: 12, scale: 2 }), // If actually sold
  currency: varchar('currency', { length: 3 }).default('EUR'),
  
  // Temporal data for trend analysis
  listingDate: timestamp('listing_date').notNull(),
  soldDate: timestamp('sold_date'),
  daysToSell: integer('days_to_sell'), // Calculated field for market velocity
  
  // Metadata for data quality and matching
  location: varchar('location', { length: 100 }),
  externalId: varchar('external_id', { length: 255 }), // ID on source platform
  url: text('url'),
  specifications: jsonb('specifications'), // Detailed product specs
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index('market_data_source_idx').on(table.sourceId),
  categoryIdx: index('market_data_category_idx').on(table.categoryId),
  dateIdx: index('market_data_date_idx').on(table.listingDate),
  brandModelIdx: index('market_data_brand_model_idx').on(table.brand, table.model),
  soldDateIdx: index('market_data_sold_date_idx').on(table.soldDate),
  priceIdx: index('market_data_price_idx').on(table.listingPrice),
}));

// ============================================================================
// PLATFORM INTEGRATIONS & MARKETPLACE MANAGEMENT  
// Multi-platform selling support as outlined in "Integrated Selling Support"
// ============================================================================

/**
 * PLATFORMS TABLE
 * 
 * Registry of supported marketplaces for automated listing and selling.
 * Implements the "Platform Ecosystem" with native integrations:
 * - Leboncoin, Vinted, eBay, Facebook Marketplace
 * - Vestiaire Collective, Chrono24, Catawiki, BackMarket
 * - Category-specific platforms
 * 
 * Each platform has different capabilities (auctions, shipping, local pickup)
 * and commission structures.
 */
export const platforms = pgTable('platforms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  websiteUrl: varchar('website_url', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  
  // Integration capabilities
  apiEndpoint: varchar('api_endpoint', { length: 255 }),
  hasApiIntegration: boolean('has_api_integration').default(false),
  supportedCategories: jsonb('supported_categories'), // Which asset types supported
  
  // Economic model - implements "Transaction-Based Revenue" 
  commissionRate: decimal('commission_rate', { precision: 5, scale: 4 }), // Platform commission %
  ourCommissionRate: decimal('our_commission_rate', { precision: 5, scale: 4 }), // Our cut
  
  // Platform features
  supportsAuctions: boolean('supports_auctions').default(false),
  supportsFixedPrice: boolean('supports_fixed_price').default(true),
  supportsLocalDelivery: boolean('supports_local_delivery').default(false),
  supportsShipping: boolean('supports_shipping').default(true),
  supportsPaymentProcessing: boolean('supports_payment_processing').default(false),
  
  // Platform-specific settings
  listingSettings: jsonb('listing_settings'), // Default settings for listings
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('platforms_slug_idx').on(table.slug),
  activeIdx: index('platforms_active_idx').on(table.isActive),
}));

/**
 * USER_PLATFORM_CONNECTIONS TABLE
 * 
 * OAuth/API connections between users and selling platforms.
 * Enables automated listing generation and inventory synchronization
 * across multiple platforms simultaneously.
 */
export const userPlatformConnections = pgTable('user_platform_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platformId: uuid('platform_id').notNull().references(() => platforms.id, { onDelete: 'cascade' }),
  
  // Platform authentication
  platformUserId: varchar('platform_user_id', { length: 255 }),
  platformUsername: varchar('platform_username', { length: 255 }),
  accessToken: text('access_token'), // Encrypted OAuth token
  refreshToken: text('refresh_token'), // Encrypted refresh token
  tokenExpiresAt: timestamp('token_expires_at'),
  
  // Connection health and sync
  isActive: boolean('is_active').default(true),
  lastSyncAt: timestamp('last_sync_at'),
  lastSyncError: text('last_sync_error'),
  syncSettings: jsonb('sync_settings'), // Auto-sync preferences
  
  connectedAt: timestamp('connected_at').defaultNow().notNull(),
  disconnectedAt: timestamp('disconnected_at'),
}, (table) => ({
  userPlatformIdx: unique('unique_user_platform').on(table.userId, table.platformId),
  activeIdx: index('user_platform_connections_active_idx').on(table.isActive),
}));

/**
 * ASSET_LISTINGS TABLE
 * 
 * Cross-platform listing management implementing "Multi-platform listing management"
 * with synchronized inventory. When item sells on one platform, it's automatically
 * removed from others.
 * 
 * Supports both manual and automated listing creation with platform-specific
 * optimization (pricing strategies, descriptions, categories).
 */
export const assetListings = pgTable('asset_listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  platformId: uuid('platform_id').notNull().references(() => platforms.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  
  // Listing content - can be auto-generated or manual
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('EUR'),
  images: jsonb('images'), // Platform-specific image URLs
  
  // Platform-specific data
  externalId: varchar('external_id', { length: 255 }), // Platform's listing ID
  externalUrl: text('external_url'),
  platformStatus: varchar('platform_status', { length: 50 }), // Platform's status
  platformCategory: varchar('platform_category', { length: 100 }), // Platform's category
  
  // Listing configuration
  isAuction: boolean('is_auction').default(false),
  auctionEndDate: timestamp('auction_end_date'),
  reservePrice: decimal('reserve_price', { precision: 12, scale: 2 }),
  buyItNowPrice: decimal('buy_it_now_price', { precision: 12, scale: 2 }),
  
  // Delivery and logistics
  allowsLocalPickup: boolean('allows_local_pickup').default(true),
  allowsShipping: boolean('allows_shipping').default(false),
  shippingCost: decimal('shipping_cost', { precision: 8, scale: 2 }),
  shippingOptions: jsonb('shipping_options'), // Platform-specific shipping methods
  
  // Performance metrics
  status: listingStatusEnum('status').default('draft'),
  viewCount: integer('view_count').default(0),
  watchCount: integer('watch_count').default(0),
  messageCount: integer('message_count').default(0),
  
  // Auto-management
  autoRelist: boolean('auto_relist').default(false), // Relist if expires unsold
  priceStrategy: varchar('price_strategy', { length: 50 }), // fixed, decline, auction
  
  // Important timestamps
  listedAt: timestamp('listed_at'),
  expiresAt: timestamp('expires_at'),
  soldAt: timestamp('sold_at'),
  finalSalePrice: decimal('final_sale_price', { precision: 12, scale: 2 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  assetIdx: index('listings_asset_idx').on(table.assetId),
  platformIdx: index('listings_platform_idx').on(table.platformId),
  userIdx: index('listings_user_idx').on(table.userId),
  statusIdx: index('listings_status_idx').on(table.status),
  listedAtIdx: index('listings_listed_at_idx').on(table.listedAt),
  expiresAtIdx: index('listings_expires_at_idx').on(table.expiresAt),
}));

// ============================================================================
// SUBSCRIPTION & BILLING SYSTEM
// Implements the freemium and professional pricing models
// ============================================================================

/**
 * SUBSCRIPTION_PLANS TABLE
 * 
 * Defines the pricing tiers outlined in "Economic Model":
 * 
 * Personal:
 * - Free: Up to 50 objects, basic estimations, manual listings
 * - Premium (€6.99/month): Unlimited objects, multi-scenario, automation
 * 
 * Professional:
 * - Starter (€25/month): 200 assets, 5 users, basic exports
 * - Business (€75/month): 1000 assets, 20 users, accounting integration  
 * - Enterprise (custom): Unlimited, API access, dedicated support
 */
export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  type: planTypeEnum('type').notNull(), // Maps to user context
  
  // Pricing structure
  monthlyPrice: decimal('monthly_price', { precision: 8, scale: 2 }),
  yearlyPrice: decimal('yearly_price', { precision: 8, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('EUR'),
  
  // Feature limits and capabilities
  maxAssets: integer('max_assets'), // null = unlimited
  maxUsers: integer('max_users'), // For professional plans
  maxOrganizations: integer('max_organizations'), // For enterprise users
  features: jsonb('features'), // Array of feature flags/capabilities
  
  // Plan metadata
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('subscription_plans_slug_idx').on(table.slug),
  typeIdx: index('subscription_plans_type_idx').on(table.type),
  activeIdx: index('subscription_plans_active_idx').on(table.isActive),
}));

/**
 * USER_SUBSCRIPTIONS TABLE
 * 
 * Tracks individual subscription instances with billing integration.
 * Supports both personal and organizational subscriptions.
 */
export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id').notNull().references(() => subscriptionPlans.id),
  organizationId: uuid('organization_id').references(() => organizations.id), // For professional plans
  
  // Subscription details
  status: subscriptionStatusEnum('status').notNull().default('trial'),
  billingCycle: varchar('billing_cycle', { length: 20 }), // monthly, yearly
  amount: decimal('amount', { precision: 8, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('EUR'),
  
  // External billing system integration (Stripe)
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  
  // Subscription lifecycle
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  trialEndDate: timestamp('trial_end_date'),
  nextBillingDate: timestamp('next_billing_date'),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('subscriptions_user_idx').on(table.userId),
  statusIdx: index('subscriptions_status_idx').on(table.status),
  nextBillingIdx: index('subscriptions_next_billing_idx').on(table.nextBillingDate),
  orgIdx: index('subscriptions_org_idx').on(table.organizationId),
}));

/**
 * TRANSACTIONS TABLE
 * 
 * Financial transaction tracking for:
 * - Asset sales (user revenue)
 * - Platform commissions (our revenue) 
 * - Subscription payments
 * - Refunds and adjustments
 * 
 * Implements "Transaction-Based Revenue" model with 1-2% commission on sales.
 */
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  assetId: uuid('asset_id').references(() => assets.id), // For sale transactions
  listingId: uuid('listing_id').references(() => assetListings.id),
  subscriptionId: uuid('subscription_id').references(() => userSubscriptions.id),
  
  // Transaction details
  type: transactionTypeEnum('type').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('EUR'),
  commission: decimal('commission', { precision: 8, scale: 2 }), // Our commission
  platformFee: decimal('platform_fee', { precision: 8, scale: 2 }), // Platform's fee
  
  // External payment system integration
  platformTransactionId: varchar('platform_transaction_id', { length: 255 }),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  stripeChargeId: varchar('stripe_charge_id', { length: 255 }),
  
  // Transaction lifecycle
  status: transactionStatusEnum('status').notNull().default('pending'),
  
  // Metadata and audit
  description: text('description'),
  metadata: jsonb('metadata'), // Additional structured data
  
  processedAt: timestamp('processed_at'),
  failedAt: timestamp('failed_at'),
  refundedAt: timestamp('refunded_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('transactions_user_idx').on(table.userId),
  typeIdx: index('transactions_type_idx').on(table.type),
  statusIdx: index('transactions_status_idx').on(table.status),
  assetIdx: index('transactions_asset_idx').on(table.assetId),
  processedAtIdx: index('transactions_processed_at_idx').on(table.processedAt),
}));

// ============================================================================
// NOTIFICATIONS & ALERT SYSTEM
// Implements intelligent alerting for optimal selling decisions
// ============================================================================

/**
 * NOTIFICATIONS TABLE
 * 
 * User notification system implementing key alerts mentioned in spec:
 * - Value threshold alerts (when to sell)
 * - Optimal timing notifications (new model releases approaching)
 * - Market condition changes
 * - Listing performance updates
 * - Professional asset assignment notifications
 * 
 * Example: "6 months before deadline, application alerts that new BMW generation
 * is announced and user should sell now at €20,000 rather than wait"
 */
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  assetId: uuid('asset_id').references(() => assets.id), // Asset-specific notifications
  organizationId: uuid('organization_id').references(() => organizations.id),
  
  // Notification content
  type: varchar('type', { length: 50 }).notNull(), // valuation_alert, sale_opportunity, etc.
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  actionUrl: text('action_url'), // Deep link to relevant section
  actionLabel: varchar('action_label', { length: 100 }), // CTA button text
  
  // Rich notification data
  priority: varchar('priority', { length: 20 }).default('normal'), // low, normal, high, urgent
  category: varchar('category', { length: 50 }), // alert, info, success, warning, error
  data: jsonb('data'), // Additional structured data for rich display
  
  // Delivery channels
  channels: jsonb('channels'), // [email, push, in_app] - which channels to use
  emailSent: boolean('email_sent').default(false),
  pushSent: boolean('push_sent').default(false),
  
  // User interaction
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  clickedAt: timestamp('clicked_at'),
  
  // Notification lifecycle
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // Auto-cleanup old notifications
  deletedAt: timestamp('deleted_at'), // Soft delete
}, (table) => ({
  userIdx: index('notifications_user_idx').on(table.userId),
  typeIdx: index('notifications_type_idx').on(table.type),
  readIdx: index('notifications_read_idx').on(table.isRead),
  priorityIdx: index('notifications_priority_idx').on(table.priority),
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
  expiresAtIdx: index('notifications_expires_at_idx').on(table.expiresAt),
}));

// ============================================================================
// ADDITIONAL UTILITY TABLES
// Supporting tables for enhanced functionality
// ============================================================================

/**
 * ASSET_HISTORY TABLE
 * 
 * Audit trail for asset changes - important for professional context
 * where asset movements and modifications need to be tracked for compliance.
 */
export const assetHistory = pgTable('asset_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id), // Who made the change
  
  // Change tracking
  action: varchar('action', { length: 50 }).notNull(), // created, updated, transferred, sold, etc.
  fieldChanged: varchar('field_changed', { length: 100 }), // Which field was modified
  oldValue: text('old_value'),
  newValue: text('new_value'),
  
  // Context
  reason: text('reason'), // Why the change was made
  ipAddress: varchar('ip_address', { length: 45 }), // IPv4/IPv6 for security
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  assetIdx: index('asset_history_asset_idx').on(table.assetId),
  userIdx: index('asset_history_user_idx').on(table.userId),
  actionIdx: index('asset_history_action_idx').on(table.action),
  createdAtIdx: index('asset_history_created_at_idx').on(table.createdAt),
}));

/**
 * SAVED_SEARCHES TABLE
 * 
 * Allow users to save market searches for tracking specific item types
 * they're interested in buying or monitoring for competitive analysis.
 */
export const savedSearches = pgTable('saved_searches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Search configuration  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  searchCriteria: jsonb('search_criteria').notNull(), // Query parameters
  
  // Alert settings
  alertEnabled: boolean('alert_enabled').default(false),
  alertFrequency: varchar('alert_frequency', { length: 20 }), // daily, weekly, monthly
  priceThreshold: decimal('price_threshold', { precision: 12, scale: 2 }),
  
  // Metadata
  lastRunAt: timestamp('last_run_at'),
  resultCount: integer('result_count'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('saved_searches_user_idx').on(table.userId),
  alertEnabledIdx: index('saved_searches_alert_enabled_idx').on(table.alertEnabled),
}));

// ============================================================================
// RELATIONS
// Define all table relationships for Drizzle ORM
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  organizations: many(userOrganizations),
  assets: many(assets),
  assignedAssets: many(assets, { relationName: 'assignedAssets' }),
  listings: many(assetListings),
  subscriptions: many(userSubscriptions),
  platformConnections: many(userPlatformConnections),
  notifications: many(notifications),
  transactions: many(transactions),
  assetHistory: many(assetHistory),
  savedSearches: many(savedSearches),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(userOrganizations),
  assets: many(assets),
  subscriptions: many(userSubscriptions),
  notifications: many(notifications),
}));

export const userOrganizationsRelations = relations(userOrganizations, ({ one }) => ({
  user: one(users, {
    fields: [userOrganizations.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [userOrganizations.organizationId],
    references: [organizations.id],
  }),
  invitedByUser: one(users, {
    fields: [userOrganizations.invitedBy],
    references: [users.id],
  }),
}));

export const assetCategoriesRelations = relations(assetCategories, ({ many, one }) => ({
  assets: many(assets),
  parent: one(assetCategories, {
    fields: [assetCategories.parentId],
    references: [assetCategories.id],
  }),
  children: many(assetCategories),
  marketDataPoints: many(marketDataPoints),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  user: one(users, {
    fields: [assets.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [assets.organizationId],
    references: [organizations.id],
  }),
  category: one(assetCategories, {
    fields: [assets.categoryId],
    references: [assetCategories.id],
  }),
  assignedUser: one(users, {
    fields: [assets.assignedTo],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [assets.createdBy],
    references: [users.id],
  }),
  valuations: many(assetValuations),
  listings: many(assetListings),
  notifications: many(notifications),
  transactions: many(transactions),
  history: many(assetHistory),
}));

export const assetValuationsRelations = relations(assetValuations, ({ one }) => ({
  asset: one(assets, {
    fields: [assetValuations.assetId],
    references: [assets.id],
  }),
}));

export const marketDataSourcesRelations = relations(marketDataSources, ({ many }) => ({
  dataPoints: many(marketDataPoints),
}));

export const marketDataPointsRelations = relations(marketDataPoints, ({ one }) => ({
  source: one(marketDataSources, {
    fields: [marketDataPoints.sourceId],
    references: [marketDataSources.id],
  }),
  category: one(assetCategories, {
    fields: [marketDataPoints.categoryId],
    references: [assetCategories.id],
  }),
}));

export const platformsRelations = relations(platforms, ({ many }) => ({
  connections: many(userPlatformConnections),
  listings: many(assetListings),
}));

export const userPlatformConnectionsRelations = relations(userPlatformConnections, ({ one }) => ({
  user: one(users, {
    fields: [userPlatformConnections.userId],
    references: [users.id],
  }),
  platform: one(platforms, {
    fields: [userPlatformConnections.platformId],
    references: [platforms.id],
  }),
}));

export const assetListingsRelations = relations(assetListings, ({ one, many }) => ({
  asset: one(assets, {
    fields: [assetListings.assetId],
    references: [assets.id],
  }),
  platform: one(platforms, {
    fields: [assetListings.platformId],
    references: [platforms.id],
  }),
  user: one(users, {
    fields: [assetListings.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [userSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  organization: one(organizations, {
    fields: [userSubscriptions.organizationId],
    references: [organizations.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  asset: one(assets, {
    fields: [transactions.assetId],
    references: [assets.id],
  }),
  listing: one(assetListings, {
    fields: [transactions.listingId],
    references: [assetListings.id],
  }),
  subscription: one(userSubscriptions, {
    fields: [transactions.subscriptionId],
    references: [userSubscriptions.id],
  }),
}));