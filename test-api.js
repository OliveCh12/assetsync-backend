/**
 * Simple API Test Script
 * 
 * Tests the main API endpoints to ensure they're working correctly
 */

const baseURL = 'http://localhost:3001/api/v1';

// Test user credentials (will be created during test)
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  firstName: 'Test',
  lastName: 'User',
  type: 'personal'
};

let authToken = '';
let userId = '';

async function makeRequest(endpoint, options = {}) {
  const url = `${baseURL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json();
    
    console.log(`${options.method || 'GET'} ${endpoint}: ${response.status}`);
    if (!response.ok) {
      console.error('Error:', data);
    }
    return { response, data };
  } catch (error) {
    console.error(`Failed to call ${endpoint}:`, error.message);
    return { error };
  }
}

async function testHealthEndpoint() {
  console.log('\n🔍 Testing Health Endpoint...');
  const { data } = await makeRequest('/../');
  console.log('Health check:', data?.status);
}

async function testUserRegistration() {
  console.log('\n👤 Testing User Registration...');
  const { response, data } = await makeRequest('/auth/register', {
    method: 'POST',
    body: testUser
  });
  
  if (response?.ok) {
    authToken = data.tokens?.accessToken;
    userId = data.user?.id;
    console.log('✅ User registered and logged in');
    return true;
  } else {
    console.log('ℹ️  User might already exist, trying login...');
    return false;
  }
}

async function testUserLogin() {
  console.log('\n🔐 Testing User Login...');
  const { response, data } = await makeRequest('/auth/login', {
    method: 'POST',
    body: {
      email: testUser.email,
      password: testUser.password
    }
  });
  
  if (response?.ok) {
    authToken = data.tokens?.accessToken;
    userId = data.user?.id;
    console.log('✅ User logged in successfully');
    return true;
  }
  return false;
}

async function testGetUserProfile() {
  console.log('\n👥 Testing Get User Profile...');
  const { response, data } = await makeRequest('/auth/me');
  
  if (response?.ok) {
    console.log('✅ User profile retrieved:', data.user?.email);
    return true;
  }
  return false;
}

async function testListCategories() {
  console.log('\n📂 Testing List Categories...');
  const { response, data } = await makeRequest('/categories');
  
  if (response?.ok) {
    console.log(`✅ Found ${data.data?.length || 0} categories`);
    return data.data?.[0]?.id; // Return first category ID for asset testing
  }
  return null;
}

async function testCreateAsset(categoryId) {
  if (!categoryId) {
    console.log('❌ Cannot test asset creation without category ID');
    return null;
  }
  
  console.log('\n📦 Testing Create Asset...');
  const assetData = {
    name: 'Test Laptop',
    description: 'A test laptop for API testing',
    brand: 'TestBrand',
    model: 'TestModel-2024',
    categoryId: categoryId,
    purchasePrice: '1200.50',
    purchaseDate: new Date().toISOString(),
    condition: 'excellent'
  };
  
  const { response, data } = await makeRequest('/assets', {
    method: 'POST',
    body: assetData
  });
  
  if (response?.ok) {
    console.log('✅ Asset created:', data.data?.name);
    return data.data?.id;
  }
  return null;
}

async function testListAssets() {
  console.log('\n📋 Testing List Assets...');
  const { response, data } = await makeRequest('/assets');
  
  if (response?.ok) {
    const count = data.data?.length || 0;
    console.log(`✅ Found ${count} assets`);
    console.log(`📊 Pagination: page ${data.pagination?.page}, total ${data.pagination?.total}`);
    return true;
  }
  return false;
}

async function testAssetStats() {
  console.log('\n📈 Testing Asset Stats...');  
  const { response, data } = await makeRequest('/assets/stats');
  
  if (response?.ok) {
    console.log('✅ Asset stats retrieved:');
    console.log(`   Total Assets: ${data.data?.totalAssets}`);
    console.log(`   Total Value: €${data.data?.totalValue}`);
    console.log(`   Recent Assets: ${data.data?.recentAssets}`);
    return true;
  }
  return false;
}

async function testGetAsset(assetId) {
  if (!assetId) {
    console.log('❌ Cannot test get asset without asset ID');
    return false;
  }
  
  console.log('\n🔍 Testing Get Asset...');
  const { response, data } = await makeRequest(`/assets/${assetId}`);
  
  if (response?.ok) {
    console.log('✅ Asset retrieved:', data.data?.name);
    return true;
  }
  return false;
}

async function runTests() {
  console.log('🚀 Starting AssetSync API Tests');
  console.log('================================\n');
  
  // Test health endpoint
  await testHealthEndpoint();
  
  // Test authentication flow
  let authSuccess = await testUserRegistration();
  if (!authSuccess) {
    authSuccess = await testUserLogin();
  }
  
  if (!authSuccess) {
    console.log('❌ Authentication failed, cannot continue tests');
    return;
  }
  
  // Test user profile
  await testGetUserProfile();
  
  // Test categories
  const categoryId = await testListCategories();
  
  // Test assets
  const assetId = await testCreateAsset(categoryId);
  await testListAssets();
  await testAssetStats();
  await testGetAsset(assetId);
  
  console.log('\n🎉 API Tests Completed!');
  console.log('================================');
}

// Run tests if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runTests().catch(console.error);
}

export { runTests };