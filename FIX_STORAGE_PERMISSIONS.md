# 🔧 Fix Firebase Storage Permissions Issue

## Problem
Error: **"Missing or insufficient permissions"** when trying to upload/list assets.

## Root Cause
Your service account doesn't have **Storage Admin** permissions to access Firebase Storage.

---

## ✅ Solution: Grant Storage Permissions

### Method 1: Using Firebase Console (RECOMMENDED)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. Select your project: **wordfun-dcd3b**
3. Click **⚙️ (Settings)** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **"Manage service account permissions"** (opens Google Cloud Console)
6. Find your service account (looks like: `firebase-adminsdk-xxxxx@wordfun-dcd3b.iam.gserviceaccount.com`)
7. Click **✏️ Edit** (pencil icon)
8. Click **+ ADD ANOTHER ROLE**
9. Search for and select: **"Storage Admin"** or **"Storage Object Admin"**
10. Click **SAVE**

### Method 2: Using Google Cloud Console Directly

1. Go to: https://console.cloud.google.com/iam-admin/iam?project=wordfun-dcd3b
2. Find the service account: `firebase-adminsdk-xxxxx@wordfun-dcd3b.iam.gserviceaccount.com`
3. Click **✏️ Edit**
4. Click **+ ADD ANOTHER ROLE**
5. Select: **Storage Admin** (`roles/storage.admin`)
6. Click **SAVE**

### Method 3: Using gcloud CLI

```bash
# Get your service account email
export SA_EMAIL="firebase-adminsdk-xxxxx@wordfun-dcd3b.iam.gserviceaccount.com"

# Grant Storage Admin role
gcloud projects add-iam-policy-binding wordfun-dcd3b \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.admin"
```

---

## 🧪 Test After Granting Permissions

### Test 1: Upload Asset

```bash
curl -X POST http://localhost:5000/api/assets/upload \
  -F "file=@/path/to/test-image.png" \
  -F "appId=sample" \
  -F "description=Test image upload" \
  -F "uploadedBy=test-user-123"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "name": "test-image.png",
    "path": "apps/sample/assets/images/test-image_uuid.png",
    "downloadURL": "https://storage.googleapis.com/...",
    "assetType": "images",
    ...
  },
  "message": "Asset uploaded successfully"
}
```

### Test 2: List Assets

```bash
# List all assets
curl http://localhost:5000/api/assets/sample

# List only images
curl http://localhost:5000/api/assets/sample?type=images
```

---

## 📁 New Folder Structure

Assets are now organized by type:

```
apps/
  └── {appId}/
      └── assets/
          ├── images/       # Images (.png, .jpg, .gif, etc.)
          ├── videos/       # Videos (.mp4, .webm, etc.)
          ├── documents/    # Documents (.pdf, .doc, .txt, etc.)
          ├── audio/        # Audio files (.mp3, .wav, etc.)
          └── other/        # Other file types
```

---

## 🎯 Enhanced API Features

### 1. Upload with Auto Type Detection

The API now automatically detects file type and organizes into appropriate folder:

- **Images** → `apps/appId/assets/images/`
- **Videos** → `apps/appId/assets/videos/`
- **Documents** → `apps/appId/assets/documents/`
- **Audio** → `apps/appId/assets/audio/`
- **Other** → `apps/appId/assets/other/`

### 2. Filter Assets by Type

```bash
# Get only images
GET /api/assets/sample?type=images

# Get only videos
GET /api/assets/sample?type=videos

# Get only documents
GET /api/assets/sample?type=documents
```

### 3. Manual Type Override

You can manually specify asset type:

```bash
curl -X POST http://localhost:5000/api/assets/upload \
  -F "file=@myfile.dat" \
  -F "appId=sample" \
  -F "assetType=images" \
  -F "description=Custom type"
```

---

## 🔒 Storage Rules (Optional)

After fixing permissions, you may want to update Firebase Storage Rules:

1. Go to Firebase Console → Storage → Rules
2. Replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read for all assets
    match /apps/{appId}/assets/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

---

## ✅ Verification Checklist

- [ ] Service account has **Storage Admin** role
- [ ] Server restarted (to reload permissions)
- [ ] Upload test successful
- [ ] Assets appear in Firebase Console → Storage
- [ ] Folders created automatically (`apps/appId/assets/images/`, etc.)
- [ ] List API returns assets
- [ ] Filter by type works

---

## 🐛 Still Having Issues?

### Check Service Account Email

Find your service account email:
```bash
cat src/config/serviceAccountKey.json | grep client_email
```

### Check Storage Bucket Name

```bash
# Should output: wordfun-dcd3b.firebasestorage.app
cat src/config/firebaseConfig.js | grep storageBucket
```

### Check Server Logs

Look for:
```
✅ Storage bucket: wordfun-dcd3b.firebasestorage.app
[AssetService] Initialized with bucket: wordfun-dcd3b.firebasestorage.app
```

### Test Direct Access

Try accessing your storage bucket directly:
```
https://console.cloud.google.com/storage/browser/wordfun-dcd3b.firebasestorage.app
```

---

## 📞 Support

If permissions are still not working:
1. Double-check the service account email matches
2. Wait 1-2 minutes for IAM changes to propagate
3. Restart the server completely
4. Check Firebase Console → Storage to confirm bucket exists

**Bucket Name:** `wordfun-dcd3b.firebasestorage.app`  
**Project ID:** `wordfun-dcd3b`  
**Required Role:** `Storage Admin` or `Storage Object Admin`

