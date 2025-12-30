#!/bin/bash

# Data Management API - cURL Testing Script
# Complete end-to-end testing with the "sample" app

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:5000/api"
APP_ID="sample"
APP_PREFIX="sample"
USER_ID="zCfe1a96aLQON7KF9smnemHiJKu1"

# Variables to store IDs
SCHEMA_ID=""
RECORD_ID=""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Data Management API - cURL Test${NC}"
echo -e "${BLUE}  Testing with app: ${APP_ID}${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to print section headers
print_section() {
    echo -e "\n${GREEN}========================================"
    echo -e "$1"
    echo -e "========================================${NC}\n"
}

# Function to print commands
print_command() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# Function to wait for user
wait_for_user() {
    echo -e "\n${BLUE}Press Enter to continue...${NC}"
    read
}

# Test 1: Health Check
print_section "TEST 1: Health Check"
print_command "curl $BASE_URL/../health"
curl -s $BASE_URL/../health | jq '.'
wait_for_user

# Test 2: Create Table Schema
print_section "TEST 2: Create Table Schema (Products)"
print_command "POST $BASE_URL/data-schemas/create"
RESPONSE=$(curl -s -X POST $BASE_URL/data-schemas/create \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "displayName": "Products",
    "userId": "'$USER_ID'",
    "fields": [
      {
        "name": "productName",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "name": "price",
        "type": "currency",
        "required": true,
        "options": []
      },
      {
        "name": "description",
        "type": "textarea",
        "required": false,
        "options": []
      },
      {
        "name": "category",
        "type": "select",
        "required": true,
        "options": ["Electronics", "Clothing", "Food", "Books"]
      },
      {
        "name": "inStock",
        "type": "boolean",
        "required": true,
        "options": []
      },
      {
        "name": "rating",
        "type": "rating",
        "required": false,
        "options": []
      }
    ]
  }')

echo "$RESPONSE" | jq '.'

# Extract schemaId
SCHEMA_ID=$(echo "$RESPONSE" | jq -r '.data.schemaId')
echo -e "\n${GREEN}✓ Schema ID: $SCHEMA_ID${NC}"
wait_for_user

# Test 3: List All Schemas
print_section "TEST 3: List All Table Schemas"
print_command "GET $BASE_URL/data-schemas/$APP_ID?appPrefix=$APP_PREFIX"
curl -s "$BASE_URL/data-schemas/$APP_ID?appPrefix=$APP_PREFIX" | jq '.'
wait_for_user

# Test 4: Get Single Schema
print_section "TEST 4: Get Single Table Schema"
print_command "GET $BASE_URL/data-schemas/$APP_ID/$SCHEMA_ID?appPrefix=$APP_PREFIX"
curl -s "$BASE_URL/data-schemas/$APP_ID/$SCHEMA_ID?appPrefix=$APP_PREFIX" | jq '.'
wait_for_user

# Test 5: Create Single Record
print_section "TEST 5: Create Single Record"
print_command "POST $BASE_URL/data-records/create"
RESPONSE=$(curl -s -X POST $BASE_URL/data-records/create \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "schemaId": "'$SCHEMA_ID'",
    "userId": "'$USER_ID'",
    "data": {
      "productName": "Laptop Pro 15",
      "price": 1299.99,
      "description": "High-performance laptop with 16GB RAM and 512GB SSD",
      "category": "Electronics",
      "inStock": true,
      "rating": 5
    }
  }')

echo "$RESPONSE" | jq '.'

# Extract recordId
RECORD_ID=$(echo "$RESPONSE" | jq -r '.data.id')
echo -e "\n${GREEN}✓ Record ID: $RECORD_ID${NC}"
wait_for_user

# Test 6: List Records
print_section "TEST 6: List Records (Paginated)"
print_command "GET $BASE_URL/data-records/list?appId=$APP_ID&appPrefix=$APP_PREFIX&schemaId=$SCHEMA_ID&page=1&pageSize=20"
curl -s "$BASE_URL/data-records/list?appId=$APP_ID&appPrefix=$APP_PREFIX&schemaId=$SCHEMA_ID&page=1&pageSize=20&sortBy=createdAt&sortOrder=desc" | jq '.'
wait_for_user

# Test 7: Update Record
print_section "TEST 7: Update Record"
print_command "PUT $BASE_URL/data-records/update/$RECORD_ID"
curl -s -X PUT $BASE_URL/data-records/update/$RECORD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "schemaId": "'$SCHEMA_ID'",
    "userId": "'$USER_ID'",
    "data": {
      "price": 1199.99,
      "description": "High-performance laptop with 16GB RAM and 512GB SSD - SALE!",
      "inStock": false
    }
  }' | jq '.'
wait_for_user

# Test 8: Validate Record (with errors)
print_section "TEST 8: Validate Record (should show errors)"
print_command "POST $BASE_URL/data-records/validate"
curl -s -X POST $BASE_URL/data-records/validate \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "schemaId": "'$SCHEMA_ID'",
    "data": {
      "productName": "",
      "price": -100,
      "category": "InvalidCategory",
      "rating": 10
    }
  }' | jq '.'
wait_for_user

# Test 9: Bulk Create Records
print_section "TEST 9: Bulk Create Records"
print_command "POST $BASE_URL/data-records/bulk-create"
curl -s -X POST $BASE_URL/data-records/bulk-create \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "schemaId": "'$SCHEMA_ID'",
    "userId": "'$USER_ID'",
    "records": [
      {
        "productName": "Wireless Mouse",
        "price": 29.99,
        "description": "Ergonomic wireless mouse with USB receiver",
        "category": "Electronics",
        "inStock": true,
        "rating": 4
      },
      {
        "productName": "Cotton T-Shirt",
        "price": 19.99,
        "description": "100% cotton comfortable t-shirt",
        "category": "Clothing",
        "inStock": true,
        "rating": 4
      },
      {
        "productName": "JavaScript Guide",
        "price": 39.99,
        "description": "Complete guide to modern JavaScript",
        "category": "Books",
        "inStock": true,
        "rating": 5
      }
    ]
  }' | jq '.'
wait_for_user

# Test 10: List Records Again (should show all records)
print_section "TEST 10: List All Records (should show 4 records)"
print_command "GET $BASE_URL/data-records/list"
curl -s "$BASE_URL/data-records/list?appId=$APP_ID&appPrefix=$APP_PREFIX&schemaId=$SCHEMA_ID&page=1&pageSize=20" | jq '.'
wait_for_user

# Test 11: Search Records
print_section "TEST 11: Search Records (search for 'laptop')"
print_command "GET $BASE_URL/data-records/list?searchQuery=laptop"
curl -s "$BASE_URL/data-records/list?appId=$APP_ID&appPrefix=$APP_PREFIX&schemaId=$SCHEMA_ID&page=1&pageSize=20&searchQuery=laptop" | jq '.'
wait_for_user

# Test 12: Export CSV
print_section "TEST 12: Export to CSV"
print_command "GET $BASE_URL/data-records/export-csv"
echo -e "${YELLOW}Saving to exported_products.csv...${NC}"
curl -s "$BASE_URL/data-records/export-csv?appId=$APP_ID&appPrefix=$APP_PREFIX&schemaId=$SCHEMA_ID&includeSystemFields=true" \
  -o exported_products.csv
echo -e "${GREEN}✓ Saved to exported_products.csv${NC}"
echo -e "\n${YELLOW}First 5 lines of CSV:${NC}"
head -5 exported_products.csv
wait_for_user

# Test 13: Import CSV (create new table)
print_section "TEST 13: Import CSV (Create New Table)"
print_command "POST $BASE_URL/data-records/import-csv"

# Check if sample CSV exists
if [ ! -f "sample_users.csv" ]; then
    echo -e "${YELLOW}Creating sample_users.csv...${NC}"
    cat > sample_users.csv << 'EOF'
fullName,email,phone,role,status
Ramesh Kumar,ramesh@example.com,9876543210,Admin,Active
Sita Devi,sita@example.com,9123456789,Editor,Active
Arjun Rao,arjun@example.com,9988776655,Viewer,Inactive
Priya Sharma,priya@example.com,9111222333,Editor,Active
Vijay Reddy,vijay@example.com,9444555666,Viewer,Active
EOF
fi

CSV_RESPONSE=$(curl -s -X POST $BASE_URL/data-records/import-csv \
  -F "file=@sample_users.csv" \
  -F "appId=$APP_ID" \
  -F "appPrefix=$APP_PREFIX" \
  -F "userId=$USER_ID" \
  -F "createNewTable=true" \
  -F "displayName=Users")

echo "$CSV_RESPONSE" | jq '.'

# Extract new schema ID
USERS_SCHEMA_ID=$(echo "$CSV_RESPONSE" | jq -r '.data.schemaId')
echo -e "\n${GREEN}✓ Users Schema ID: $USERS_SCHEMA_ID${NC}"
wait_for_user

# Test 14: List All Schemas Again (should show 2 tables)
print_section "TEST 14: List All Table Schemas (should show 2 tables)"
print_command "GET $BASE_URL/data-schemas/$APP_ID"
curl -s "$BASE_URL/data-schemas/$APP_ID?appPrefix=$APP_PREFIX" | jq '.'
wait_for_user

# Test 15: Delete Single Record
print_section "TEST 15: Delete Single Record"
print_command "DELETE $BASE_URL/data-records/delete/$RECORD_ID"
curl -s -X DELETE $BASE_URL/data-records/delete/$RECORD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "schemaId": "'$SCHEMA_ID'"
  }' | jq '.'
wait_for_user

# Test 16: Try to delete table (should work - you're the owner)
print_section "TEST 16: Delete Table Schema"
print_command "DELETE $BASE_URL/data-schemas/$SCHEMA_ID"
echo -e "${YELLOW}This will delete the Products table and all its records.${NC}"
echo -e "${YELLOW}Press Enter to continue or Ctrl+C to skip...${NC}"
read

curl -s -X DELETE $BASE_URL/data-schemas/$SCHEMA_ID \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "'$APP_ID'",
    "appPrefix": "'$APP_PREFIX'",
    "userId": "'$USER_ID'",
    "confirmDelete": true
  }' | jq '.'

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  All Tests Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Summary:${NC}"
echo -e "✓ Created table schema (Products)"
echo -e "✓ Listed all schemas"
echo -e "✓ Created single record"
echo -e "✓ Updated record"
echo -e "✓ Validated record (with errors)"
echo -e "✓ Bulk created 3 records"
echo -e "✓ Listed and searched records"
echo -e "✓ Exported to CSV"
echo -e "✓ Imported CSV (Users table)"
echo -e "✓ Deleted record"
echo -e "✓ Deleted table schema"

echo -e "\n${BLUE}Generated Files:${NC}"
echo -e "- exported_products.csv (CSV export)"
echo -e "- sample_users.csv (sample data)"

echo -e "\n${GREEN}Testing Complete! 🎉${NC}\n"





