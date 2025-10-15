// Centralized error handler to avoid leaking stack traces in responses.
// Attach with app.use after routes.
export function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message });
}
