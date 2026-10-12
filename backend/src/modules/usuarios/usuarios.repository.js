const prisma = require('../../lib/prisma');

// Nunca se devuelve el hash fuera de findByEmail (que solo usa el login).
const SELECT_PUBLICO = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
};

module.exports = {
  findById: (id) => prisma.usuario.findUnique({ where: { id }, select: SELECT_PUBLICO }),

  /** Incluye passwordHash: uso exclusivo del login y de la validación de correo duplicado. */
  findByEmail: (email) => prisma.usuario.findUnique({ where: { email } }),

  list: () => prisma.usuario.findMany({ select: SELECT_PUBLICO, orderBy: [{ activo: 'desc' }, { nombre: 'asc' }] }),

  create: (data) => prisma.usuario.create({ data, select: SELECT_PUBLICO }),

  update: (id, data) => prisma.usuario.update({ where: { id }, data, select: SELECT_PUBLICO }),

  countAdministradoresActivos: () => prisma.usuario.count({ where: { rol: 'ADMINISTRADOR', activo: true } }),
};
