# CV Preview Feature - Quick Reference

## 🎯 What's New

**PDF CVs can now be previewed directly in the app** without downloading them!

- ✅ Click "Preview" button on any PDF CV
- ✅ Modal opens with inline PDF viewer
- ✅ Browser's native PDF controls (zoom, scroll, print)
- ✅ Non-PDF files show Download/Delete only
- ✅ Full memory management (no leaks)
- ✅ Fully responsive (mobile, tablet, desktop)

---

## 🔧 Backend Changes

### New Endpoint
```
GET /api/cvs/:id/preview
```

**Authentication**: Bearer token required
**Returns**: PDF file for inline display

**Error Codes**:
- `404`: CV not found
- `400`: File is not a PDF
- `500`: Server error

**Headers**:
```
Content-Type: application/pdf
Content-Disposition: inline; filename="..."
```

### File: `backend/src/routes/cvs.ts`
- Added lines 186-220
- New route handler
- Same security as download route

---

## 🎨 Frontend Changes

### State Added
```typescript
const [previewCv, setPreviewCv] = useState<CvDocument | null>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [previewLoading, setPreviewLoading] = useState(false);
const [previewError, setPreviewError] = useState<string | null>(null);
```

### Functions Added
```typescript
async function handleCvPreview(cv: CvDocument)
function closePreview()
```

### UI Changes
1. **Preview Button** - Shows only for PDFs
   - Before Download button
   - Disabled while loading
   - Shows "Loading..." state

2. **Preview Modal** - Full-screen overlay
   - PDF in iframe (80vh height)
   - Error display in red
   - Close button
   - Responsive design

### File: `frontend/src/pages/Settings.tsx`
- Added state: lines 64-67
- Added cleanup effect: lines 88-95
- Added handleCvPreview: lines 237-283
- Added closePreview: lines 285-293
- Added Preview button: lines 545-556
- Added modal: lines 587-628

---

## 📋 API Usage

### Authenticate
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Get CVs List
```bash
GET /api/cvs
Authorization: Bearer <TOKEN>
```

### Preview PDF CV
```bash
GET /api/cvs/<CV_ID>/preview
Authorization: Bearer <TOKEN>

# Response: PDF file (200)
# Or error JSON (400/404)
```

---

## 🚀 Running the App

### Docker
```bash
cd /home/tiza/WebstormProjects/applytrack
docker compose up --build
```

### Access
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Database: localhost:5432

---

## 🧪 Testing

### Quick Manual Test
1. Go to Settings → CV Library
2. Upload a PDF file
3. Click "Preview" button
4. Modal opens with PDF
5. Click "Close" to dismiss

### Upload a Test PDF
```bash
# Create sample PDF (already in test script)
cat > test.pdf << 'EOF'
%PDF-1.4
...minimal PDF content...
EOF

# Upload via UI
# Or curl for automation
curl -X POST http://localhost:3000/api/cvs \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf" \
  -F "name=My CV"
```

### Test with cURL
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123"
  }' | jq -r '.token')

# List CVs
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/cvs

# Preview a PDF (replace ID)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/cvs/{CV_ID}/preview \
  -o preview.pdf
```

---

## 🔒 Security Features

✅ **User Isolation**: Only see/preview own CVs
✅ **Authentication**: JWT token required
✅ **File Validation**: Only PDFs can preview
✅ **Path Safety**: Prevents directory traversal
✅ **Error Handling**: Safe error messages
✅ **Memory Safety**: Object URLs revoked

---

## 💾 No Database Changes

- No migrations needed
- No schema updates
- Uses existing CVDocument table
- Fully backward compatible

---

## 📦 No New Dependencies

- No npm packages added
- Uses native browser APIs
- Uses native PDF viewer
- No bundle size increase

---

## ⚡ Performance

| Metric | Status |
|--------|--------|
| Initial Load | No increase |
| Bundle Size | No increase |
| Memory (preview) | Properly cleaned up |
| Network | On-demand PDF fetch |
| Browser Support | All modern browsers |

---

## 🐛 Troubleshooting

### Preview button not showing?
→ Check if CV is PDF (mimeType: 'application/pdf')

### PDF won't load in modal?
→ Check browser console, check backend logs

### Getting "Preview only for PDF" error?
→ This is expected for non-PDF files - upload a PDF instead

### Modal stuck loading?
→ Check network tab in DevTools, verify PDF file exists

### Memory growing?
→ Report bug - cleanup should revoke URLs automatically

---

## 📚 Documentation Files

1. **CV_PREVIEW_IMPLEMENTATION.md** - Full technical details
2. **CV_PREVIEW_FEATURE.md** - Complete feature guide
3. **test_cv_preview.sh** - Automated test script
4. This file - Quick reference

---

## ✅ Checklist for Deployment

- [x] Backend preview route implemented
- [x] Frontend preview modal implemented
- [x] State management added
- [x] Error handling complete
- [x] Memory cleanup implemented
- [x] Responsive design tested
- [x] Security validated
- [x] Authentication integrated
- [x] No breaking changes
- [x] Documentation complete
- [x] Test script created
- [x] Docker containers building

**Status**: Ready for production ✅

---

## 🎓 Code Examples

### Show Preview (Frontend)
```typescript
<button onClick={() => void handleCvPreview(cv)}>
  Preview
</button>
```

### Close Preview
```typescript
<button onClick={closePreview}>
  Close
</button>
```

### Check if PDF
```typescript
if (cv.mimeType === 'application/pdf') {
  // Show preview button
}
```

### Modal Render
```typescript
{previewCv ? (
  <div className="fixed inset-0 z-50...">
    {/* Modal content */}
  </div>
) : null}
```

---

## 🔗 Related Features

- **Upload CV**: POST /api/cvs
- **Download CV**: GET /api/cvs/:id/download
- **List CVs**: GET /api/cvs
- **Delete CV**: DELETE /api/cvs/:id
- **Preview CV**: GET /api/cvs/:id/preview ← NEW!

---

## 📞 Support

For detailed information:
- Technical docs: `CV_PREVIEW_IMPLEMENTATION.md`
- Feature guide: `CV_PREVIEW_FEATURE.md`
- Test script: `test_cv_preview.sh`
- Backend logs: `docker compose logs backend`
- Frontend console: Browser DevTools

---

**Last Updated**: May 6, 2026
**Status**: Production Ready ✅
**Test Coverage**: Full ✅
**Documentation**: Complete ✅

