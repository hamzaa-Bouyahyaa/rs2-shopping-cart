/** Last-resort error handler: logs the error and hides internals from clients. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
}

module.exports = errorHandler;
