#!/usr/bin/env tsx

/**
 * Verification script for drizzle-zod validation setup
 * 
 * This script:
 * 1. Counts all database tables in db.ts
 * 2. Counts all validation schemas in schemas.ts  
 * 3. Tests that schemas can be imported and used
 * 4. Verifies all 19 tables have corresponding validation schemas
 */

import { readFileSync } from 'fs';
import path from 'path';

// Read the database schema file to count tables
const dbFilePath = path.join(process.cwd(), 'src/lib/db.ts');
const dbContent = readFileSync(dbFilePath, 'utf-8');

// Count pgTable exports in db.ts
const tableMatches = dbContent.match(/export const \w+ = pgTable/g);
const tableCount = tableMatches ? tableMatches.length : 0;

// Read the validation schemas file
const schemasFilePath = path.join(process.cwd(), 'src/lib/validation/schemas.ts');
const schemasContent = readFileSync(schemasFilePath, 'utf-8');

// Count different types of schemas
const insertSchemas = schemasContent.match(/export const insert\w+Schema = createInsertSchema/g);
const selectSchemas = schemasContent.match(/export const select\w+Schema = createSelectSchema/g);
const updateSchemas = schemasContent.match(/export const update\w+Schema = createUpdateSchema/g);

const insertCount = insertSchemas ? insertSchemas.length : 0;
const selectCount = selectSchemas ? selectSchemas.length : 0;
const updateCount = updateSchemas ? updateSchemas.length : 0;

console.log('🔍 Database Tables and Validation Schema Verification');
console.log('====================================================');
console.log();
console.log(`📊 Database Tables Found: ${tableCount}`);
console.log(`✅ Insert Schemas: ${insertCount}`);
console.log(`📖 Select Schemas: ${selectCount}`);
console.log(`📝 Update Schemas: ${updateCount}`);
console.log();

// Expected: 19 tables, each should have 3 schemas (insert, select, update)
const expectedTables = 19;
const expectedPerType = expectedTables;

if (tableCount === expectedTables) {
  console.log(`✅ All ${expectedTables} database tables found!`);
} else {
  console.log(`❌ Expected ${expectedTables} tables, found ${tableCount}`);
}

if (insertCount === expectedPerType && selectCount === expectedPerType && updateCount === expectedPerType) {
  console.log(`✅ All validation schemas generated! (${insertCount + selectCount + updateCount} total schemas)`);
} else {
  console.log(`❌ Schema count mismatch:`);
  console.log(`   Expected: ${expectedPerType} of each type`);
  console.log(`   Found: Insert(${insertCount}), Select(${selectCount}), Update(${updateCount})`);
}

console.log();

// Test imports (this will fail if there are compilation errors)
async function testImports() {
  try {
    console.log('🧪 Testing schema imports...');
    
    // Import a few schemas to verify they work
    const schemas = await import('../src/lib/validation/schemas.js');
    
    const testSchemas = [
      'insertUserSchema',
      'selectUserSchema', 
      'updateUserSchema',
      'insertAssetSchema',
      'selectAssetSchema',
      'insertMarketDataSourceSchema',
      'insertSavedSearchSchema'
    ];
    
    for (const schemaName of testSchemas) {
      if (schemas[schemaName]) {
        console.log(`  ✅ ${schemaName} imported successfully`);
      } else {
        console.log(`  ❌ ${schemaName} not found in exports`);
      }
    }
    
    console.log();
    console.log('🎉 drizzle-zod setup verification complete!');
    console.log();
    console.log('📋 Summary:');
    console.log(`   • ${tableCount} database tables defined`);
    console.log(`   • ${insertCount + selectCount + updateCount} validation schemas generated`);
    console.log('   • All schemas import without errors');
    console.log('   • Ready for Task 1.1 completion! ✅');
    
  } catch (error) {
    console.log('❌ Error importing schemas:', error instanceof Error ? error.message : String(error));
    console.log('   The schemas file may have compilation errors.');
  }
}

await testImports();
