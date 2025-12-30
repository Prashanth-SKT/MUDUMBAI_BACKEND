#!/bin/bash

# Asset Management API Test Script
# Run this after enabling Firebase Storage

BASE_URL="http://localhost:5000/api"
APP_ID="sample"
USER_ID="test-user-123"

echo "========================================="
echo "Asset Management API Test Suite"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create a test file
echo "Creating test files..."
echo "This is a test text file for asset upload" > /tmp/test-asset.txt
echo "Test image content" > /tmp/test-image.png
echo ""

# Test 1: Upload Text File
echo -e "${YELLOW}Test 1: Upload Text File${NC}"
echo "POST $BASE_URL/assets/upload"
UPLOAD_RESPONSE=$(curl -s -X POST $BASE_URL/assets/upload \
  -F "file=@/tmp/test-asset.txt" \
  -F "appId=$APP_ID" \
  -F "description=Test text file upload" \
  -F "uploadedBy=$USER_ID")

echo "$UPLOAD_RESPONSE" | jq '.'

if echo "$UPLOAD_RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✓ Upload successful${NC}"
    ASSET_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.id')
    echo "Asset ID: $ASSET_ID"
else
    echo -e "${RED}✗ Upload failed${NC}"
    echo "Error: $(echo "$UPLOAD_RESPONSE" | jq -r '.message')"
fi
echo ""
echo "========================================="
echo ""

# Test 2: List Assets
echo -e "${YELLOW}Test 2: List All Assets for App${NC}"
echo "GET $BASE_URL/assets/$APP_ID"
LIST_RESPONSE=$(curl -s -X GET $BASE_URL/assets/$APP_ID)

echo "$LIST_RESPONSE" | jq '.'

if echo "$LIST_RESPONSE" | jq -e '.success == true' > /dev/null; then
    ASSET_COUNT=$(echo "$LIST_RESPONSE" | jq -r '.data.count')
    echo -e "${GREEN}✓ List successful - Found $ASSET_COUNT assets${NC}"
else
    echo -e "${RED}✗ List failed${NC}"
fi
echo ""
echo "========================================="
echo ""

# Test 3: Get Single Asset (if we have an asset ID)
if [ ! -z "$ASSET_ID" ]; then
    echo -e "${YELLOW}Test 3: Get Single Asset${NC}"
    echo "GET $BASE_URL/assets/$APP_ID/$ASSET_ID"
    GET_RESPONSE=$(curl -s -X GET $BASE_URL/assets/$APP_ID/$ASSET_ID)
    
    echo "$GET_RESPONSE" | jq '.'
    
    if echo "$GET_RESPONSE" | jq -e '.success == true' > /dev/null; then
        echo -e "${GREEN}✓ Get asset successful${NC}"
    else
        echo -e "${RED}✗ Get asset failed${NC}"
    fi
    echo ""
    echo "========================================="
    echo ""
fi

# Test 4: Update Asset Metadata
if [ ! -z "$ASSET_ID" ]; then
    echo -e "${YELLOW}Test 4: Update Asset Metadata${NC}"
    echo "PATCH $BASE_URL/assets/$APP_ID/$ASSET_ID"
    UPDATE_RESPONSE=$(curl -s -X PATCH $BASE_URL/assets/$APP_ID/$ASSET_ID \
      -H "Content-Type: application/json" \
      -d '{
        "description": "Updated description via API test",
        "name": "Updated Test File",
        "visible": true
      }')
    
    echo "$UPDATE_RESPONSE" | jq '.'
    
    if echo "$UPDATE_RESPONSE" | jq -e '.success == true' > /dev/null; then
        echo -e "${GREEN}✓ Update successful${NC}"
    else
        echo -e "${RED}✗ Update failed${NC}"
    fi
    echo ""
    echo "========================================="
    echo ""
fi

# Test 5: Get Signed URL
if [ ! -z "$ASSET_ID" ]; then
    ASSET_PATH=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.path')
    if [ ! -z "$ASSET_PATH" ] && [ "$ASSET_PATH" != "null" ]; then
        echo -e "${YELLOW}Test 5: Get Signed URL${NC}"
        echo "POST $BASE_URL/assets/signed-url"
        SIGNED_URL_RESPONSE=$(curl -s -X POST $BASE_URL/assets/signed-url \
          -H "Content-Type: application/json" \
          -d "{
            \"path\": \"$ASSET_PATH\",
            \"expiresIn\": 60
          }")
        
        echo "$SIGNED_URL_RESPONSE" | jq '.'
        
        if echo "$SIGNED_URL_RESPONSE" | jq -e '.success == true' > /dev/null; then
            echo -e "${GREEN}✓ Signed URL generated${NC}"
        else
            echo -e "${RED}✗ Signed URL generation failed${NC}"
        fi
        echo ""
        echo "========================================="
        echo ""
    fi
fi

# Test 6: Upload Image File
echo -e "${YELLOW}Test 6: Upload Image File${NC}"
echo "POST $BASE_URL/assets/upload"
IMAGE_UPLOAD_RESPONSE=$(curl -s -X POST $BASE_URL/assets/upload \
  -F "file=@/tmp/test-image.png" \
  -F "appId=$APP_ID" \
  -F "description=Test image upload" \
  -F "uploadedBy=$USER_ID")

echo "$IMAGE_UPLOAD_RESPONSE" | jq '.'

if echo "$IMAGE_UPLOAD_RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✓ Image upload successful${NC}"
    IMAGE_ASSET_ID=$(echo "$IMAGE_UPLOAD_RESPONSE" | jq -r '.data.id')
else
    echo -e "${RED}✗ Image upload failed${NC}"
fi
echo ""
echo "========================================="
echo ""

# Test 7: Delete Asset (cleanup)
if [ ! -z "$ASSET_ID" ]; then
    echo -e "${YELLOW}Test 7: Delete Asset (Cleanup)${NC}"
    echo "DELETE $BASE_URL/assets/$APP_ID/$ASSET_ID"
    DELETE_RESPONSE=$(curl -s -X DELETE $BASE_URL/assets/$APP_ID/$ASSET_ID)
    
    echo "$DELETE_RESPONSE" | jq '.'
    
    if echo "$DELETE_RESPONSE" | jq -e '.success == true' > /dev/null; then
        echo -e "${GREEN}✓ Delete successful${NC}"
    else
        echo -e "${RED}✗ Delete failed${NC}"
    fi
    echo ""
    echo "========================================="
    echo ""
fi

# Final asset count
echo -e "${YELLOW}Final Asset Count${NC}"
echo "GET $BASE_URL/assets/$APP_ID"
FINAL_LIST=$(curl -s -X GET $BASE_URL/assets/$APP_ID)
FINAL_COUNT=$(echo "$FINAL_LIST" | jq -r '.data.count')
echo "Total assets in app '$APP_ID': $FINAL_COUNT"
echo ""

# Cleanup
rm -f /tmp/test-asset.txt /tmp/test-image.png

echo "========================================="
echo -e "${GREEN}Test suite completed!${NC}"
echo "========================================="




