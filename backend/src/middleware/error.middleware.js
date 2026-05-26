/**
 * Middleware de gestion centralisée des erreurs
 */
const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.message);

  // Les erreurs 5xx sont capturées par Sentry.setupExpressErrorHandler (instrument.js)

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Cette ressource existe déjà',
      field: err.meta?.target,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Ressource non trouvée',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';

  res.status(statusCode).json({
    error: message,
    code: err.appCode || undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Classe d'erreur personnalisée avec code HTTP
 */
class AppError extends Error {
  constructor(message, statusCode, appCode) {
    super(message);
    this.statusCode = statusCode;
    this.appCode = appCode;
  }
}

module.exports = { errorHandler, AppError };
