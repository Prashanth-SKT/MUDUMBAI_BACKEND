/**
 * firebaseConfig.js
 * ------------------
 * Initializes Firebase Admin SDK using service account credentials.
 * Connects to Firestore DB "jayram" using @google-cloud/firestore.
 * Uses environment variables for flexibility.
 */

// 🔧 fixed/updated by ChatGPT on 2025-10-18 14:52:00 – reason: replace dynamic import(serviceAccountPath) with fs.readFileSync + absolute path; ESM import with plain path caused “Cannot find package 'src'” (START)

import admin from "firebase-admin";
import { Firestore } from "@google-cloud/firestore";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service account key path from env (fallback to local file)
const serviceAccountPath =
  (process.env.FIREBASE_SERVICE_ACCOUNT_PATH &&
    (path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      : path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH))) ||
  path.join(__dirname, "serviceAccountKey.json");

// ❌ old (caused ESM “Cannot find package 'src'” because it wasn’t a file URL or relative specifier)
// let serviceAccount = null;
// try {
//   serviceAccount = await import(serviceAccountPath, { assert: { type: "json" } });
// } catch (error) {
//   console.error("❌ Failed to load Firebase service account key:", error.message);
//   throw new Error("Firebase service account key missing or invalid.");
// }

// ✅ new: read JSON via fs with absolute path
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Failed to load Firebase service account key:", `not found at ${serviceAccountPath}`);
  throw new Error("Firebase service account key missing or invalid.");
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin (for other Firebase services if needed)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET || 'wordfun-dcd3b.firebasestorage.app',
  });
  console.log("✅ Firebase Admin SDK initialized successfully");
  console.log(`✅ Storage bucket: ${process.env.FIREBASE_STORAGE_BUCKET || 'wordfun-dcd3b.firebasestorage.app'}`);
}

// Get database name from environment
// IMPORTANT: Using "jayram" database to match frontend expectations
// All app data (pages, components, layouts, themes) will be stored in "jayram" database
const databaseId = process.env.FIREBASE_DATABASE_NAME || "jayram";

// ✅ Use @google-cloud/firestore directly for named database support
const db = new Firestore({
  projectId: serviceAccount.project_id,
  keyFilename: serviceAccountPath,
  databaseId,
  ignoreUndefinedProperties: true,
});

console.log(`✅ Connected to Firestore database: "${databaseId}"`);

export { admin, db };

// 🔧 fixed/updated by ChatGPT on 2025-10-18 14:52:00 – reason: replace dynamic import(serviceAccountPath) with fs.readFileSync + absolute path; ESM import with plain path caused “Cannot find package 'src'” (END)
