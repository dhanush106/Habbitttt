export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.code === 11000) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid resource identifier.' });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ message: 'Request body must be valid JSON.' });
  }

  console.error(`[API] ${req.method} ${req.originalUrl} failed: ${error.message}`, error.stack);
  res.status(500).json({ message: 'An unexpected server error occurred.' });
};