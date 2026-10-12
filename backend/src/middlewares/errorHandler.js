const AppError = require('../utils/AppError');

const CAMPOS_UNICOS = {
  placa: 'La placa ya está registrada en otro vehículo',
  vin: 'El VIN ya está registrado en otro vehículo',
  email: 'El correo electrónico ya está registrado',
};

const notFound = (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada', code: 'NO_ENCONTRADO' });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, code: err.code, details: err.details });
  }

  // Carrera entre dos peticiones simultáneas: la restricción UNIQUE de la BD es la última defensa.
  if (err && err.code === 'P2002') {
    const campo = (err.meta && err.meta.target && [].concat(err.meta.target).find((t) => CAMPOS_UNICOS[t])) || null;
    return res.status(409).json({
      message: (campo && CAMPOS_UNICOS[campo]) || 'Ya existe un registro con esos datos',
      code: 'DUPLICADO',
    });
  }

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El cuerpo de la petición no es un JSON válido', code: 'JSON_INVALIDO' });
  }

  console.error(err);
  return res.status(500).json({ message: 'Ocurrió un error interno del servidor', code: 'ERROR_INTERNO' });
};

module.exports = { errorHandler, notFound };
