const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  if (err.code === 'P2002') {
    return res.status(409).json({
      message: 'Registro duplicado. Verifique os campos únicos.',
      field: err.meta?.target,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Registro não encontrado.' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
