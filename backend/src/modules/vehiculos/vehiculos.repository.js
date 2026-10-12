const prisma = require('../../lib/prisma');

module.exports = {
  findById: (id) => prisma.vehiculo.findUnique({ where: { id }, include: { cliente: { select: { id: true, nombre: true } } } }),
  findByPlaca: (placa) => prisma.vehiculo.findUnique({ where: { placa } }),
  findByVin: (vin) => prisma.vehiculo.findUnique({ where: { vin } }),
  create: (clienteId, data) => prisma.vehiculo.create({ data: { ...data, clienteId } }),
  update: (id, data) => prisma.vehiculo.update({ where: { id }, data }),
};
