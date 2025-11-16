const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);


  let error = {
    statusCode: err.statusCode || 500,
    message: err.message || 'Internal Server Error'
  };


  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    error = {
      statusCode: 409,
      message: 'Resource already exists'
    };
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    error = {
      statusCode: 400,
      message: 'Invalid reference to related resource'
    };
  }


  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Invalid token'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token expired'
    };
  }


  if (err.name === 'ValidationError') {
    error = {
      statusCode: 400,
      message: err.message
    };
  }


  if (err.name === 'CastError') {
    error = {
      statusCode: 400,
      message: 'Invalid resource ID format'
    };
  }

  res.status(error.statusCode).json({
    success: false,
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};


const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};
