const AppError = require('../../utils/AppError');
const clientesRepository = require('./clientes.repository');
const vehiculosService = require('../vehiculos/vehiculos.service');

async function listar({ q, page = 1, pageSize = 10 } = {}) {
  const { items, total } = await clientesRepository.list({ q, page, pageSize });
  return { items, total, page, pageSize };
}

async function obtener(id) {
  const cliente = await clientesRepository.findById(id);
  if (!cliente) throw new AppError(404, 'El cliente no existe', 'CLIENTE_NO_ENCONTRADO');
  return cliente;
}

/** RF-003 + RD-001: alta de cliente con consentimiento del aviso de privacidad y vehículos opcionales. */
async function crear(datos, usuario) {
  const { consentimientoAvisoPrivacidad, vehiculos = [], ...cliente } = datos;

  if (consentimientoAvisoPrivacidad !== true) {
    throw new AppError(400, 'Debe confirmar el consentimiento del aviso de privacidad antes de guardar el cliente', 'CONSENTIMIENTO_REQUERIDO');
  }

  for (const vehiculo of vehiculos) {
    // eslint-disable-next-line no-await-in-loop
    await vehiculosService.validarPlacaYVinDisponibles(vehiculo);
  }

  return clientesRepository.createConVehiculos(
    {
      ...cliente,
      consentimientoPrivacidad: true,
      fechaConsentimiento: new Date(),
      registradoPorId: usuario.id,
    },
    vehiculos
  );
}

async function actualizar(id, datos) {
  await obtener(id);
  return clientesRepository.update(id, datos);
}

module.exports = { listar, obtener, crear, actualizar };
