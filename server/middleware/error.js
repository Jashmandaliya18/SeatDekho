export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong on the server.',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
  });
};
