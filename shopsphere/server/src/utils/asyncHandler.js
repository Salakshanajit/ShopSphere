// Express 4 does not catch errors from async handlers by itself.
// This wrapper forwards them to the central error handler.
module.exports = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
