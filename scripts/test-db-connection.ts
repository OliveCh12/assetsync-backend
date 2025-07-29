#!/usr/bin/env tsx

/**
 * Database Connection Test Script
 * 
 * This script tests the connection to your PostgreSQL database
 * and verifies that Drizzle ORM can connect successfully.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

async function testDatabaseConnection() {
  console.log('🔍 Testing AssetSync Database Connection...\n');
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment');
    console.error('   Make sure to set it when running this script:');
    console.error('   DATABASE_URL="postgresql://..." tsx scripts/test-db-connection.ts');
    process.exit(1);
  }
  
  console.log(`📡 Connecting to: ${DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);
  
  try {
    // Initialize Drizzle with node-postgres
    const db = drizzle(DATABASE_URL);
    
    console.log('⏳ Testing connection...');
    
    // Test basic connection
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Basic connection successful');
    
    // Test database info
    const versionResult = await db.execute(sql`SELECT version() as version`);
    const version = versionResult.rows[0]?.version as string;
    console.log(`📊 PostgreSQL Version: ${version?.split(' ')[1] || 'Unknown'}`);
    
    // Test database name
    const dbNameResult = await db.execute(sql`SELECT current_database() as dbname`);
    const dbName = dbNameResult.rows[0]?.dbname;
    console.log(`🗄️  Connected to database: ${dbName}`);
    
    // Test if we can create tables (permissions check)
    console.log('⏳ Testing table creation permissions...');
    
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS connection_test (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      await db.execute(sql`INSERT INTO connection_test DEFAULT VALUES`);
      
      const testResult = await db.execute(sql`SELECT COUNT(*) as count FROM connection_test`);
      const count = testResult.rows[0]?.count;
      
      await db.execute(sql`DROP TABLE connection_test`);
      
      console.log('✅ Table creation/insertion/deletion permissions verified');
      console.log(`📝 Test records created: ${count}`);
      
    } catch (error) {
      console.warn('⚠️  Limited permissions - cannot create tables');
      console.warn('   This might be fine if tables will be created via migrations');
    }
    
    console.log('\n🎉 Database connection test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: pnpm db:generate (to generate migration files)');
    console.log('   2. Run: pnpm db:migrate (to create tables)');
    console.log('   3. Run: pnpm dev (to start the server)');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      
      // Provide specific help based on common errors
      if (error.message.includes('ECONNREFUSED')) {
        console.error('\n💡 Troubleshooting:');
        console.error('   - Is PostgreSQL running?');
        console.error('   - Check if the port (5433) is correct');
        console.error('   - Verify the host is accessible');
      } else if (error.message.includes('password authentication failed')) {
        console.error('\n💡 Troubleshooting:');
        console.error('   - Check username and password in .env');
        console.error('   - Verify user exists in PostgreSQL');
        console.error('   - Check user permissions');
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.error('\n💡 Troubleshooting:');
        console.error('   - Create the database: CREATE DATABASE assetsync;');
        console.error('   - Or update DATABASE_URL with existing database name');
      }
    }
    
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
