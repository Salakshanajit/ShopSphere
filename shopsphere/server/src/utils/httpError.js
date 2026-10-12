// An error that carries an HTTP status code and optional per-field messages.
class HttpError extends Error {
  constructor(status, message, errors = null, code = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

module.exports = HttpError;
