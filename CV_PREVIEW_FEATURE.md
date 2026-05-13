# CV Preview Feature Documentation

## Overview
Added an in-app PDF CV preview feature that allows users to preview PDF CVs directly within the application without downloading them. DOC/DOCX files continue to show only Download/Delete options.

## Implementation Details

### Backend (backend/src/routes/cvs.ts)

#### New Route
- **Endpoint**: `GET /api/cvs/:id/preview`
- **Authentication**: Required (Bearer token)
- **Description**: Returns a PDF file for inline preview in the browser

#### Route Logic
1. Validates CV ownership by checking userId
2. Verifies CV exists and is owned by the authenticated user
3. Checks that the CV is a PDF file (mimeType === 'application/pdf')
4. Validates that the file exists on disk
5. Sets appropriate headers for inline PDF display
6. Uses `res.sendFile()` to stream the file to the client

#### Error Handling
- **404**: CV not found or file not found on server
- **400**: File is not a PDF (preview only available for PDFs)
- **500**: Server error with detailed logging

#### Headers Set
```
Content-Type: application/pdf
Content-Disposition: inline; filename="<originalFileName>"
```

### Frontend (frontend/src/pages/Settings.tsx)

#### New State Variables
```typescript
const [previewCv, setPreviewCv] = useState<CvDocument | null>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [previewLoading, setPreviewLoading] = useState(false);
const [previewError, setPreviewError] = useState<string | null>(null);
```

#### New Functions

##### handleCvPreview(cv: CvDocument)
- Validates that CV is a PDF before attempting preview
- Fetches the preview from the backend API
- Converts response to Blob
- Creates an object URL using `URL.createObjectURL()`
- Stores preview state
- Shows error messages via toast
- Handles authentication errors

##### closePreview()
- Revokes the object URL to prevent memory leaks
- Clears all preview state variables
- Returns UI to normal state

#### Effects

##### useEffect for Cleanup
- Runs on component unmount
- Revokes any active preview URL
- Prevents memory leaks when component is destroyed

#### UI Updates

##### Preview Button in CV List
- Only shows for PDF files (`cv.mimeType === 'application/pdf'`)
- Disabled while loading (`previewLoading`)
- Placed before Download button
- Same styling as Download button for consistency

##### Preview Modal
- Full-screen overlay with semi-transparent background
- Responsive design (works on mobile)
- Contains:
  - CV name and original filename in header
  - Close button
  - Error message display (in red)
  - PDF iframe viewer (80vh height)
  - Loading state indicator

## User Experience Flow

### Viewing a PDF CV
1. User clicks "Preview" button on a PDF CV in the library
2. Preview loading state activates (button shows "Loading...")
3. Backend fetches the PDF file
4. Modal opens with PDF displayed in iframe
5. User can scroll, zoom (browser PDF viewer controls)
6. User clicks "Close" to dismiss modal

### For Non-PDF Files
- Preview button is hidden
- Download and Delete buttons remain available
- No changes to existing functionality

## Security Features

- **Authentication**: All preview requests require valid JWT token
- **Authorization**: Users can only preview their own CVs
- **File Validation**: Only PDFs can be previewed (prevents security risks)
- **Path Traversal Prevention**: Uses same safe path resolution as download route
- **Memory Management**: Object URLs are properly revoked to prevent memory leaks

## Browser Compatibility

The feature uses:
- `fetch()` API (modern browsers)
- `URL.createObjectURL()` and `URL.revokeObjectURL()` (standard Web API)
- `<iframe>` with blob URLs (standard HTML5)
- Built-in browser PDF viewer

Tested and compatible with all modern browsers (Chrome, Firefox, Safari, Edge).

## Testing Instructions

### Prerequisites
- Running Docker containers (backend, frontend, postgres)
- Authenticated user account
- PDF CV file (max 5MB)

### Manual Testing Steps

1. **Upload a PDF CV**
   - Go to Settings → CV Library
   - Upload a PDF file with a descriptive name
   - Verify upload success message

2. **Test Preview on PDF CV**
   - Click "Preview" button on PDF CV
   - Verify modal opens with PDF displayed
   - Verify CV name and filename shown in header
   - Test PDF viewer controls (scroll, zoom)
   - Click "Close" to dismiss

3. **Test Non-PDF CV Behavior**
   - Upload a DOC or DOCX file
   - Verify "Preview" button is NOT shown
   - Verify Download and Delete buttons work

4. **Test Error Handling**
   - Try to preview a deleted CV (should show "CV not found" error)
   - Simulate network error and retry

5. **Test Memory Cleanup**
   - Open and close preview multiple times
   - Check browser dev tools memory usage (should not increase)
   - Close browser tab while modal open (URL should revoke on unmount)

6. **Test Authentication**
   - Log out then try to access preview URL directly
   - Should redirect to login page
   - Log in with different user, try to preview other user's CV (should fail)

### Automated Testing

```bash
# Build and test both frontend and backend
cd /home/tiza/WebstormProjects/applytrack/backend && npm run build
cd /home/tiza/WebstormProjects/applytrack/frontend && npm run build

# Start Docker containers
cd /home/tiza/WebstormProjects/applytrack && docker compose up --build
```

### API Testing with cURL

```bash
# Get auth token (replace credentials)
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  -s | jq -r '.token')

# Get list of CVs
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/cvs

# Preview a PDF CV (replace CV_ID)
curl -H "Authorization: Bearer $TOKEN" \
  -o preview.pdf \
  http://localhost:3000/api/cvs/{CV_ID}/preview

# Try to preview non-PDF (should return 400 error)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/cvs/{DOCX_CV_ID}/preview
```

## Files Modified

### Backend
- `backend/src/routes/cvs.ts`
  - Added `GET /:id/preview` route (lines ~186-220)
  - No changes to existing routes

### Frontend
- `frontend/src/pages/Settings.tsx`
  - Added preview state variables (lines ~64-67)
  - Added cleanup effect (lines ~88-95)
  - Added `handleCvPreview()` function (lines ~237-283)
  - Added `closePreview()` function (lines ~285-293)
  - Added Preview button to CV list (lines ~545-556)
  - Added modal overlay (lines ~587-628)

## Deployment Notes

### Environment Variables
No new environment variables required. Uses existing authentication setup.

### Database
No database schema changes required.

### File System
Uses existing `/uploads/cvs/` directory for CV storage.

### Dependencies
No new dependencies added. Uses only:
- Native fetch API
- Native File/Blob APIs
- Native browser PDF viewer

## Performance Considerations

- **PDF Streaming**: Uses `res.sendFile()` for efficient streaming
- **Memory**: Object URLs properly revoked to prevent leaks
- **Network**: Only fetches PDF when user clicks Preview
- **Browser Cache**: Browser caches PDF in memory during session

## Known Limitations

1. **PDF-Only**: Non-PDF files cannot be previewed (by design)
2. **Browser PDF Viewer**: Preview experience depends on browser's built-in PDF viewer
3. **Large Files**: Large PDFs may take time to load/render
4. **Mobile**: Preview works but may be limited by screen size (modal is responsive)

## Future Enhancements

- Add PDF annotation support
- Support preview for other file types (DOCX via conversion)
- Add zoom controls/options
- Add download from preview modal
- Add print from preview modal
- Add fullscreen preview option

## Maintenance

### Troubleshooting

**Preview button not showing:**
- Verify CV mimeType is 'application/pdf'
- Check browser console for errors
- Verify authentication token is valid

**Preview modal doesn't load PDF:**
- Check backend logs for 404/400 errors
- Verify PDF file exists on disk
- Check browser PDF viewer compatibility

**Memory leak issues:**
- Verify `closePreview()` is being called
- Check that `useEffect` cleanup is running
- Monitor browser memory in dev tools

### Monitoring

Monitor these metrics in production:
- `/api/cvs/:id/preview` endpoint response times
- Error rate for preview requests
- File serving performance
- Memory usage in browser

## Related Features

- CV Upload: `POST /api/cvs`
- CV Download: `GET /api/cvs/:id/download`
- CV Delete: `DELETE /api/cvs/:id`
- CV List: `GET /api/cvs`

