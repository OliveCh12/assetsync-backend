/**
 * Asset Categories Seeder
 * 
 * Seeds the database with asset categories and subcategories
 */

import { eq } from 'drizzle-orm';
import { getDatabase, assetCategories } from '../../db.js';
import { MAIN_CATEGORIES, SUBCATEGORIES } from '../data/categories.js';

export async function seedCategories(): Promise<Record<string, string>> {
  console.log('🏷️  Seeding asset categories...');
  
  const db = getDatabase();
  const categoryMap: Record<string, string> = {};

  try {
    // Seed main categories first
    console.log('📦 Seeding main categories...');
    
    for (const [index, category] of MAIN_CATEGORIES.entries()) {
      // Check if category already exists
      const existing = await db.select()
        .from(assetCategories)
        .where(eq(assetCategories.slug, category.slug))
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  Category '${category.name}' already exists`);
        categoryMap[category.slug] = existing[0].id;
        continue;
      }

      const [inserted] = await db.insert(assetCategories)
        .values({
          name: category.name,
          slug: category.slug,
          description: category.description,
          parentId: null,
          icon: category.icon,
          depreciationProfile: category.depreciationProfile,
          marketplaces: category.marketplaces,
          isActive: true,
          sortOrder: index
        })
        .returning({ id: assetCategories.id });

      categoryMap[category.slug] = inserted.id;
      console.log(`✅ Created category: ${category.name}`);
    }

    // Seed subcategories
    console.log('📂 Seeding subcategories...');
    
    for (const [index, subcategory] of SUBCATEGORIES.entries()) {
      // Check if subcategory already exists
      const existing = await db.select()
        .from(assetCategories)
        .where(eq(assetCategories.slug, subcategory.slug))
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  Subcategory '${subcategory.name}' already exists`);
        categoryMap[subcategory.slug] = existing[0].id;
        continue;
      }

      const parentId = categoryMap[subcategory.parent];
      if (!parentId) {
        console.warn(`⚠️  Parent category '${subcategory.parent}' not found for subcategory '${subcategory.name}'`);
        continue;
      }

      const [inserted] = await db.insert(assetCategories)
        .values({
          name: subcategory.name,
          slug: subcategory.slug,
          description: subcategory.description,
          parentId,
          icon: subcategory.icon,
          isActive: true,
          sortOrder: index
        })
        .returning({ id: assetCategories.id });

      categoryMap[subcategory.slug] = inserted.id;
      console.log(`✅ Created subcategory: ${subcategory.name}`);
    }

    console.log(`🎉 Successfully seeded ${Object.keys(categoryMap).length} categories`);
    return categoryMap;

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
}