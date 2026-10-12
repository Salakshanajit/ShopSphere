const HttpError = require('../utils/httpError');

const DB_UNAVAILABLE_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'PROTOCOL_CONNECTION_LOST',
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR',
  'ER_CON_COUNT_ERROR',
  'ER_NO_SUCH_TABLE',
]);

function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Central error handler: every error leaves the API as the same JSON shape.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = 500;
  let message = 'Something went wrong on the server.';
  let errors = null;
  let code = null;

  if (err instanceof HttpError) {
    ({ status, message, errors, code } = err);
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body contains invalid JSON.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large.';
  } else if (err.code === 'ER_DUP_ENTRY') {
    status = 409;
    message = 'That record already exists.';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    status = 409;
    message = 'This record is linked to other data and cannot be changed this way.';
  } else if (DB_UNAVAILABLE_CODES.has(err.code)) {
    status = 503;
    message =
      'The database is not available. Check that MySQL is running, the tables exist (npm run db:init) and your .env settings are correct.';
    console.error(`[database] ${err.code}: ${err.message}`);
  } else {
    console.error(err);
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (code) body.code = code;
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
