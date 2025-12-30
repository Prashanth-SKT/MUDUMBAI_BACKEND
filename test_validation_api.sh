#!/bin/bash

# ============================================================================
# Validation API Test Script
# ============================================================================
# Base URL
BASE_URL="http://localhost:5000"
DB_NAME="jayram"
APP_NAME="testApp"

echo "============================================"
echo "🧪 Testing Validation API Endpoints"
echo "============================================"
echo ""

# ============================================================================
# 1. GET ALL VALIDATIONS BY APP
# ============================================================================
echo "📋 1. GET All Validations for App: $APP_NAME"
echo "Endpoint: GET /api/validations/:dbName/:appName"
echo "--------------------------------------------"
curl -s -X GET "$BASE_URL/api/validations/$DB_NAME/$APP_NAME" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"
echo ""
echo ""

# ============================================================================
# 2. CREATE A NEW VALIDATION
# ============================================================================
echo "➕ 2. CREATE New Validation"
echo "Endpoint: POST /api/validations/:dbName/:appName"
echo "--------------------------------------------"
VALIDATION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/validations/$DB_NAME/$APP_NAME" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Phone Number Validation",
    "type": "phone",
    "description": "Validates phone number format",
    "rules": {
      "pattern": "^[0-9]{10}$",
      "minLength": 10,
      "maxLength": 10,
      "required": true
    }
  }' \
  -w "\nHTTP_STATUS:%{http_code}")

# Extract validation ID from response
VALIDATION_ID=$(echo "$VALIDATION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "$VALIDATION_RESPONSE" | grep -v "HTTP_STATUS"
HTTP_STATUS=$(echo "$VALIDATION_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
echo "HTTP Status: $HTTP_STATUS"
echo ""
echo "Created Validation ID: $VALIDATION_ID"
echo ""
echo ""

# ============================================================================
# 3. GET SINGLE VALIDATION BY ID
# ============================================================================
echo "🔍 3. GET Single Validation by ID"
echo "Endpoint: GET /api/validations/:dbName/:appName/:id"
echo "--------------------------------------------"
if [ -n "$VALIDATION_ID" ]; then
  curl -s -X GET "$BASE_URL/api/validations/$DB_NAME/$APP_NAME/$VALIDATION_ID" \
    -H "Content-Type: application/json" \
    -w "\nHTTP Status: %{http_code}\n\n"
else
  echo "No validation ID available to test"
fi
echo ""
echo ""

# ============================================================================
# 4. UPDATE VALIDATION
# ============================================================================
echo "✏️ 4. UPDATE Validation"
echo "Endpoint: PUT /api/validations/:dbName/:appName/:id"
echo "--------------------------------------------"
if [ -n "$VALIDATION_ID" ]; then
  curl -s -X PUT "$BASE_URL/api/validations/$DB_NAME/$APP_NAME/$VALIDATION_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Phone Number Validation (Updated)",
      "description": "Validates Indian phone number format",
      "rules": {
        "pattern": "^[6-9][0-9]{9}$",
        "minLength": 10,
        "maxLength": 10,
        "required": true
      }
    }' \
    -w "\nHTTP Status: %{http_code}\n\n"
else
  echo "No validation ID available to test"
fi
echo ""
echo ""

# ============================================================================
# 5. GET ALL VALIDATIONS (After Creation)
# ============================================================================
echo "📋 5. GET All Validations (After Creation)"
echo "Endpoint: GET /api/validations/:dbName/:appName"
echo "--------------------------------------------"
curl -s -X GET "$BASE_URL/api/validations/$DB_NAME/$APP_NAME" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"
echo ""
echo ""

# ============================================================================
# 6. DELETE VALIDATION
# ============================================================================
echo "🗑️ 6. DELETE Validation"
echo "Endpoint: DELETE /api/validations/:dbName/:appName/:id"
echo "--------------------------------------------"
if [ -n "$VALIDATION_ID" ]; then
  curl -s -X DELETE "$BASE_URL/api/validations/$DB_NAME/$APP_NAME/$VALIDATION_ID" \
    -H "Content-Type: application/json" \
    -w "\nHTTP Status: %{http_code}\n\n"
else
  echo "No validation ID available to test"
fi
echo ""
echo ""

# ============================================================================
# 7. VERIFY DELETION
# ============================================================================
echo "✅ 7. VERIFY Deletion (Should return 404)"
echo "Endpoint: GET /api/validations/:dbName/:appName/:id"
echo "--------------------------------------------"
if [ -n "$VALIDATION_ID" ]; then
  curl -s -X GET "$BASE_URL/api/validations/$DB_NAME/$APP_NAME/$VALIDATION_ID" \
    -H "Content-Type: application/json" \
    -w "\nHTTP Status: %{http_code}\n\n"
else
  echo "No validation ID available to test"
fi
echo ""
echo ""

# ============================================================================
# TESTING WITH DIFFERENT APP NAMES
# ============================================================================
echo "============================================"
echo "🔄 Testing with Different App Names"
echo "============================================"
echo ""

for APP in "Rama2" "MyApp" "Test App"; do
  echo "📱 Testing App: $APP"
  echo "--------------------------------------------"
  curl -s -X GET "$BASE_URL/api/validations/$DB_NAME/$APP" \
    -H "Content-Type: application/json" \
    -w "\nHTTP Status: %{http_code}\n"
  echo ""
  echo ""
done

echo "============================================"
echo "✅ All Tests Completed!"
echo "============================================"




