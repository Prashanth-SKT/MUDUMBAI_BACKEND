/**
 * assetService.js
 * ---------------
 * Handles Firebase Storage operations for asset management.
 * - Upload files to apps/<appId>/assets/ structure
 * - Generate secure download URLs
 * - Delete assets
 * - Store/retrieve metadata from Firestore
 */

import { admin } from '../config/firebaseConfig.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { logger } from '../utils/logger.js';

// Get the storage bucket - explicitly specify bucket name to ensure it's correct
const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'wordfun-dcd3b.firebasestorage.app';
const bucket = admin.storage().bucket(bucketName);

logger.log('[AssetService] Initialized with bucket:', bucketName);

/**
 * Determine asset type folder based on MIME type
 * @param {string} mimeType - File MIME type
 * @returns {string} - Folder name (images, videos, documents, audio, other)
 */
const getAssetTypeFolder = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet') || 
      mimeType.includes('text') || mimeType.includes('json')) return 'documents';
  return 'other';
};

/**
 * Upload a file to Firebase Storage with app-specific and type-based folder structure
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File MIME type
 * @param {string} appId - Application ID
 * @param {object} metadata - Additional metadata (uploadedBy, description, assetType)
 * @returns {Promise<object>} - Uploaded file info with download URL
 */
export const uploadAsset = async (fileBuffer, originalName, mimeType, appId, metadata = {}) => {
  try {
    logger.log('[AssetService] Uploading asset', { originalName, appId, mimeType });

    // Determine asset type folder
    const assetTypeFolder = metadata.assetType || getAssetTypeFolder(mimeType);

    // Generate unique filename with original extension
    const ext = path.extname(originalName);
    const uniqueId = uuidv4();
    const fileName = `${path.basename(originalName, ext)}_${uniqueId}${ext}`;
    
    // Define app-specific path with type-based organization: apps/<appId>/assets/<type>/<fileName>
    const filePath = `apps/${appId}/assets/${assetTypeFolder}/${fileName}`;

    // Upload file to Firebase Storage
    const file = bucket.file(filePath);
    await file.save(fileBuffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          appId,
          originalName,
          uploadedBy: metadata.uploadedBy || 'unknown',
          uploadedAt: new Date().toISOString(),
          description: metadata.description || '',
        },
      },
    });

    // Make file publicly accessible
    await file.makePublic();

    // Get public download URL
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // Get file size
    const [fileMetadata] = await file.getMetadata();
    const size = fileMetadata.size;

    logger.log('[AssetService] Asset uploaded successfully', { filePath, size, assetType: assetTypeFolder });

    return {
      name: originalName,
      path: filePath,
      downloadURL,
      fileType: mimeType,
      assetType: assetTypeFolder,
      size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: metadata.uploadedBy || 'unknown',
      description: metadata.description || '',
      appId,
    };
  } catch (error) {
    logger.error('[AssetService] Upload failed', { error: error.message });
    throw new Error(`Failed to upload asset: ${error.message}`);
  }
};

/**
 * Get signed URL for secure asset access
 * @param {string} filePath - Path to file in storage
 * @param {number} expiresIn - Expiration time in minutes (default: 60)
 * @returns {Promise<string>} - Signed URL
 */
export const getSignedUrl = async (filePath, expiresIn = 60) => {
  try {
    const file = bucket.file(filePath);
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn * 60 * 1000,
    });
    return signedUrl;
  } catch (error) {
    logger.error('[AssetService] Failed to generate signed URL', { error: error.message });
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Delete asset from Firebase Storage
 * @param {string} filePath - Path to file in storage
 * @returns {Promise<boolean>} - Success status
 */
export const deleteAsset = async (filePath) => {
  try {
    logger.log('[AssetService] Deleting asset', { filePath });
    const file = bucket.file(filePath);
    await file.delete();
    logger.log('[AssetService] Asset deleted successfully', { filePath });
    return true;
  } catch (error) {
    logger.error('[AssetService] Delete failed', { error: error.message });
    throw new Error(`Failed to delete asset: ${error.message}`);
  }
};

/**
 * Check if user has permission to access app's assets
 * @param {string} userId - User ID
 * @param {string} appId - Application ID
 * @returns {Promise<boolean>} - Permission status
 */
export const checkAssetPermission = async (userId, appId) => {
  try {
    // TODO: Implement proper permission check based on your auth system
    // For now, we'll allow access if userId exists
    return userId && appId;
  } catch (error) {
    logger.error('[AssetService] Permission check failed', { error: error.message });
    return false;
  }
};

/**
 * List all assets for an app (optionally filtered by type)
 * @param {string} appId - Application ID
 * @param {string} assetType - Optional: filter by type (images, videos, documents, audio, other)
 * @returns {Promise<Array>} - List of asset metadata
 */
export const listAssets = async (appId, assetType = null) => {
  try {
    logger.log('[AssetService] Listing assets', { appId, assetType });
    const prefix = assetType ? `apps/${appId}/assets/${assetType}/` : `apps/${appId}/assets/`;
    const [files] = await bucket.getFiles({ prefix });
    
    const assets = await Promise.all(
      files.map(async (file) => {
        const [metadata] = await file.getMetadata();
        const downloadURL = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
        
        // Extract asset type from path (apps/appId/assets/TYPE/file.ext)
        const pathParts = file.name.split('/');
        const extractedType = pathParts.length >= 4 ? pathParts[3] : 'other';
        
        return {
          name: metadata.metadata?.originalName || file.name,
          path: file.name,
          downloadURL,
          fileType: metadata.contentType,
          assetType: extractedType,
          size: metadata.size,
          uploadedAt: metadata.metadata?.uploadedAt || metadata.timeCreated,
          uploadedBy: metadata.metadata?.uploadedBy || 'unknown',
          description: metadata.metadata?.description || '',
          appId: metadata.metadata?.appId || appId,
        };
      })
    );

    logger.log('[AssetService] Assets listed successfully', { count: assets.length });
    return assets;
  } catch (error) {
    logger.error('[AssetService] List failed', { error: error.message });
    throw new Error(`Failed to list assets: ${error.message}`);
  }
};

/**
 * Get asset metadata by path
 * @param {string} filePath - Path to file in storage
 * @returns {Promise<object>} - Asset metadata
 */
export const getAssetMetadata = async (filePath) => {
  try {
    const file = bucket.file(filePath);
    const [metadata] = await file.getMetadata();
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    
    return {
      name: metadata.metadata?.originalName || file.name,
      path: file.name,
      downloadURL,
      fileType: metadata.contentType,
      size: metadata.size,
      uploadedAt: metadata.metadata?.uploadedAt || metadata.timeCreated,
      uploadedBy: metadata.metadata?.uploadedBy || 'unknown',
      description: metadata.metadata?.description || '',
      appId: metadata.metadata?.appId,
    };
  } catch (error) {
    logger.error('[AssetService] Get metadata failed', { error: error.message });
    throw new Error(`Failed to get asset metadata: ${error.message}`);
  }
};

export default {
  uploadAsset,
  getSignedUrl,
  deleteAsset,
  checkAssetPermission,
  listAssets,
  getAssetMetadata,
};



