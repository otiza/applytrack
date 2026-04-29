# Step 6: Job Applications CRUD - Implementation Guide

## Overview

Step 6 implements full CRUD (Create, Read, Update, Delete) functionality for managing job applications in the ApplyTrack system.

## What Was Built

### Backend (Node.js + Express + TypeScript)

**New File: `src/routes/applications.ts`**

A complete REST API for applications with these endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/applications` | List user's applications |
| GET | `/api/applications/:id` | Get single application |
| POST | `/api/applications` | Create new application |
| PUT | `/api/applications/:id` | Update application |
| DELETE | `/api/applications/:id` | Delete application |

All endpoints:
- ✅ Require JWT authentication
- ✅ Filter data by user ID
- ✅ Validate input with Zod schemas
- ✅ Check company ownership before operations
- ✅ Return clear error messages

**Updated Files:**
- `prisma/schema.prisma` - Added new Application fields
- `src/app.ts` - Registered applications route
- `src/routes/companies.ts` - Updated with industry field

### Database Schema Updates

**New Application Fields:**

```typescript
jobTitle        String      // Job position title
location        String?     // Job location
salaryRange     String?     // Salary info (e.g., "$150k - $180k")
contractType    String?     // Employment type
status          Enum        // WISHLIST | APPLIED | INTERVIEW | TECHNICAL_TEST | OFFER | REJECTED
priority        Enum        // LOW | MEDIUM | HIGH
applicationDate DateTime?   // When application was submitted
interviewDate   DateTime?   // Scheduled interview date
notes           String?     // Internal notes
recruiterName   String?     // Recruiter contact name
recruiterEmail  String?     // Recruiter email
jobPostUrl      String?     // Link to job posting
```

**Relations:**
- Each Application belongs to a User
- Each Application belongs to a Company
- Each Application can have many Notes (through appNotes relation)

### Frontend (React + TypeScript)

**New File: `src/pages/Applications.tsx`**

A comprehensive React component implementing:

**Features:**
- ✅ Load applications and companies on mount
- ✅ Display applications in responsive grid layout
- ✅ Show status badges with color coding
- ✅ Show priority indicators
- ✅ Inline form for creating/editing
- ✅ Quick action buttons (Edit/Delete)
- ✅ Delete confirmation modal
- ✅ Error/success messages
- ✅ Loading states
- ✅ Empty state message
- ✅ Form validation on submit

**UI Components:**
- Header with title and add button
- Application cards with quick actions
- Modal form for create/edit
- Status badges (Wishlist, Applied, Interview, Technical Test, Offer, Rejected)
- Priority indicators (Low, Medium, High)
- Delete confirmation dialog

## Database Migration

**File: `prisma/migrations/20260428144500_refactor_application/migration.sql`**

Adds all new columns to the Application table:
- Drops old columns (title, role, appliedAt)
- Adds new columns with proper types
- Maintains foreign key constraints
- Preserves data integrity

## How to Test

### Quick Start (Docker Compose)

```bash
cd /home/tiza/WebstormProjects/applytrack

# Start all services
docker compose up --build

# Wait for services to be ready (~30 seconds)
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432

### Manual Testing Script

```bash
cd /home/tiza/WebstormProjects/applytrack
bash test_step6.sh
```

This script automatically:
1. Registers a test user
2. Creates a test company
3. Creates test applications
4. Tests all CRUD operations
5. Verifies data is correct

### Manual API Testing

**1. Get Authentication Token**

Register:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@example.com",
    "name": "Developer",
    "password": "password123"
  }'
```

Or login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@example.com",
    "password": "password123"
  }'
```

Save the returned `token`.

**2. Create a Company** (prerequisite for applications)

```bash
TOKEN="your_token_here"

curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Google",
    "website": "https://google.com",
    "location": "Mountain View, CA",
    "industry": "Technology"
  }'
```

Save the returned `company.id`.

**3. Create an Application**

```bash
COMPANY_ID="company_id_here"

curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "jobTitle": "Senior Engineer",
    "companyId": "'$COMPANY_ID'",
    "location": "Remote",
    "salaryRange": "$200k - $250k",
    "contractType": "Full-time",
    "status": "APPLIED",
    "priority": "HIGH",
    "applicationDate": "2026-04-28T10:00:00Z",
    "recruiterName": "Sarah Chen",
    "recruiterEmail": "sarah@google.com",
    "jobPostUrl": "https://careers.google.com/jobs/...",
    "notes": "Great fit for my background"
  }'
```

**4. Get All Applications**

```bash
curl -X GET http://localhost:3000/api/applications \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**5. Get Single Application**

```bash
APP_ID="app_id_here"

curl -X GET http://localhost:3000/api/applications/$APP_ID \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**6. Update an Application**

```bash
curl -X PUT http://localhost:3000/api/applications/$APP_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "jobTitle": "Senior Engineer",
    "companyId": "'$COMPANY_ID'",
    "status": "INTERVIEW",
    "interviewDate": "2026-05-10T14:00:00Z",
    "notes": "Interview scheduled with hiring manager"
  }'
```

**7. Delete an Application**

```bash
curl -X DELETE http://localhost:3000/api/applications/$APP_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Frontend Testing Workflow

1. **Navigate to frontend**: http://localhost:5173
2. **Register**: Create a new account (e.g., dev@test.com / password123)
3. **Go to Companies**: Add 2-3 test companies (Google, Microsoft, Amazon)
4. **Go to Applications**: 
   - Click "+ Add Application"
   - Fill in all fields
   - Select company from dropdown
   - Choose status and priority
   - Set dates
   - Click submit
5. **Verify card appears** with correct info and color badges
6. **Test Edit**: Click Edit, modify some fields, update
7. **Test Delete**: Click Delete, confirm in modal
8. **Try form validation**: Submit with empty required fields (should fail)

## Code Organization

```
backend/
├── src/
│   ├── routes/
│   │   └── applications.ts          ← NEW: All CRUD endpoints
│   ├── app.ts                       ← UPDATED: Register route
│   └── ...existing files
├── prisma/
│   ├── schema.prisma                ← UPDATED: New fields
│   └── migrations/
│       └── 20260428144500_*/        ← NEW: Database changes
└── ...

frontend/
└── src/
    ├── pages/
    │   └── Applications.tsx          ← NEW: Full CRUD UI
    └── ...existing files
```

## Key Design Decisions

### Backend

**Single Relation for Notes**
- Uses `appNotes: Note[]` on Application model
- Separate from the `notes: String?` field for quick notes
- Allows future expansion of the Notes system

**Zod Validation**
- All inputs validated with strict schemas
- Clear error messages for users
- Type safety through TypeScript

**User Isolation**
- Every query filters by `userId`
- Company ownership verified before operations
- Prevents cross-user data access

### Frontend

**State Management**
- React hooks (useState, useEffect)
- Local form state for create/edit
- Derived loading/empty states

**Component Structure**
- Single component handles all operations
- Form shown/hidden based on state
- Cards display current applications

**Styling**
- Tailwind CSS for consistency
- Responsive grid (1-2-3 columns)
- Color-coded badges for quick scanning
- Smooth transitions and hover effects

## Security Considerations

✅ **Authentication**: All routes require valid JWT token
✅ **Authorization**: Users can only access their own data
✅ **Input Validation**: Zod schemas validate all inputs
✅ **Referential Integrity**: Companies verified before operations
✅ **SQL Injection**: Safe through Prisma ORM
✅ **CORS**: Only allows frontend origin

## Error Handling

**Common Error Cases:**

| Case | Response | HTTP Status |
|------|----------|-------------|
| Missing token | 401 Unauthorized | 401 |
| Invalid token | 401 Unauthorized | 401 |
| Company not found | "Invalid company." | 400 |
| Application not found | "Application not found." | 404 |
| Invalid input | "Invalid input." + details | 400 |
| Server error | "Failed to..." | 500 |

## What's Next

### Step 7: Kanban Pipeline
- Drag-and-drop applications between status columns
- Visual overview of hiring pipeline
- Quick status updates

### Step 8: Dashboard Analytics
- Charts and metrics
- Applications by status
- Interview conversion rates
- Timeline statistics

### Step 9: Notes System
- Detailed notes per application
- Linked to application
- Timestamped entries

## Troubleshooting

**Applications not showing?**
- Ensure you're logged in
- Check DevTools Network tab for API errors
- Verify token is valid (login again if needed)

**Can't create application?**
- Create a company first
- Fill all required fields (jobTitle, companyId)
- Check browser console for validation errors

**Database errors?**
- Stop containers: `docker compose down`
- Remove data: `docker volume rm applytrack_postgres_data`
- Restart: `docker compose up --build`

## Files Summary

| File | Type | Status | Purpose |
|------|------|--------|---------|
| `src/routes/applications.ts` | New | ✅ Ready | REST API endpoints |
| `prisma/schema.prisma` | Updated | ✅ Ready | Database schema |
| `prisma/migrations/20260428144500_*` | New | ✅ Ready | Database migration |
| `src/pages/Applications.tsx` | New | ✅ Ready | React UI component |
| `src/app.ts` | Updated | ✅ Ready | Route registration |
| `STEP_6_COMPLETE.md` | New | ✅ Reference | Detailed documentation |
| `test_step6.sh` | New | ✅ Testing | Automated test script |

---

**Status**: ✅ **Step 6 Complete**

All CRUD operations are fully functional with proper authentication, validation, and error handling. Ready for testing and integration with future features.

