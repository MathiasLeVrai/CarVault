/**
 * Express middleware factory — validates req.body / query / params with Zod.
 * Coerced/parsed values replace the originals.
 */
function validate(schemas = {}) {
  return (req, res, next) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (error) {
      if (error?.name === 'ZodError') {
        const details = (error.errors || []).map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        const first = details[0]?.message || 'Données invalides';
        return res.status(400).json({ error: first, details });
      }
      return next(error);
    }
  };
}

module.exports = { validate };
