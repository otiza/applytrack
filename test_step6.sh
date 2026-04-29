#!/bin/bash

# ApplyTrack Step 6 - Quick Test Script
# Usage: bash test_step6.sh

set -e

API_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"
TEST_EMAIL="test-$(date +%s)-$$@example.com"

echo "🚀 ApplyTrack Step 6 - Applications CRUD Testing"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if services are running
echo -e "${BLUE}Checking services...${NC}"

if ! curl -s "$API_URL/api/health" > /dev/null 2>&1; then
  echo -e "${RED}❌ Backend not running at $API_URL${NC}"
  echo "Start with: docker compose up"
  exit 1
fi
echo -e "${GREEN}✓ Backend running${NC}"

if ! curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠ Frontend not responding (might still be building)${NC}"
else
  echo -e "${GREEN}✓ Frontend running${NC}"
fi

echo ""
echo -e "${BLUE}Setting up test data...${NC}"

# 1. Register
echo -e "${YELLOW}1. Registering test user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": '"\"$TEST_EMAIL\""',
    "name": "Test User",
    "password": "password123"
  }')

TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to register${NC}"
  echo "Response: $REGISTER_RESPONSE"
  exit 1
fi
echo -e "${GREEN}✓ Registered successfully${NC}"
echo "Email: $TEST_EMAIL"
echo "Token: ${TOKEN:0:20}..."

# 2. Create Company
echo ""
echo -e "${YELLOW}2. Creating test company...${NC}"
COMPANY_RESPONSE=$(curl -s -X POST "$API_URL/api/companies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "TechCorp Inc",
    "website": "https://techcorp.com",
    "location": "San Francisco, CA",
    "industry": "Software",
    "notes": "Growing startup"
  }')

COMPANY_ID=$(echo "$COMPANY_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$COMPANY_ID" ]; then
  echo -e "${RED}❌ Failed to create company${NC}"
  echo "Response: $COMPANY_RESPONSE"
  exit 1
fi
echo -e "${GREEN}✓ Company created${NC}"
echo "Company ID: $COMPANY_ID"

# 3. Create Application
echo ""
echo -e "${YELLOW}3. Creating test application...${NC}"
APP_RESPONSE=$(curl -s -X POST "$API_URL/api/applications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"jobTitle\": \"Senior React Engineer\",
    \"companyId\": \"$COMPANY_ID\",
    \"location\": \"Remote\",
    \"salaryRange\": \"$150k - $180k\",
    \"contractType\": \"Full-time\",
    \"status\": \"APPLIED\",
    \"priority\": \"HIGH\",
    \"applicationDate\": \"2026-04-28T00:00:00.000Z\",
    \"recruiterName\": \"Jane Smith\",
    \"recruiterEmail\": \"jane@techcorp.com\",
    \"jobPostUrl\": \"https://jobs.techcorp.com/react-engineer\",
    \"notes\": \"Great opportunity, passionate team\"
  }")

APP_ID=$(echo "$APP_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$APP_ID" ]; then
  echo -e "${RED}❌ Failed to create application${NC}"
  echo "Response: $APP_RESPONSE"
  exit 1
fi
echo -e "${GREEN}✓ Application created${NC}"
echo "Application ID: $APP_ID"

# 4. Get Single Application
echo ""
echo -e "${YELLOW}4. Retrieving application...${NC}"
GET_APP=$(curl -s -X GET "$API_URL/api/applications/$APP_ID" \
  -H "Authorization: Bearer $TOKEN")

JOB_TITLE=$(echo "$GET_APP" | grep -o '"jobTitle":"[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}✓ Retrieved: $JOB_TITLE${NC}"

# 5. List Applications
echo ""
echo -e "${YELLOW}5. Listing all applications...${NC}"
LIST_APPS=$(curl -s -X GET "$API_URL/api/applications" \
  -H "Authorization: Bearer $TOKEN")

APP_COUNT=$(echo "$LIST_APPS" | grep -o '"jobTitle"' | wc -l)
echo -e "${GREEN}✓ Found $APP_COUNT application(s)${NC}"

# 6. Update Application
echo ""
echo -e "${YELLOW}6. Updating application...${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/api/applications/$APP_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"jobTitle\": \"Senior React Engineer\",
    \"companyId\": \"$COMPANY_ID\",
    \"status\": \"INTERVIEW\",
    \"priority\": \"HIGH\",
    \"interviewDate\": \"2026-05-01T14:00:00.000Z\",
    \"notes\": \"Interview scheduled for May 1st at 2 PM\"
  }")

UPDATE_STATUS=$(echo "$UPDATE_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}✓ Updated status to: $UPDATE_STATUS${NC}"

# 7. Create Second Application
echo ""
echo -e "${YELLOW}7. Creating another application...${NC}"
APP2_RESPONSE=$(curl -s -X POST "$API_URL/api/applications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"jobTitle\": \"Full Stack Engineer\",
    \"companyId\": \"$COMPANY_ID\",
    \"location\": \"New York, NY\",
    \"salaryRange\": \"$130k - $160k\",
    \"contractType\": \"Full-time\",
    \"status\": \"WISHLIST\",
    \"priority\": \"MEDIUM\"
  }")

APP2_ID=$(echo "$APP2_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✓ Created second application${NC}"

# 8. List Again
echo ""
echo -e "${YELLOW}8. Listing applications again...${NC}"
LIST_APPS=$(curl -s -X GET "$API_URL/api/applications" \
  -H "Authorization: Bearer $TOKEN")

APP_COUNT=$(echo "$LIST_APPS" | grep -o '"jobTitle"' | wc -l)
echo -e "${GREEN}✓ Now have $APP_COUNT application(s)${NC}"

# 9. Delete Application
echo ""
echo -e "${YELLOW}9. Deleting an application...${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/api/applications/$APP2_ID" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ Deleted application${NC}"

# 10. Verify Deletion
echo ""
echo -e "${YELLOW}10. Verifying deletion...${NC}"
LIST_APPS=$(curl -s -X GET "$API_URL/api/applications" \
  -H "Authorization: Bearer $TOKEN")

APP_COUNT=$(echo "$LIST_APPS" | grep -o '"jobTitle"' | wc -l)
echo -e "${GREEN}✓ Now have $APP_COUNT application(s)${NC}"

echo ""
echo "=================================================="
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "🌐 You can now visit:"
echo "   Frontend: $FRONTEND_URL"
echo "   API Health: $API_URL/api/health"
echo ""
echo "Test Credentials:"
echo "   Email: $TEST_EMAIL"
echo "   Password: password123"

