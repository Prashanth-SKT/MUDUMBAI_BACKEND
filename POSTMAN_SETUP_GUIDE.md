# 📮 Postman Collection Setup Guide

## Import the Collection

### Method 1: Import JSON File

1. Open **Postman**
2. Click **Import** button (top left)
3. Click **Upload Files**
4. Select `Asset_Management_API.postman_collection.json`
5. Click **Import**

### Method 2: Drag & Drop

1. Open **Postman**
2. Drag `Asset_Management_API.postman_collection.json` into Postman window
3. Collection will be imported automatically

---

## Configure Environment Variables

The collection uses variables for flexibility. You can use them as-is or customize:

### Built-in Variables (Already Set):

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `{{baseUrl}}` | `http://localhost:5000/api` | API base URL |
| `{{appId}}` | `sample` | Default app ID |

### To Change Variables:

1. Click on collection name **"Asset Management API"**
2. Go to **Variables** tab
3. Modify values:
   - Change `baseUrl` if your server runs on different port
   - Change `appId` to test different apps (hanuma, Rama2, etc.)
4. Click **Save**

---

## 🧪 Test the API

### Quick Test Flow:

1. **Start Backend Server** (if not already running):
   ```bash
   cd /home/sukusala/Desktop/MUDUMBAI_Backend
   npm run dev
   ```

2. **Test Health Check**:
   - Open request: `7. Health Check`
   - Click **Send**
   - Should return: `{"status": "ok"}`

3. **Upload an Image**:
   - Open folder: `1. Upload Asset`
   - Select request: `Upload Image (Auto-detect)`
   - Click **Body** tab
   - Click **Select File** next to `file` field
   - Choose an image from your computer
   - Click **Send**
   - Should return asset details with `assetType: "images"`

4. **List All Assets**:
   - Open folder: `2. List Assets`
   - Select: `List All Assets`
   - Click **Send**
   - Should show all uploaded assets

5. **List Only Images**:
   - Select: `List Only Images`
   - Click **Send**
   - Should show only image assets

---

## 📋 Available Requests

### 1️⃣ Upload Asset (5 requests)
- **Upload Image (Auto-detect)** - Upload PNG, JPG, etc.
- **Upload Video** - Upload MP4, WebM, etc.
- **Upload Document (PDF)** - Upload PDF files
- **Upload Audio File** - Upload MP3, WAV, etc.
- **Upload with Manual Type Override** - Force specific asset type

### 2️⃣ List Assets (6 requests)
- **List All Assets** - Get all assets
- **List Only Images** - Filter images
- **List Only Videos** - Filter videos
- **List Only Documents** - Filter documents
- **List Only Audio** - Filter audio files
- **List Other Files** - Other file types

### 3️⃣ Get Single Asset
- Retrieve specific asset by ID

### 4️⃣ Update Asset Metadata
- Update description, name, visibility

### 5️⃣ Delete Asset
- Remove asset from storage and database

### 6️⃣ Get Signed URL
- Generate temporary secure URL

### 7️⃣ Health Check
- Verify server is running

---

## 📝 How to Use Each Request

### Upload Asset

1. Select upload type (Image, Video, Document, Audio)
2. Click **Body** tab
3. Click **Select File** next to `file` parameter
4. Choose file from your computer
5. Modify `appId` if needed (default: sample)
6. Add `description` (optional)
7. Add `uploadedBy` user ID (optional)
8. Click **Send**
9. Copy `id` from response for later use

### List Assets

1. Select list type:
   - All Assets
   - Only Images
   - Only Videos
   - Only Documents
   - Only Audio
2. Update `appId` in URL if testing different app
3. Click **Send**
4. Browse assets in response

### Get Single Asset

1. Replace `:assetId` in URL with actual asset ID
   - Or use Postman variable: `{{assetId}}`
2. Update `:appId` if needed
3. Click **Send**

### Update Asset Metadata

1. Replace `:assetId` and `:appId` in URL
2. Modify JSON body:
   ```json
   {
     "description": "New description",
     "name": "New display name",
     "visible": true
   }
   ```
3. Click **Send**

### Delete Asset

1. Replace `:assetId` and `:appId` in URL
2. Click **Send**
3. Asset will be removed from storage and database

### Get Signed URL

1. Modify request body with asset path:
   ```json
   {
     "path": "apps/sample/assets/images/file_uuid.png",
     "expiresIn": 60
   }
   ```
2. Click **Send**
3. Copy signed URL from response

---

## 🎯 Testing Different Apps

To test assets for different apps (hanuma, Rama2, etc.):

### Method 1: Change Collection Variable
1. Click collection name
2. Go to **Variables** tab
3. Change `appId` from `sample` to `hanuma`
4. Save
5. All requests now use `hanuma`

### Method 2: Change URL Directly
1. In any request, find `:appId` in URL
2. Replace with desired app ID
3. Example: Change `sample` to `Rama2`

---

## 📸 Sample Response Examples

### Upload Success:
```json
{
  "success": true,
  "data": {
    "id": "asset_abc123",
    "name": "logo.png",
    "path": "apps/sample/assets/images/logo_uuid.png",
    "downloadURL": "https://storage.googleapis.com/...",
    "assetType": "images",
    "size": 12345
  }
}
```

### List Assets:
```json
{
  "success": true,
  "data": {
    "assets": [...],
    "count": 5
  }
}
```

---

## 🔧 Troubleshooting

### Error: Connection Refused
- Make sure backend server is running: `npm run dev`
- Check `baseUrl` variable points to correct port (default: 5000)

### Error: Missing or insufficient permissions
- Follow instructions in `FIX_STORAGE_PERMISSIONS.md`
- Grant Storage Admin role to service account

### Error: No file uploaded
- Ensure you selected a file in Body tab
- File parameter name must be exactly `file`

### Error: File type not allowed
- Check allowed file types in `src/api/routes/assetRoutes.js`
- Supported: images, videos, audio, documents, PDF, Office files

---

## 💡 Pro Tips

1. **Save Asset IDs**: After upload, copy the `id` field to use in other requests
2. **Use Environments**: Create different environments for dev/staging/prod
3. **Save Examples**: Save successful responses as examples for documentation
4. **Test Filters**: Try different `type` query parameters (images, videos, documents, audio, other)
5. **Batch Testing**: Use Postman Runner to test multiple uploads at once

---

## 🚀 Next Steps

1. ✅ Import collection
2. ✅ Test health check
3. ✅ Upload test files (image, video, document)
4. ✅ List assets and verify organization
5. ✅ Test filtering by type
6. ✅ Try update and delete operations
7. ✅ Generate signed URLs
8. ✅ Fix permissions if needed (see `FIX_STORAGE_PERMISSIONS.md`)

---

## 📚 Additional Resources

- **API Documentation**: See detailed endpoint docs in response tab
- **Permissions Fix**: `FIX_STORAGE_PERMISSIONS.md`
- **Complete Guide**: `ASSET_MANAGEMENT_SETUP.md`
- **Backend Code**: `src/controllers/assetController.js`

Happy Testing! 🎉

