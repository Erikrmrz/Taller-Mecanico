const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const AppError = require('../../utils/AppError');
const usuariosRepository = require('../usuarios/usuarios.repository');
const bitacoraRepository = require('./bitacora.repository');

// Hash de relleno para que el tiempo de respuesta sea parecido exista o no el correo.
let hashDeRelleno;
const obtenerHashDeRelleno = () => {
  if (!hashDeRelleno) hashDeRelleno = bcrypt.hashSync('relleno-para-igualar-tiempos', env.bcryptRounds);
  return hashDeRelleno;
};

const aPublico = ({ id, nombre, email, rol, activo }) => ({ id, nombre, email, rol, activo });

/**
 * RF-001: inicia sesión con correo y contraseña.
 * RNF-007: cada intento (exitoso o fallido) queda en la bitácora de accesos.
 */
async function login({ email, password }, contexto = {}) {
  const usuario = await usuariosRepository.findByEmail(email);
  const passwordCorrecta = await bcrypt.compare(password, usuario ? usuario.passwordHash : obtenerHashDeRelleno());

  const registrar = (exitoso, motivo) =>
    bitacoraRepository.registrar({
      usuarioId: usuario ? usuario.id : null,
      email,
      exitoso,
      motivo,
      ip: contexto.ip,
      userAgent: contexto.userAgent,
    });

  if (!usuario || !passwordCorrecta) {
    await registrar(false, 'CREDENCIALES_INVALIDAS');
    throw new AppError(401, 'Correo o contraseña incorrectos', 'CREDENCIALES_INVALIDAS');
  }

  // Solo se revela que la cuenta está desactivada si la contraseña era correcta.
  if (!usuario.activo) {
    await registrar(false, 'CUENTA_DESACTIVADA');
    throw new AppError(403, 'La cuenta está desactivada. Contacte al administrador', 'CUENTA_DESACTIVADA');
  }

  await registrar(true, 'INICIO_DE_SESION');

  const token = jwt.sign({ rol: usuario.rol }, env.jwtSecret, {
    subject: String(usuario.id),
    expiresIn: env.jwtExpiresIn,
    algorithm: 'HS256',
  });

  return { token, usuario: aPublico(usuario) };
}

module.exports = { login };
