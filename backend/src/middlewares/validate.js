const AppError = require('../utils/AppError');

/** Valida req[source] contra un esquema zod y reemplaza el valor por el dato ya normalizado. */
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      campo: i.path.join('.'),
      mensaje: i.message,
    }));
    return next(new AppError(400, 'Los datos enviados no son válidos', 'VALIDACION', details));
  }
  req[source] = result.data;
  return next();
};

module.exports = validate;
