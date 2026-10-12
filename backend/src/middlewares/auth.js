const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const usuariosRepository = require('../modules/usuarios/usuarios.repository');

/**
 * Exige un JWT válido (RNF-007) y confirma en base de datos que la cuenta sigue
 * activa: así, desactivar a un usuario (RF-002) corta su sesión de inmediato y un
 * cambio de rol aplica en la siguiente petición.
 */
const authenticate = async (req, res, next) => {
  try {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new AppError(401, 'Debe iniciar sesión para continuar', 'NO_AUTENTICADO');
    }

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    } catch (e) {
      throw new AppError(401, 'La sesión no es válida o ya expiró. Inicie sesión de nuevo', 'SESION_INVALIDA');
    }

    const usuario = await usuariosRepository.findById(Number(payload.sub));
    if (!usuario || !usuario.activo) {
      throw new AppError(401, 'La cuenta no existe o fue desactivada', 'CUENTA_NO_VIGENTE');
    }

    req.user = { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
    return next();
  } catch (err) {
    return next(err);
  }
};

/** RF-002: bloquea con «acceso denegado» cualquier función no asignada al rol. */
const authorize = (...rolesPermitidos) => (req, res, next) => {
  if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
    return next(
      new AppError(403, 'Acceso denegado: su rol no tiene permiso para realizar esta operación', 'ACCESO_DENEGADO')
    );
  }
  return next();
};

module.exports = { authenticate, authorize };
