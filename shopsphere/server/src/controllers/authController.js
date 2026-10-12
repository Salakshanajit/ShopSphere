const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const { validateRegister, validateLogin } = require('../utils/validators');
const { signToken } = require('../utils/token');

const BCRYPT_ROUNDS = 10;

const publicUser = (row) => ({ id: row.id, name: row.name, email: row.email, role: row.role });

// POST /api/auth/register  - always creates a normal USER (never an admin)
exports.register = async (req, res) => {
  const { value, errors } = validateRegister(req.body);
  if (errors) throw new HttpError(400, 'Please correct the highlighted fields.', errors);

  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [value.email]);
  if (existing.length) {
    throw new HttpError(409, 'An account with this email already exists.', {
      email: 'This email is already registered.',
    });
  }

  const passwordHash = await bcrypt.hash(value.password, BCRYPT_ROUNDS);
  let insertId;
  try {
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'USER')",
      [value.name, value.email, passwordHash]
    );
    insertId = result.insertId;
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'An account with this email already exists.', {
        email: 'This email is already registered.',
      });
    }
    throw err;
  }

  const user = { id: insertId, name: value.name, email: value.email, role: 'USER' };
  res.status(201).json({ success: true, data: { token: signToken(user), user } });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { value, errors } = validateLogin(req.body);
  if (errors) throw new HttpError(400, 'Please correct the highlighted fields.', errors);

  const [rows] = await pool.execute(
    'SELECT id, name, email, role, password_hash FROM users WHERE email = ?',
    [value.email]
  );
  const row = rows[0];
  const passwordOk = row ? await bcrypt.compare(value.password, row.password_hash) : false;
  if (!passwordOk) {
    // Same message for "unknown email" and "wrong password" on purpose.
    throw new HttpError(401, 'Invalid email or password.');
  }

  const user = publicUser(row);
  res.json({ success: true, data: { token: signToken(user), user } });
};

// GET /api/auth/me
exports.me = async (req, res) => {
  res.json({ success: true, data: { user: publicUser(req.user) } });
};
