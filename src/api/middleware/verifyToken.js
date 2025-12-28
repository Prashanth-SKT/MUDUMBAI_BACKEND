// 🔧 fixed/updated by ChatGPT on 2025-10-18 00:12:00 – reason: add production-ready middleware to verify Firebase ID tokens from Authorization header and attach req.user for downstream controllers (START)
import { defaultAuth } from '../../config/firebaseAdmin.js';
import { AppError } from '../../utils/errorHandler.js';

export async function verifyToken(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [, token] = authHeader.split(' ');
    if (!token) {
      throw new AppError('Unauthorized: missing Bearer token', 401);
    }

    // Verify Firebase ID token
    const decoded = await defaultAuth.verifyIdToken(token);
    // Attach decoded token to request (uid, email, etc.)
    req.user = {
      uid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || '',
      picture: decoded.picture || '',
      emailVerified: !!decoded.email_verified,
      // pass entire decoded if needed
      _decoded: decoded,
    };

    return next();
  } catch (err) {
    const status = err.statusCode || err.code === 'auth/argument-error' ? 401 : 401;
    next(new AppError(err.message || 'Unauthorized', status));
  }
}
// 🔧 fixed/updated by ChatGPT on 2025-10-18 00:12:00 (END)
