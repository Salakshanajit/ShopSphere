const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const { verifyToken } = require('../utils/token');

// Requires a valid "Authorization: Bearer <token>" header and loads the user.
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Authentication required. Please log in.', null, 'NO_TOKEN');
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new HttpError(401, 'Your session has expired. Please log in again.', null, 'TOKEN_EXPIRED');
      }
      throw new HttpError(401, 'Invalid authentication token. Please log in again.', null, 'INVALID_TOKEN');
    }

    // Always read the role from the database so role changes take effect immediately.
    const [rows] = await pool.execute(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [Number(payload.sub)]
    );
    if (!rows.length) {
      throw new HttpError(401, 'This account no longer exists.', null, 'INVALID_TOKEN');
    }
    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

// Must be used after authenticate().
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'ADMIN') return next();
  return next(new HttpError(403, 'Admin access required.', null, 'FORBIDDEN'));
}

module.exports = { authenticate, requireAdmin };
