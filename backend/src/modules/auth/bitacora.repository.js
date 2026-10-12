const prisma = require('../../lib/prisma');

module.exports = {
  registrar: ({ usuarioId = null, email, exitoso, motivo, ip = null, userAgent = null }) =>
    prisma.bitacoraAcceso.create({ data: { usuarioId, email, exitoso, motivo, ip, userAgent } }),
};
