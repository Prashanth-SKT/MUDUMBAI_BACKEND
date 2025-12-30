#!/bin/bash

# Process API Test Script
# Tests the new process API with complex step structure including validations and routing

BASE_URL="http://localhost:5000/api"
DB_NAME="jayram"
APP_NAME="Rama2"

echo "==============================================="
echo "Process API Test Script"
echo "==============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Create Process with Auto-generated ID
echo -e "${YELLOW}Test 1: Create Process (Auto-generated ID)${NC}"
echo "POST ${BASE_URL}/processes/${DB_NAME}/${APP_NAME}"
echo ""

CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/processes/${DB_NAME}/${APP_NAME}" \
  -H "Content-Type: application/json" \
  -d '{
    "id": null,
    "name": "Onboarding",
    "description": "Employee onboarding process with validation and routing",
    "appName": "Rama2",
    "status": "draft",
    "steps": [
      {
        "id": "step_1767082778281",
        "label": "Capture",
        "description": "Capture the information",
        "order": 1,
        "preValidation": {
          "validationId": null,
          "validationJSON": null,
          "onTrue": "continue",
          "onTrueTargetStepId": null,
          "onTrueTargetStepLabel": null,
          "onTrueTargetProcessId": null,
          "onFalse": "exit",
          "onFalseTargetStepId": null,
          "onFalseTargetStepLabel": null,
          "onFalseTargetProcessId": null,
          "preActions": []
        },
        "content": {
          "type": "none",
          "contentId": null,
          "contentJSON": null
        },
        "postValidation": {
          "validationId": null,
          "validationJSON": null,
          "routing": {
            "onTrue": {
              "action": "continue",
              "targetStepId": null,
              "targetStepLabel": null,
              "targetProcessId": null
            },
            "onFalse": {
              "action": "exit",
              "targetStepId": null,
              "targetStepLabel": null,
              "targetProcessId": null
            }
          },
          "postActions": []
        }
      },
      {
        "id": "step_1767083298943",
        "label": "Review",
        "description": "Review",
        "order": 2,
        "preValidation": {
          "validationId": null,
          "validationJSON": null,
          "onTrue": "continue",
          "onTrueTargetStepId": null,
          "onTrueTargetStepLabel": null,
          "onTrueTargetProcessId": null,
          "onFalse": "exit",
          "onFalseTargetStepId": null,
          "onFalseTargetStepLabel": null,
          "onFalseTargetProcessId": null,
          "preActions": []
        },
        "content": {
          "type": "none",
          "contentId": null,
          "contentJSON": null
        },
        "postValidation": {
          "validationId": "TEMPLATE_1767035858335",
          "validationJSON": {
            "id": "TEMPLATE_1767035858335",
            "ruleCategory": "VALIDATION",
            "appName": "rama2",
            "validationType": "WEEKEND_ONLY",
            "errorMessage": "Not a weekend",
            "description": "Template validation: Weekend Only (Sat-Sun)",
            "type": "template",
            "version": "1.0.0",
            "name": "onlyifWeekend",
            "status": "ACTIVE"
          },
          "routing": {
            "onTrue": {
              "action": "jumpToStep",
              "targetStepId": null,
              "targetStepLabel": "Approve",
              "targetProcessId": null
            },
            "onFalse": {
              "action": "jumpToStep",
              "targetStepId": null,
              "targetStepLabel": "Reject",
              "targetProcessId": null
            }
          },
          "postActions": []
        }
      },
      {
        "id": "step_1767083411002",
        "label": "Approve",
        "description": "Approved",
        "order": 3,
        "preValidation": {
          "validationId": "RULE_1767036145538",
          "validationJSON": {
            "id": "RULE_1767036145538",
            "ruleCategory": "BUSINESS_RULE",
            "appName": "rama2",
            "errorMessage": "Not eligible or Authorized",
            "description": "",
            "type": "business_rule",
            "version": "1.0.0",
            "name": "BRule1",
            "conditions": [
              {
                "operator": "CONTAINS",
                "value": "Operations",
                "logicalOperator": "IF",
                "id": 1,
                "field": "department",
                "collection": "emp"
              }
            ],
            "status": "ACTIVE"
          },
          "onTrue": "continue",
          "onTrueTargetStepId": null,
          "onTrueTargetStepLabel": null,
          "onTrueTargetProcessId": null,
          "onFalse": "exit",
          "onFalseTargetStepId": null,
          "onFalseTargetStepLabel": null,
          "onFalseTargetProcessId": null,
          "preActions": []
        },
        "content": {
          "type": "none",
          "contentId": null,
          "contentJSON": null
        },
        "postValidation": {
          "validationId": null,
          "validationJSON": null,
          "routing": {
            "onTrue": {
              "action": "continue",
              "targetStepId": null,
              "targetStepLabel": null,
              "targetProcessId": null
            },
            "onFalse": {
              "action": "exit",
              "targetStepId": null,
              "targetStepLabel": null,
              "targetProcessId": null
            }
          },
          "postActions": []
        }
      },
      {
        "id": "step_1767083460689",
        "label": "Reject",
        "description": "Rejected",
        "order": 4,
        "preValidation": {
          "validationId": null,
          "validationJSON": null,
          "onTrue": "continue",
          "onTrueTargetStepId": null,
          "onTrueTargetStepLabel": null,
          "onTrueTargetProcessId": null,
          "onFalse": "exit",
          "onFalseTargetStepId": null,
          "onFalseTargetStepLabel": null,
          "onFalseTargetProcessId": null,
          "preActions": []
        },
        "content": {
          "type": "none",
          "contentId": null,
          "contentJSON": null
        },
        "postValidation": {
          "validationId": null,
          "validationJSON": null,
          "routing": {
            "onTrue": {
              "action": "continue",
              "targetStepId": null,
              "targetStepLabel": null,
              "targetProcessId": null
            },
            "onFalse": {
              "action": "exit",
              "targetStepId": null,
              "targetStepLabel": null,
              "targetProcessId": null
            }
          },
          "postActions": []
        }
      }
    ],
    "finalActions": [],
    "version": 1
  }')

echo "Response:"
echo "$CREATE_RESPONSE" | jq '.'
echo ""

# Extract process ID from response
PROCESS_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')

if [ "$PROCESS_ID" != "null" ] && [ -n "$PROCESS_ID" ]; then
  echo -e "${GREEN}✓ Process created successfully with ID: ${PROCESS_ID}${NC}"
else
  echo -e "${RED}✗ Failed to create process${NC}"
  exit 1
fi

echo ""
echo "==============================================="
echo ""

# Test 2: Get All Processes
echo -e "${YELLOW}Test 2: Get All Processes${NC}"
echo "GET ${BASE_URL}/processes/${DB_NAME}/${APP_NAME}"
echo ""

LIST_RESPONSE=$(curl -s -X GET "${BASE_URL}/processes/${DB_NAME}/${APP_NAME}")
echo "Response:"
echo "$LIST_RESPONSE" | jq '.'

PROCESS_COUNT=$(echo "$LIST_RESPONSE" | jq '. | length')
echo ""
echo -e "${GREEN}✓ Retrieved ${PROCESS_COUNT} process(es)${NC}"
echo ""
echo "==============================================="
echo ""

# Test 3: Get Process by ID
echo -e "${YELLOW}Test 3: Get Process by ID${NC}"
echo "GET ${BASE_URL}/processes/${DB_NAME}/${APP_NAME}/${PROCESS_ID}"
echo ""

GET_RESPONSE=$(curl -s -X GET "${BASE_URL}/processes/${DB_NAME}/${APP_NAME}/${PROCESS_ID}")
echo "Response:"
echo "$GET_RESPONSE" | jq '.'

GET_ID=$(echo "$GET_RESPONSE" | jq -r '.id')
if [ "$GET_ID" == "$PROCESS_ID" ]; then
  echo ""
  echo -e "${GREEN}✓ Successfully retrieved process${NC}"
else
  echo ""
  echo -e "${RED}✗ Failed to retrieve process${NC}"
fi

echo ""
echo "==============================================="
echo ""

# Test 4: Update Process
echo -e "${YELLOW}Test 4: Update Process${NC}"
echo "PUT ${BASE_URL}/processes/${DB_NAME}/${APP_NAME}/${PROCESS_ID}"
echo ""

UPDATE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/processes/${DB_NAME}/${APP_NAME}/${PROCESS_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Onboarding Updated",
    "description": "Updated employee onboarding process",
    "status": "active",
    "steps": [
      {
        "id": "step_1767082778281",
        "label": "Capture Updated",
        "description": "Capture employee information",
        "order": 1,
        "preValidation": {
          "validationId": null,
          "validationJSON": null,
          "onTrue": "continue",
          "onFalse": "exit",
          "preActions": []
        },
        "content": {
          "type": "form",
          "contentId": "employee_form",
          "contentJSON": null
        },
        "postValidation": {
          "validationId": null,
          "validationJSON": null,
          "routing": {
            "onTrue": {
              "action": "continue",
              "targetStepId": null,
              "targetStepLabel": null,
              "targetProcessId": null
            },
            "onFalse": {
              "action": "exit",
              "targetStepId": null,
              "targetStepLabel": null,
              "targetProcessId": null
            }
          },
          "postActions": []
        }
      }
    ],
    "finalActions": []
  }')

echo "Response:"
echo "$UPDATE_RESPONSE" | jq '.'

UPDATE_VERSION=$(echo "$UPDATE_RESPONSE" | jq -r '.version')
if [ "$UPDATE_VERSION" -gt "1" ]; then
  echo ""
  echo -e "${GREEN}✓ Process updated successfully. New version: ${UPDATE_VERSION}${NC}"
else
  echo ""
  echo -e "${RED}✗ Failed to update process${NC}"
fi

echo ""
echo "==============================================="
echo ""

# Test 5: Delete Process
echo -e "${YELLOW}Test 5: Delete Process${NC}"
echo "DELETE ${BASE_URL}/processes/${DB_NAME}/${APP_NAME}/${PROCESS_ID}"
echo ""

DELETE_RESPONSE=$(curl -s -X DELETE "${BASE_URL}/processes/${DB_NAME}/${APP_NAME}/${PROCESS_ID}")
echo "Response:"
echo "$DELETE_RESPONSE" | jq '.'

DELETE_MSG=$(echo "$DELETE_RESPONSE" | jq -r '.message')
if [[ "$DELETE_MSG" == *"deleted successfully"* ]]; then
  echo ""
  echo -e "${GREEN}✓ Process deleted successfully${NC}"
else
  echo ""
  echo -e "${RED}✗ Failed to delete process${NC}"
fi

echo ""
echo "==============================================="
echo ""
echo -e "${GREEN}All tests completed!${NC}"
echo ""

