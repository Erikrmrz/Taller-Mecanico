const bcrypt = require('bcryptjs');
const env = require('../../config/env');
const AppError = require('../../utils/AppError');
const { ROLES } = require('../../constants/roles');
const usuariosRepository = require('./usuarios.repository');

async function obtenerOFallar(id) {
  const usuario = await usuariosRepository.findById(id);
  if (!usuario) throw new AppError(404, 'El usuario no existe', 'USUARIO_NO_ENCONTRADO');
  return usuario;
}

async function validarCorreoDisponible(email, idExcluido = null) {
  const existente = await usuariosRepository.findByEmail(email);
  if (existente && existente.id !== idExcluido) {
    throw new AppError(409, 'Ya existe un usuario con ese correo electrónico', 'CORREO_DUPLICADO');
  }
}

/** Evita dejar el sistema sin ningún administrador activo que pueda gestionar cuentas. */
async function validarQueQuedeAdministrador(usuario, { desactivar = false, nuevoRol } = {}) {
  const dejaDeSerAdminActivo = usuario.rol === ROLES.ADMINISTRADOR && usuario.activo && (desactivar || (nuevoRol && nuevoRol !== ROLES.ADMINISTRADOR));
  if (!dejaDeSerAdminActivo) return;

  const activos = await usuariosRepository.countAdministradoresActivos();
  if (activos <= 1) {
    throw new AppError(409, 'Debe existir al menos un administrador activo en el sistema', 'ULTIMO_ADMINISTRADOR');
  }
}

const listar = () => usuariosRepository.list();

const obtener = (id) => obtenerOFallar(id);

async function crear({ nombre, email, password, rol }) {
  await validarCorreoDisponible(email);
  const passwordHash = await bcrypt.hash(password, env.bcryptRounds); // RNF-005
  return usuariosRepository.create({ nombre, email, passwordHash, rol, activo: true });
}

async function actualizar(id, { nombre, email, rol, password }) {
  const usuario = await obtenerOFallar(id);
  await validarCorreoDisponible(email, id);
  await validarQueQuedeAdministrador(usuario, { nuevoRol: rol });

  const data = { nombre, email, rol };
  if (password) data.passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  return usuariosRepository.update(id, data);
}

async function desactivar(id, actor) {
  if (actor.id === id) {
    throw new AppError(409, 'No puede desactivar su propia cuenta', 'AUTO_DESACTIVACION');
  }
  const usuario = await obtenerOFallar(id);
  if (!usuario.activo) throw new AppError(409, 'La cuenta ya está desactivada', 'YA_DESACTIVADA');

  await validarQueQuedeAdministrador(usuario, { desactivar: true });
  return usuariosRepository.update(id, { activo: false });
}

async function reactivar(id) {
  const usuario = await obtenerOFallar(id);
  if (usuario.activo) throw new AppError(409, 'La cuenta ya está activa', 'YA_ACTIVA');
  return usuariosRepository.update(id, { activo: true });
}

module.exports = { listar, obtener, crear, actualizar, desactivar, reactivar };
