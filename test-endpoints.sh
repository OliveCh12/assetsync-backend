#!/bin/bash

# Quick endpoint test script for AssetSync API
BASE_URL="http://localhost:3001/api/v1"

echo "🚀 Testing AssetSync API Endpoints"
echo "=================================="

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s "$BASE_URL/../" | jq -r '.status // "Failed"'

# Test register endpoint
echo "2. Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "firstName": "Test",
    "lastName": "User",
    "type": "personal"
  }')

echo "Registration response: $(echo $REGISTER_RESPONSE | jq -r '.success // "Failed"')"

# Extract token if registration succeeded
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken // empty')

if [ -n "$TOKEN" ]; then
  echo "✅ Got auth token"
  
  # Test categories endpoint
  echo "3. Testing categories endpoint..."
  CATEGORIES_RESPONSE=$(curl -s "$BASE_URL/categories" | jq -r '.success // "Failed"')
  echo "Categories response: $CATEGORIES_RESPONSE"
  
  # Get first category ID
  CATEGORY_ID=$(curl -s "$BASE_URL/categories" | jq -r '.data[0].id // empty')
  
  if [ -n "$CATEGORY_ID" ]; then
    echo "✅ Got category ID: $CATEGORY_ID"
    
    # Test create asset
    echo "4. Testing create asset endpoint..."
    ASSET_RESPONSE=$(curl -s -X POST "$BASE_URL/assets" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"name\": \"Test Laptop\",
        \"description\": \"A test laptop for API testing\",
        \"brand\": \"TestBrand\",
        \"model\": \"TestModel-2024\",
        \"categoryId\": \"$CATEGORY_ID\",
        \"purchasePrice\": \"1200.50\",
        \"purchaseDate\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
        \"condition\": \"excellent\"
      }")
    
    echo "Asset creation: $(echo $ASSET_RESPONSE | jq -r '.success // "Failed"')"
    
    # Test list assets
    echo "5. Testing list assets endpoint..."
    LIST_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/assets" | jq -r '.success // "Failed"')
    echo "List assets: $LIST_RESPONSE"
    
    # Test asset stats
    echo "6. Testing asset stats endpoint..."
    STATS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/assets/stats" | jq -r '.success // "Failed"')
    echo "Asset stats: $STATS_RESPONSE"
    
  else
    echo "❌ No category ID found, skipping asset tests"
  fi
  
else
  echo "❌ No auth token, trying login..."
  
  # Try login instead
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "testpassword123"
    }')
  
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.tokens.accessToken // empty')
  
  if [ -n "$TOKEN" ]; then
    echo "✅ Login successful, got token"
    
    # Test list assets after login
    echo "3. Testing list assets after login..."
    LIST_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/assets" | jq -r '.success // "Failed"')
    echo "List assets: $LIST_RESPONSE"
  else
    echo "❌ Login failed"
  fi
fi

echo "=================================="
echo "🎯 API endpoint tests completed!"