# Asset Management API - Setup Guide

## Issue Identified

The Asset Management APIs are failing with the error:
```
"Failed to upload asset: The specified bucket does not exist."
```

## Root Cause

The Firebase Storage bucket `wordfun-dcd3b.appspot.com` has not been created/enabled in your Firebase project.

## Solution Options

### Option 1: Enable Firebase Storage in Firebase Console (RECOMMENDED)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **wordfun-dcd3b**
3. Click on **"Storage"** in the left sidebar
4. Click **"Get Started"**
5. Follow the prompts to enable Firebase Storage
6. The default bucket will be created automatically as: `wordfun-dcd3b.appspot.com`

### Option 2: Use Alternative Storage Bucket

If you have a different storage bucket already created, update the environment variable:

```bash
# In your .env file
FIREBASE_STORAGE_BUCKET=your-actual-bucket-name.appspot.com
```

### Option 3: Verify Bucket Name from Firebase Console

1. Go to Firebase Console → Storage
2. Check the actual bucket name shown at the top
3. Update the configuration if it's different

## Testing After Setup

Once Firebase Storage is enabled, test the API:

```bash
# Test file upload
curl -X POST http://localhost:5000/api/assets/upload \
  -F "file=@/path/to/your/file.png" \
  -F "appId=sample" \
  -F "description=Test upload" \
  -F "uploadedBy=user-123"

# Expected success response:
{
  "success": true,
  "data": {
    "name": "file.png",
    "path": "apps/sample/assets/file_uuid.png",
    "downloadURL": "https://storage.googleapis.com/...",
    "fileType": "image/png",
    "size": 12345,
    ...
  },
  "message": "Asset uploaded successfully"
}
```

## API Endpoints

### 1. Upload Asset
```bash
POST /api/assets/upload
Content-Type: multipart/form-data

Fields:
- file: (binary file)
- appId: (string, required)
- description: (string, optional)
- uploadedBy: (string, optional)
```

### 2. List Assets
```bash
GET /api/assets/:appId
```

### 3. Get Single Asset
```bash
GET /api/assets/:appId/:assetId
```

### 4. Delete Asset
```bash
DELETE /api/assets/:appId/:assetId
```

### 5. Update Asset Metadata
```bash
PATCH /api/assets/:appId/:assetId
Content-Type: application/json

Body:
{
  "description": "Updated description",
  "name": "New name",
  "visible": true
}
```

### 6. Get Signed URL
```bash
POST /api/assets/signed-url
Content-Type: application/json

Body:
{
  "path": "apps/sample/assets/file.png",
  "expiresIn": 60
}
```

## Frontend Integration

No changes needed in the frontend! The frontend is already correctly configured to call these endpoints.

The frontend asset service is located at:
- Frontend calls: `/api/assets/*` endpoints
- Backend handles: All asset operations with Firebase Storage

## File Upload Limits

- **Max file size**: 50MB
- **Allowed file types**:
  - Images: jpeg, jpg, png, gif, webp, svg
  - Documents: pdf, doc, docx, xls, xlsx, txt, json
  - Media: mp4, webm, mp3, wav, ogg

## Storage Structure

Files are stored in Firebase Storage with the following structure:
```
apps/
  └── {appId}/
      └── assets/
          ├── filename1_uuid.ext
          ├── filename2_uuid.ext
          └── ...
```

Metadata is stored in Firestore:
```
Collection: {appId}_Assets
Documents: {
  id: "assetId",
  name: "original-filename.ext",
  path: "apps/appId/assets/filename_uuid.ext",
  downloadURL: "https://storage.googleapis.com/...",
  fileType: "image/png",
  size: 12345,
  uploadedAt: "2025-12-28T...",
  uploadedBy: "user-123",
  description: "...",
  appId: "sample"
}
```

## Security Notes

1. Files are made **publicly accessible** after upload (via `makePublic()`)
2. For private files, use the **signed URL** endpoint instead
3. Add authentication middleware to protect endpoints in production
4. Implement proper access control based on user permissions

## Next Steps

1. ✅ **Enable Firebase Storage** in Firebase Console (most important!)
2. Test the upload API with curl
3. Test from the frontend
4. Add authentication middleware if needed
5. Configure CORS rules in Firebase Storage if accessing from different domains

## Support

If you continue to see errors after enabling Firebase Storage:
1. Check Firebase Console → Storage → Rules
2. Verify the service account has Storage Admin permissions
3. Check the server logs for detailed error messages
4. Ensure the project ID matches: `wordfun-dcd3b`

