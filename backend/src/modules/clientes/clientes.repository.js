const prisma = require('../../lib/prisma');

const SELECT_VEHICULO_RESUMEN = { id: true, placa: true, marca: true, modelo: true, anio: true };

function construirFiltro(q) {
  if (!q) return {};
  const mayus = q.toUpperCase();
  return {
    OR: [
      { nombre: { contains: q, mode: 'insensitive' } },
      { telefono: { contains: q } },
      { email: { contains: q, mode: 'insensitive' } },
      { vehiculos: { some: { OR: [{ placa: { contains: mayus } }, { vin: { contains: mayus } }] } } },
    ],
  };
}

module.exports = {
  async list({ q, page, pageSize }) {
    const where = construirFiltro(q);
    const [items, total] = await prisma.$transaction([
      prisma.cliente.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { vehiculos: { select: SELECT_VEHICULO_RESUMEN, orderBy: { placa: 'asc' } } },
      }),
      prisma.cliente.count({ where }),
    ]);
    return { items, total };
  },

  findById: (id) =>
    prisma.cliente.findUnique({
      where: { id },
      include: {
        vehiculos: { orderBy: { placa: 'asc' } },
        registradoPor: { select: { id: true, nombre: true } },
      },
    }),

  /** Cliente y sus vehículos se guardan en una sola transacción (todo o nada). */
  createConVehiculos: (data, vehiculos) =>
    prisma.cliente.create({
      data: { ...data, vehiculos: { create: vehiculos } },
      include: { vehiculos: true },
    }),

  update: (id, data) => prisma.cliente.update({ where: { id }, data, include: { vehiculos: { orderBy: { placa: 'asc' } } } }),
};
