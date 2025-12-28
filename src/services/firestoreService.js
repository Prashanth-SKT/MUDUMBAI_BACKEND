// /**
//  * firestoreService.js
//  * -------------------
//  * Provides Firestore CRUD operations with error handling and logs.
//  */

// import { db } from "../config/firebaseConfig.js";
// import logger from "./loggerService.js";

// // fixed/updated by ChatGPT on 2025-10-18 23:26:44 – added multi-DB routing support (jayram + mudumbai)
// import { jayramDb, mudumbaiDb } from "../config/firebaseAdmin.js"; // safely added, ensures compatibility with admin SDK instances

// // fixed/updated by ChatGPT on 2025-10-18 23:26:44 – helper to get correct DB reference
// // const getDB = (dbName = "jayram") => {
// //   if (dbName === "mudumbai") return mudumbaiDB;
// //   return jayramDB || db; // fallback to default db if admin DB not set
// // };
// // fixed/updated by ChatGPT on 2025-10-19 00:10:22 – fix variable casing (jayramDb/mudumbaiDb) and keep fallback to default db
// const getDB = (dbName = "jayram") => {
//   if (dbName === "mudumbai" && mudumbaiDb) return mudumbaiDb;
//   if (jayramDb) return jayramDb;
//   return db; // fallback (uses firebaseConfig.js) if admin DB not set
// };

// const firestoreService = {
//   async createDoc(collection, data, dbName = "jayram") {
//     try {
//       const dbRef = getDB(dbName); // fixed/updated by ChatGPT on 2025-10-18 23:26:44 – switch DB dynamically
//       const docRef = await dbRef.collection(collection).add({
//         ...data,
//         createdAt: new Date().toISOString(),
//       });
//       logger.info(`Document created in ${collection} [${dbName}]: ${docRef.id}`);
//       return { success: true, data: { id: docRef.id, ...data } };
//     } catch (error) {
//       logger.error(`Error creating document in ${collection} [${dbName}]: ${error.message}`);
//       return { success: false, error: error.message };
//     }
//   },

//   async getDocs(collection, dbName = "jayram") {
//     try {
//       const dbRef = getDB(dbName); // fixed/updated by ChatGPT on 2025-10-18 23:26:44 – added dbName routing
//       const snapshot = await dbRef.collection(collection).get();
//       const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//       logger.info(`Fetched ${docs.length} documents from ${collection} [${dbName}]`);
//       return { success: true, data: docs };
//     } catch (error) {
//       logger.error(`Error fetching from ${collection} [${dbName}]: ${error.message}`);
//       return { success: false, error: error.message };
//     }
//   },

//   async listDocs(collection, dbName = "jayram") {
//     // fixed/updated by ChatGPT on 2025-10-18 23:26:44 – keep alias with dbName param
//     return this.getDocs(collection, dbName);
//   },

//   async getDoc(collection, id, dbName = "jayram") {
//     try {
//       const dbRef = getDB(dbName);
//       const doc = await dbRef.collection(collection).doc(id).get();
//       if (!doc.exists) {
//         logger.warn(`Document ${id} not found in ${collection} [${dbName}]`);
//         return { success: false, error: "Document not found" };
//       }
//       const data = { id: doc.id, ...doc.data() };
//       logger.info(`Document ${id} fetched from ${collection} [${dbName}]`);
//       return { success: true, data };
//     } catch (error) {
//       logger.error(`Error fetching document ${id} from ${collection} [${dbName}]: ${error.message}`);
//       return { success: false, error: error.message };
//     }
//   },

//   async updateDoc(collection, id, data, dbName = "jayram") {
//     try {
//       const dbRef = getDB(dbName);
//       await dbRef.collection(collection).doc(id).update({
//         ...data,
//         updatedAt: new Date().toISOString(),
//       });
//       logger.info(`Document ${id} updated in ${collection} [${dbName}]`);
//       return { success: true, data: { id, ...data } };
//     } catch (error) {
//       logger.error(`Error updating document ${id} in ${collection} [${dbName}]: ${error.message}`);
//       return { success: false, error: error.message };
//     }
//   },

//   async upsertDoc(collection, id, data, dbName = "jayram") {
//     try {
//       const dbRef = getDB(dbName);
//       await dbRef.collection(collection).doc(id).set(
//         {
//           ...data,
//           updatedAt: new Date().toISOString(),
//         },
//         { merge: true }
//       );
//       logger.info(`Document ${id} upserted in ${collection} [${dbName}]`);
//       return { success: true, data: { id, ...data } };
//     } catch (error) {
//       // logger.error(`Error upserting document ${id} in ${collection} [${dbName}]: ${error.message}`);
//       // fixed/updated by ChatGPT on 2025-10-19 00:12:48 – include error.code and stack for named-DB diagnostics
//       logger.error(
//         `Error upserting document ${id} in ${collection} [${dbName}]: ${error.message} ` +
//         (error.code ? `(code=${error.code}) ` : "") +
//         (error.stack ? `stack=${error.stack}` : "")
//       );
//       return { success: false, error: error.message };
//     }
//   },

//   async deleteDoc(collection, id, dbName = "jayram") {
//     try {
//       const dbRef = getDB(dbName);
//       await dbRef.collection(collection).doc(id).delete();
//       logger.info(`Document ${id} deleted from ${collection} [${dbName}]`);
//       return { success: true, data: { id } };
//     } catch (error) {
//       logger.error(`Error deleting document ${id} in ${collection} [${dbName}]: ${error.message}`);
//       return { success: false, error: error.message };
//     }
//   },

//   // ---------------------------------------------------------------
//   // fixed/updated by ChatGPT on 2025-10-18 23:26:44 – new helper for query-based reads
//   async queryDocs(collection, field, op, value, dbName = "jayram") {
//     try {
//       const dbRef = getDB(dbName);
//       const querySnapshot = await dbRef.collection(collection).where(field, op, value).get();
//       const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//       logger.info(`Queried ${docs.length} docs from ${collection} [${dbName}] where ${field}${op}${value}`);
//       return { success: true, data: docs };
//     } catch (error) {
//       logger.error(`Error querying ${collection} [${dbName}]: ${error.message}`);
//       return { success: false, error: error.message };
//     }
//   },

//   // fixed/updated by ChatGPT on 2025-10-18 23:26:44 – helper to fetch multiple docs by IDs
//   async getDocsByIds(collection, ids = [], dbName = "jayram") {
//     try {
//       if (!ids || ids.length === 0) return { success: true, data: [] };
//       const dbRef = getDB(dbName);
//       const promises = ids.map(id => dbRef.collection(collection).doc(id).get());
//       const snapshots = await Promise.all(promises);
//       const data = snapshots.filter(d => d.exists).map(d => ({ id: d.id, ...d.data() }));
//       logger.info(`Fetched ${data.length}/${ids.length} docs by ID from ${collection} [${dbName}]`);
//       return { success: true, data };
//     } catch (error) {
//       logger.error(`Error fetching docs by IDs from ${collection} [${dbName}]: ${error.message}`);
//       return { success: false, error: error.message };
//     }
//   },
//   // ---------------------------------------------------------------
// };

// export default firestoreService;
/**
 * firestoreService.js
 * -------------------
 * Provides Firestore CRUD operations with error handling and logs.
 * fixed/updated by ChatGPT on 2025-10-21 14:15:00 – added getCollectionFromFirestore() for universal collection fetch.
 */

import { db } from "../config/firebaseConfig.js";
import logger from "./loggerService.js";
import { jayramDb, mudumbaiDb } from "../config/firebaseAdmin.js";

// Select correct Firestore instance dynamically
const getDB = (dbName = "jayram") => {
  if (dbName === "mudumbai" && mudumbaiDb) return mudumbaiDb;
  if (jayramDb) return jayramDb;
  return db; // fallback to client SDK
};

const firestoreService = {
  async createDoc(collection, data, dbName = "jayram") {
    try {
      const dbRef = getDB(dbName);
      const docRef = await dbRef.collection(collection).add({
        ...data,
        createdAt: new Date().toISOString(),
      });
      logger.info(`Document created in ${collection} [${dbName}]: ${docRef.id}`);
      return { success: true, data: { id: docRef.id, ...data } };
    } catch (error) {
      logger.error(`Error creating document in ${collection} [${dbName}]: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  async getDocs(collection, dbName = "jayram") {
    try {
      const dbRef = getDB(dbName);
      const snapshot = await dbRef.collection(collection).get();
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      logger.info(`Fetched ${docs.length} documents from ${collection} [${dbName}]`);
      return { success: true, data: docs };
    } catch (error) {
      logger.error(`Error fetching from ${collection} [${dbName}]: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  async listDocs(collection, dbName = "jayram") {
    return this.getDocs(collection, dbName);
  },

  async getDoc(collection, id, dbName = "jayram") {
    try {
      const dbRef = getDB(dbName);
      const doc = await dbRef.collection(collection).doc(id).get();
      if (!doc.exists) {
        logger.warn(`Document ${id} not found in ${collection} [${dbName}]`);
        return { success: false, error: "Document not found" };
      }
      const data = { id: doc.id, ...doc.data() };
      logger.info(`Document ${id} fetched from ${collection} [${dbName}]`);
      return { success: true, data };
    } catch (error) {
      logger.error(`Error fetching document ${id} from ${collection} [${dbName}]: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  async updateDoc(collection, id, data, dbName = "jayram") {
    try {
      const dbRef = getDB(dbName);
      await dbRef.collection(collection).doc(id).update({
        ...data,
        updatedAt: new Date().toISOString(),
      });
      logger.info(`Document ${id} updated in ${collection} [${dbName}]`);
      return { success: true, data: { id, ...data } };
    } catch (error) {
      logger.error(`Error updating document ${id} in ${collection} [${dbName}]: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  async upsertDoc(collection, id, data, dbName = "jayram") {
    try {
      const dbRef = getDB(dbName);
      await dbRef.collection(collection).doc(id).set(
        {
          ...data,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      logger.info(`Document ${id} upserted in ${collection} [${dbName}]`);
      return { success: true, data: { id, ...data } };
    } catch (error) {
      logger.error(
        `Error upserting document ${id} in ${collection} [${dbName}]: ${error.message} ` +
          (error.code ? `(code=${error.code}) ` : "") +
          (error.stack ? `stack=${error.stack}` : "")
      );
      return { success: false, error: error.message };
    }
  },

  async deleteDoc(collection, id, dbName = "jayram") {
    try {
      const dbRef = getDB(dbName);
      await dbRef.collection(collection).doc(id).delete();
      logger.info(`Document ${id} deleted from ${collection} [${dbName}]`);
      return { success: true, data: { id } };
    } catch (error) {
      logger.error(`Error deleting document ${id} in ${collection} [${dbName}]: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  async queryDocs(collection, field, op, value, dbName = "jayram") {
    try {
      const dbRef = getDB(dbName);
      const querySnapshot = await dbRef.collection(collection).where(field, op, value).get();
      const docs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      logger.info(`Queried ${docs.length} docs from ${collection} [${dbName}] where ${field}${op}${value}`);
      return { success: true, data: docs };
    } catch (error) {
      logger.error(`Error querying ${collection} [${dbName}]: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  async getDocsByIds(collection, ids = [], dbName = "jayram") {
    try {
      if (!ids || ids.length === 0) return { success: true, data: [] };
      const dbRef = getDB(dbName);
      const promises = ids.map((id) => dbRef.collection(collection).doc(id).get());
      const snapshots = await Promise.all(promises);
      const data = snapshots.filter((d) => d.exists).map((d) => ({ id: d.id, ...d.data() }));
      logger.info(`Fetched ${data.length}/${ids.length} docs by ID from ${collection} [${dbName}]`);
      return { success: true, data };
    } catch (error) {
      logger.error(`Error fetching docs by IDs from ${collection} [${dbName}]: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  // ---------------------------------------------------------------
  // ✅ NEW: Universal helper for collection dropdown (used by CollectionDropdown.jsx)
  async getCollectionFromFirestore(dbName = "jayram", collectionPath) {
    try {
      const dbRef = getDB(dbName);
      logger.info(`[firestoreService] Reading from ${dbName}:${collectionPath}`);

      const snapshot = await dbRef.collection(collectionPath).get();
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      logger.info(`[firestoreService] Fetched ${data.length} records from ${collectionPath} [${dbName}]`);
      return data;
    } catch (err) {
      logger.error(`[firestoreService] Failed to fetch collection ${collectionPath} [${dbName}]: ${err.message}`);
      return [];
    }
  },
  // ---------------------------------------------------------------
};

export default firestoreService;
