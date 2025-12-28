// 🔧 fixed/updated by ChatGPT on 2025-10-18 00:12:00 – reason: centralize user CRUD in MUDUMBAI DB (users collection), support role & app membership (app_users) (START)
import { mudumbaiDb } from '../config/firebaseAdmin.js';

const USERS_COLLECTION = 'users';
const APP_USERS_COLLECTION = 'app_users'; // mapping: { appId/appName, uid, role }

export const userService = {
  async getUserByUid(uid) {
    const snap = await mudumbaiDb.collection(USERS_COLLECTION).doc(uid).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },

  async ensureUserProfile({ uid, email, name = '', picture = '' }) {
    const now = new Date().toISOString();
    const ref = mudumbaiDb.collection(USERS_COLLECTION).doc(uid);
    const snap = await ref.get();

    if (!snap.exists) {
      const profile = {
        uid,
        email: email || '',
        name,
        picture,
        role: 'appUser',           // default least-privileged
        status: 'active',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      };
      await ref.set(profile);
      return { id: uid, ...profile, isNew: true };
    } else {
      const existing = snap.data();
      const updated = {
        ...existing,
        email: email || existing.email,
        name: name || existing.name,
        picture: picture || existing.picture,
        updatedAt: now,
        lastLoginAt: now,
      };
      await ref.set(updated, { merge: true });
      return { id: uid, ...updated, isNew: false };
    }
  },

  async listUserApps(uid) {
    // Optional: list app memberships for this user
    const q = await mudumbaiDb.collection(APP_USERS_COLLECTION).where('uid', '==', uid).get();
    return q.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async upsertAppMembership({ appName, uid, role }) {
    // id format: `${appName}_${uid}`
    const id = `${appName}__${uid}`;
    const now = new Date().toISOString();
    const doc = {
      appName,
      uid,
      role,
      updatedAt: now,
      ...(await mudumbaiDb.collection(APP_USERS_COLLECTION).doc(id).get()).exists
        ? {}
        : { createdAt: now },
    };
    await mudumbaiDb.collection(APP_USERS_COLLECTION).doc(id).set(doc, { merge: true });
    return { id, ...doc };
  },
};
// 🔧 fixed/updated by ChatGPT on 2025-10-18 00:12:00 (END)
