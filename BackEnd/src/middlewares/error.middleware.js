export function notFoundHandler(req, res) {
  return res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
  });
}

export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  if (status >= 500) {
    console.error(err);
  }

  return res.status(status).json({
    status: 'error',
    message,
    ...(err.details ? { details: err.details } : {}),
  });
}

