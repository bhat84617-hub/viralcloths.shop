const path = require('path');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack || err.message);

  if (err.name === 'ValidationError') {
    const messages = err.errors ? Object.values(err.errors).map(e => e.message) : [err.message];
    return res.status(400).json({ success: false, message: 'Validation error', errors: messages });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, message: `Duplicate value for ${field}` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const notFound = (req, res) => {
  if (req.accepts('html')) {
    res.status(404).sendFile(path.join(__dirname, '../../..', '404.html'));
  } else {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
  }
};

module.exports = { errorHandler, notFound };
