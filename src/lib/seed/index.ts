/**
 * Main Seeding Orchestrator
 * 
 * Coordinates the seeding of all database tables in the correct order
 */

import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import { getDatabase, initDatabase, users, organizations, subscriptionPlans, platforms, assets, userOrganizations, assetCategories } from '../db.js';

// Import seeders
import { seedCategories } from './seeders/categories.seeder.js';
import { seedUsers } from './seeders/users.seeder.js';

// Import static data
import { SUBSCRIPTION_PLANS } from './data/subscription-plans.js';
import { PLATFORMS } from './data/platforms.js';

// Import generators
import { generateAssets } from './generators/assets.js';

export interface SeedOptions {
  userCount?: number;
  assetCount?: number;
  seed?: number; // For reproducible data
  reset?: boolean; // Whether to reset existing data
}

/**
 * Seed subscription plans
 */
async function seedSubscriptionPlans(): Promise<void> {
  console.log('💳 Seeding subscription plans...');
  
  const db = getDatabase();

  for (const plan of SUBSCRIPTION_PLANS) {
    const existing = await db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.slug, plan.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`⏭️  Plan '${plan.name}' already exists`);
      continue;
    }

    await db.insert(subscriptionPlans)
      .values({
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        type: plan.type,
        monthlyPrice: plan.monthlyPrice?.toString(),
        yearlyPrice: plan.yearlyPrice?.toString(),
        currency: plan.currency,
        maxAssets: plan.maxAssets,
        maxUsers: plan.maxUsers,
        maxOrganizations: plan.maxOrganizations,
        features: plan.features,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder
      });

    console.log(`✅ Created subscription plan: ${plan.name}`);
  }
}

/**
 * Seed marketplace platforms
 */
async function seedPlatforms(): Promise<void> {
  console.log('🏪 Seeding marketplace platforms...');
  
  const db = getDatabase();

  for (const platform of PLATFORMS) {
    const existing = await db.select()
      .from(platforms)
      .where(eq(platforms.slug, platform.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`⏭️  Platform '${platform.name}' already exists`);
      continue;
    }

    await db.insert(platforms)
      .values({
        name: platform.name,
        slug: platform.slug,
        description: platform.description,
        websiteUrl: platform.website,
        logoUrl: platform.logoUrl,
        apiEndpoint: platform.apiEndpoint,
        hasApiIntegration: platform.integrationLevel !== 'basic',
        supportedCategories: platform.supportedCategories,
        commissionRate: platform.commissionRate?.toString(),
        supportsAuctions: platform.features.includes('auction_format'),
        supportsFixedPrice: !platform.features.includes('auction_format'),
        supportsLocalDelivery: platform.features.includes('local_pickup'),
        supportsShipping: platform.features.includes('global_shipping') || platform.features.includes('integrated_shipping'),
        supportsPaymentProcessing: platform.features.includes('buyer_protection'),
        listingSettings: {
          features: platform.features,
          integrationLevel: platform.integrationLevel
        },
        isActive: platform.isActive
      });

    console.log(`✅ Created platform: ${platform.name}`);
  }
}

/**
 * Seed sample assets
 */
async function seedAssets(
  userIds: string[],
  categoryMap: Record<string, string>,
  count: number
): Promise<void> {
  console.log(`📦 Seeding ${count} sample assets...`);
  
  const db = getDatabase();
  const generatedAssets = generateAssets(userIds, categoryMap, count);

  for (const assetData of generatedAssets) {
    await db.insert(assets)
      .values(assetData);
  }

  console.log(`✅ Created ${count} sample assets`);
}

/**
 * Main seeding function
 */
export async function seedDatabase(options: SeedOptions = {}): Promise<void> {
  const {
    userCount = 10,
    assetCount = 50,
    seed = 12345,
    reset = false
  } = options;

  console.log('🌱 Starting database seeding...');
  console.log(`📊 Configuration: ${userCount} users, ${assetCount} assets, seed: ${seed}`);

  // Set faker seed for reproducible data
  faker.seed(seed);

  try {
    // Step 1: Seed reference data (order matters due to foreign keys)
    console.log('\n📚 Step 1: Seeding reference data...');
    
    const categoryMap = await seedCategories();
    await seedSubscriptionPlans();
    await seedPlatforms();

    // Step 2: Seed users and organizations
    console.log('\n👥 Step 2: Seeding users and organizations...');
    const { userIds, organizationIds } = await seedUsers(userCount);

    // Step 3: Seed sample assets
    console.log('\n📦 Step 3: Seeding sample assets...');
    await seedAssets(userIds, categoryMap, assetCount);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${Object.keys(categoryMap).length}`);
    console.log(`   - Subscription plans: ${SUBSCRIPTION_PLANS.length}`);
    console.log(`   - Platforms: ${PLATFORMS.length}`);
    console.log(`   - Users: ${userIds.length}`);
    console.log(`   - Organizations: ${organizationIds.length}`);
    console.log(`   - Assets: ${assetCount}`);

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

/**
 * Reset database function (for development/testing)
 */
export async function resetDatabase(): Promise<void> {
  console.log('🧹 Resetting database...');
  
  const db = getDatabase();

  try {
    // Delete in reverse order to respect foreign key constraints
    await db.delete(assets);
    await db.delete(userOrganizations);
    await db.delete(organizations);
    await db.delete(users);
    await db.delete(platforms);
    await db.delete(subscriptionPlans);
    await db.delete(assetCategories);

    console.log('✅ Database reset completed');

  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}

// CLI support - run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset');
  const userCount = parseInt(args.find(arg => arg.startsWith('--users='))?.split('=')[1] || '10');
  const assetCount = parseInt(args.find(arg => arg.startsWith('--assets='))?.split('=')[1] || '50');

  (async () => {
    try {
      // Initialize database connection
      const DATABASE_URL = process.env.DATABASE_URL;
      if (!DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
      }
      
      console.log('🔗 Connecting to database...');
      initDatabase(DATABASE_URL);
      console.log('✅ Database connected successfully');

      if (shouldReset) {
        await resetDatabase();
      }
      
      await seedDatabase({
        userCount,
        assetCount,
        reset: shouldReset
      });
      
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    }
  })();
}