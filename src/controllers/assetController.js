/**
 * assetController.js
 * ------------------
 * REST API controller for asset management operations.
 * Handles upload, list, delete, and retrieve operations for app assets.
 */

import assetService from '../services/assetService.js';
import { db } from '../config/firebaseConfig.js';
import { logger } from '../utils/logger.js';
import { ok, created, fail } from '../utils/responseHandler.js';

/**
 * Normalize app name to collection prefix
 * Examples: "Rama2" -> "rama2", "My App" -> "myapp"
 */
const normalizeAppName = (appName) => {
  return appName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
};

/**
 * Upload a new asset
 * POST /api/assets/upload
 * Body: multipart/form-data with file, appId, description, uploadedBy
 */
export const uploadAsset = async (req, res) => {
  try {
    logger.log('[AssetController] Upload request received', { 
      appId: req.body.appId,
      fileName: req.file?.originalname 
    });

    // Validate request
    if (!req.file) {
      return fail(res, 400, 'No file uploaded');
    }

    const { appId, description = '', uploadedBy = 'unknown' } = req.body;

    if (!appId) {
      return fail(res, 400, 'appId is required');
    }

    // Upload to Firebase Storage
    const assetData = await assetService.uploadAsset(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      appId,
      { description, uploadedBy }
    );

    // Store metadata in Firestore
    const appPrefix = normalizeAppName(appId);
    const collectionName = `${appPrefix}_assets`;
    const assetRef = db.collection(collectionName).doc();
    
    await assetRef.set({
      ...assetData,
      id: assetRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    logger.log('[AssetController] Asset uploaded and metadata saved', { 
      assetId: assetRef.id,
      appId 
    });

    return created(
      res,
      { data: { ...assetData, id: assetRef.id } },
      'Asset uploaded successfully'
    );
  } catch (error) {
    logger.error('[AssetController] Upload failed', { error: error.message });
    return fail(res, 500, error.message);
  }
};

/**
 * List all assets for an app
 * GET /api/assets/:appId?type=images
 */
export const listAssets = async (req, res) => {
  try {
    const { appId } = req.params;
    const { type } = req.query; // Optional: filter by type (images, videos, documents, audio, other)
    logger.log('[AssetController] List request received', { appId, type });

    if (!appId) {
      return fail(res, 400, 'appId is required');
    }

    // Get metadata from Firestore
    const appPrefix = normalizeAppName(appId);
    const collectionName = `${appPrefix}_assets`;
    let query = db.collection(collectionName);
    
    // Filter by asset type if specified
    if (type) {
      query = query.where('assetType', '==', type);
    }
    
    const snapshot = await query.orderBy('uploadedAt', 'desc').get();

    const assets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    logger.log('[AssetController] Assets listed successfully', { 
      appId, 
      type,
      count: assets.length 
    });

    return ok(res, { data: { assets, count: assets.length } });
  } catch (error) {
    logger.error('[AssetController] List failed', { error: error.message });
    return fail(res, 500, error.message);
  }
};

/**
 * Get single asset by ID
 * GET /api/assets/:appId/:assetId
 */
export const getAsset = async (req, res) => {
  try {
    const { appId, assetId } = req.params;
    logger.log('[AssetController] Get asset request', { appId, assetId });

    if (!appId || !assetId) {
      return fail(res, 400, 'appId and assetId are required');
    }

    const appPrefix = normalizeAppName(appId);
    const collectionName = `${appPrefix}_assets`;
    const doc = await db.collection(collectionName).doc(assetId).get();

    if (!doc.exists) {
      return fail(res, 404, 'Asset not found');
    }

    const asset = { id: doc.id, ...doc.data() };

    logger.log('[AssetController] Asset retrieved successfully', { assetId });
    return ok(res, { data: asset });
  } catch (error) {
    logger.error('[AssetController] Get asset failed', { error: error.message });
    return fail(res, 500, error.message);
  }
};

/**
 * Delete an asset
 * DELETE /api/assets/:appId/:assetId
 */
export const deleteAsset = async (req, res) => {
  try {
    const { appId, assetId } = req.params;
    logger.log('[AssetController] Delete request received', { appId, assetId });

    if (!appId || !assetId) {
      return fail(res, 400, 'appId and assetId are required');
    }

    // Get asset metadata from Firestore
    const appPrefix = normalizeAppName(appId);
    const collectionName = `${appPrefix}_assets`;
    const doc = await db.collection(collectionName).doc(assetId).get();

    if (!doc.exists) {
      return fail(res, 404, 'Asset not found');
    }

    const asset = doc.data();

    // Delete from Firebase Storage
    await assetService.deleteAsset(asset.path);

    // Delete metadata from Firestore
    await db.collection(collectionName).doc(assetId).delete();

    logger.log('[AssetController] Asset deleted successfully', { assetId });
    return ok(res, { data: { id: assetId } }, 'Asset deleted successfully');
  } catch (error) {
    logger.error('[AssetController] Delete failed', { error: error.message });
    return fail(res, 500, error.message);
  }
};

/**
 * Get signed URL for secure access
 * POST /api/assets/signed-url
 * Body: { path, expiresIn }
 */
export const getSignedUrl = async (req, res) => {
  try {
    const { path: filePath, expiresIn = 60 } = req.body;
    logger.log('[AssetController] Signed URL request', { filePath });

    if (!filePath) {
      return fail(res, 400, 'path is required');
    }

    const signedUrl = await assetService.getSignedUrl(filePath, expiresIn);

    logger.log('[AssetController] Signed URL generated successfully');
    return ok(res, { data: { signedUrl, expiresIn } });
  } catch (error) {
    logger.error('[AssetController] Signed URL generation failed', { error: error.message });
    return fail(res, 500, error.message);
  }
};

/**
 * Update asset metadata
 * PATCH /api/assets/:appId/:assetId
 * Body: { description, name }
 */
export const updateAssetMetadata = async (req, res) => {
  try {
    const { appId, assetId } = req.params;
    const { description, name, visible } = req.body;
    
    logger.log('[AssetController] Update metadata request', { appId, assetId });

    if (!appId || !assetId) {
      return fail(res, 400, 'appId and assetId are required');
    }

    const appPrefix = normalizeAppName(appId);
    const collectionName = `${appPrefix}_assets`;
    const docRef = db.collection(collectionName).doc(assetId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return fail(res, 404, 'Asset not found');
    }

    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (description !== undefined) updateData.description = description;
    if (name !== undefined) updateData.name = name;
    if (visible !== undefined) updateData.visible = visible;

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    const updatedAsset = { id: updatedDoc.id, ...updatedDoc.data() };

    logger.log('[AssetController] Asset metadata updated successfully', { assetId });
    return ok(res, { data: updatedAsset }, 'Asset metadata updated successfully');
  } catch (error) {
    logger.error('[AssetController] Update metadata failed', { error: error.message });
    return fail(res, 500, error.message);
  }
};

export default {
  uploadAsset,
  listAssets,
  getAsset,
  deleteAsset,
  getSignedUrl,
  updateAssetMetadata,
};

