/**
 * assetRoutes.js
 * --------------
 * API routes for asset management.
 * All routes are prefixed with /api/assets
 */

import express from 'express';
import multer from 'multer';
import assetController from '../../controllers/assetController.js';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/json',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  },
});

/**
 * @route   POST /api/assets/upload
 * @desc    Upload a new asset
 * @access  Protected (requires appId)
 */
router.post('/upload', upload.single('file'), assetController.uploadAsset);

/**
 * @route   GET /api/assets/:appId
 * @desc    List all assets for an app
 * @access  Protected
 */
router.get('/:appId', assetController.listAssets);

/**
 * @route   GET /api/assets/:appId/:assetId
 * @desc    Get a single asset by ID
 * @access  Protected
 */
router.get('/:appId/:assetId', assetController.getAsset);

/**
 * @route   DELETE /api/assets/:appId/:assetId
 * @desc    Delete an asset
 * @access  Protected
 */
router.delete('/:appId/:assetId', assetController.deleteAsset);

/**
 * @route   POST /api/assets/signed-url
 * @desc    Get a signed URL for secure asset access
 * @access  Protected
 */
router.post('/signed-url', assetController.getSignedUrl);

/**
 * @route   PATCH /api/assets/:appId/:assetId
 * @desc    Update asset metadata
 * @access  Protected
 */
router.patch('/:appId/:assetId', assetController.updateAssetMetadata);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 50MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`,
    });
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  
  next();
});

export default router;









