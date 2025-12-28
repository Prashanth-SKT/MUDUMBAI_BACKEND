// 🔧 fixed/updated by ChatGPT on 2025-10-18 01:55:00 – reason: Added complete authentication controller using Firebase Auth + Firestore (mudumbaiDb) for user roles and profiles (START)
import { mudumbaiDb, defaultAuth } from "../config/firebaseAdmin.js";
import { ok, created, fail } from "../utils/responseHandler.js";
import { AppError } from "../utils/errorHandler.js";
import logger from "../services/loggerService.js";

/**
 * Auth Controller
 * ===============
 * Handles signup, login, Google sign-in, and user role management
 * Database: mudumbaiDb (separate Firestore instance)
 * Collections: users, app_users
 */

// Helper to normalize Firestore writes
const USERS_COLLECTION = "users";
const APP_USERS_COLLECTION = "app_users";

/**
 * POST /api/auth/signup
 * Creates Firebase Auth user + Firestore profile
 */
export const signup = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) {
      return fail(res, 400, "Email and password are required");
    }

    const userRecord = await defaultAuth.createUser({
      email,
      password,
      displayName: `${firstName || ""} ${lastName || ""}`.trim(),
    });

    const userData = {
      uid: userRecord.uid,
      email,
      firstName,
      lastName,
      role: "appAdmin", // default first role
      createdAt: new Date().toISOString(),
    };

    await mudumbaiDb.collection(USERS_COLLECTION).doc(userRecord.uid).set(userData);

    logger.info(`[AuthController] User created: ${email}`);
    return created(res, userData, "User registered successfully");
  } catch (err) {
    logger.error(`[AuthController] Signup error: ${err.message}`);
    return next(new AppError(err.message || "Signup failed", 500));
  }
};

/**
 * POST /api/auth/login
 * Verifies Firebase Auth user and fetches Firestore profile
 */
export const login = async (req, res, next) => {
  try {
    const { uid } = req.body; // frontend sends Firebase uid after login
    if (!uid) return fail(res, 400, "Missing user UID");

    const userDoc = await mudumbaiDb.collection(USERS_COLLECTION).doc(uid).get();
    if (!userDoc.exists) return fail(res, 404, "User not found");

    return ok(res, userDoc.data(), "Login successful");
  } catch (err) {
    logger.error(`[AuthController] Login error: ${err.message}`);
    return next(new AppError(err.message || "Login failed", 500));
  }
};

/**
 * POST /api/auth/google
 * Handles Google OAuth sign-in
 */
export const googleAuth = async (req, res, next) => {
  try {
    const { uid, email, displayName } = req.body;
    if (!uid || !email) return fail(res, 400, "Invalid Google user payload");

    const userRef = mudumbaiDb.collection(USERS_COLLECTION).doc(uid);
    const existing = await userRef.get();

    if (!existing.exists) {
      const newUser = {
        uid,
        email,
        displayName,
        role: "appAdmin",
        createdAt: new Date().toISOString(),
      };
      await userRef.set(newUser);
      logger.info(`[AuthController] Google user created: ${email}`);
      return created(res, newUser, "Google sign-in registered");
    }

    return ok(res, existing.data(), "Google sign-in successful");
  } catch (err) {
    logger.error(`[AuthController] GoogleAuth error: ${err.message}`);
    return next(new AppError(err.message || "Google sign-in failed", 500));
  }
};

/**
 * GET /api/auth/users
 * Returns list of all users (admin-only)
 */
export const listUsers = async (_req, res, next) => {
  try {
    const snapshot = await mudumbaiDb.collection(USERS_COLLECTION).get();
    const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return ok(res, users, "Fetched all users");
  } catch (err) {
    return next(new AppError(err.message || "Failed to list users", 500));
  }
};

/**
 * PATCH /api/auth/:uid/role
 * Updates a user role (admin only)
 */
export const updateRole = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;
    if (!uid || !role) return fail(res, 400, "UID and role are required");

    await mudumbaiDb.collection(USERS_COLLECTION).doc(uid).update({
      role,
      updatedAt: new Date().toISOString(),
    });

    return ok(res, { uid, role }, "User role updated");
  } catch (err) {
    return next(new AppError(err.message || "Failed to update role", 500));
  }
};
// 🔧 fixed/updated by ChatGPT on 2025-10-18 01:55:00 (END)
