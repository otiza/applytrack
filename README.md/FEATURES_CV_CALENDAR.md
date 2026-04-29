# ApplyTrack Feature Update: CV Library + Interview Calendar

This branch adds:

1. CV library in Settings
2. CV attachment to applications
3. Interview calendar view

## Backend additions

- New Prisma model: `CvDocument`
- `Application.cvDocumentId` optional relation
- New routes:
  - `GET /api/cvs`
  - `POST /api/cvs` (multipart upload)
  - `DELETE /api/cvs/:id`
  - `GET /api/calendar/interviews`

Upload validation:
- Allowed formats: PDF, DOC, DOCX
- Max file size: 5MB
- User ownership enforced for all CV operations and CV attachment to applications

## Frontend additions

- Settings page includes a CV library section:
  - Upload CV
  - List CVs
  - Delete CV
  - Loading/empty/error states and toasts
- Applications form now supports selecting a CV
- Application cards and detail page display attached CV name
- New Calendar page (`/calendar`) with interview-focused timeline/cards

## Docker and storage

- Added backend upload volume for development in `docker-compose.yml`:
  - `./backend/uploads:/app/uploads`
- Added `backend/.dockerignore` rules to avoid bundling uploaded files
- Added git ignore rules to prevent committing user-uploaded CV files while keeping folder structure

## Migration and run commands

From repository root:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run check
```

Run both services with Docker:

```bash
cd ..
docker compose up --build
```

Frontend type check:

```bash
cd frontend
npm install
npm run check
```

## Manual testing checklist

1. Start app and log in.
2. Open Settings > CV Library.
3. Upload a valid PDF/DOC/DOCX under 5MB.
4. Verify uploaded CV appears with name, file name, date, and size.
5. Try invalid file type and oversized file (should fail with message).
6. Go to Applications and create or edit an application.
7. Select a CV from CV selector and save.
8. Confirm CV name appears on application card and detail page.
9. Set `interviewDate` for one or more applications.
10. Open Calendar from sidebar and verify interviews appear grouped by date.
11. Click a calendar interview item and confirm it opens the application detail page.
12. Delete a CV from Settings and confirm it is removed from library.
