// 🔧 fixed/updated by ChatGPT on 2025-10-18 16:20:00 – reason: support THREE Firestore DBs in one project (default, "jayram", "mudumbai"); restore missing exports; use @google-cloud/firestore for named DBs; keep Admin Auth via default app. (START)

import dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { getFirestore } from "firebase-admin/firestore";
import { Firestore } from "@google-cloud/firestore";

/* --------------------------
   Resolve service account key
--------------------------- */
const svcPath = path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "")
  ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  : path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "src/config/serviceAccountKey.json");

if (!fs.existsSync(svcPath)) {
  throw new Error(`Firebase service account key not found at: ${svcPath}`);
}

const sa = JSON.parse(fs.readFileSync(svcPath, "utf8"));
const projectId = process.env.FIREBASE_PROJECT_ID || sa.project_id;

/* ----------------------------------------
   Initialize Admin app (Auth + default DB)
----------------------------------------- */
function getOrInitAdminApp(name = "[DEFAULT]") {
  try {
    return admin.app(name);
  } catch {
    return admin.initializeApp(
      {
        credential: admin.credential.cert({
          projectId,
          clientEmail: sa.client_email,
          privateKey: sa.private_key,
        }),
      },
      name
    );
  }
}

// Ensure default Admin app & auth exist
const defaultApp = getOrInitAdminApp("[DEFAULT]");
const defaultAuth = defaultApp.auth();

// ❌ old (pre-v11 style; kept for reference)
// const defaultDb = defaultApp.firestore();
// ✅ correct: modern accessor (points to the project's (default) database)
const defaultDb = getFirestore(defaultApp);

/* ---------------------------------------------------------
   Open named Firestore databases within the SAME project
   Use Google Cloud Firestore client (supports databaseId)
   DO NOT pass { databaseId } to Admin getFirestore() — that
   becomes "settings" and throws settings.databaseId error.
---------------------------------------------------------- */

// Helper to open a named database with the same credentials
function openNamedDb(databaseId) {
  // return new Firestore({
  //   projectId,
  //   databaseId, // e.g., "jayram" or "mudumbai"
  //   credentials: {
  //     client_email: sa.client_email,
  //     private_key: sa.private_key,
  //   },
  //   ignoreUndefinedProperties: true,
  // });
  // fixed/updated by ChatGPT on 2025-10-18 23:59:40 – unescape \n in private key for @google-cloud/firestore compatibility
  const key = (sa.private_key || "").replace(/\\n/g, "\n");
  return new Firestore({
    projectId,
    databaseId, // e.g., "jayram" or "mudumbai"
    credentials: {
      client_email: sa.client_email,
      private_key: key,
    },
    ignoreUndefinedProperties: true,
  });
}

// ❌ wrong approach (left as comment for future devs):
// const jayramDb = getFirestore(defaultApp, { databaseId: "jayram" });
// const mudumbaiDb = getFirestore(defaultApp, { databaseId: "mudumbai" });

// ✅ correct approach:
let jayramDb;
let mudumbaiDb;

try {
  jayramDb = openNamedDb("jayram");
  console.log('✅ [FirebaseAdmin] Connected to named Firestore DB: "jayram"');
} catch (err) {
  console.error('⚠️ [FirebaseAdmin] Failed to init "jayram" DB, falling back to default:', err);
  jayramDb = defaultDb; // safe fallback
}

try {
  mudumbaiDb = openNamedDb("mudumbai");
  console.log('✅ [FirebaseAdmin] Connected to named Firestore DB: "mudumbai"');
} catch (err) {
  console.error('⚠️ [FirebaseAdmin] Failed to init "mudumbai" DB, falling back to default:', err);
  mudumbaiDb = defaultDb; // safe fallback
}

/* ----------------
   Export bindings
----------------- */
export { admin, defaultApp, defaultAuth, defaultDb, jayramDb, mudumbaiDb };

// 🔧 fixed/updated by ChatGPT on 2025-10-18 16:20:00 – reason: support THREE Firestore DBs in one project (default, "jayram", "mudumbai"); restore missing exports; use @google-cloud/firestore for named DBs; keep Admin Auth via default app. (END)
