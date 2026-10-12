const AppError = require('../../utils/AppError');
const vehiculosRepository = require('./vehiculos.repository');
const clientesRepository = require('../clientes/clientes.repository');

/** RF-003: no se permite repetir una misma placa ni un mismo VIN. */
async function validarPlacaYVinDisponibles({ placa, vin }, idExcluido = null) {
  const porPlaca = await vehiculosRepository.findByPlaca(placa);
  if (porPlaca && porPlaca.id !== idExcluido) {
    throw new AppError(409, `La placa ${placa} ya está registrada en otro vehículo`, 'PLACA_DUPLICADA');
  }
  const porVin = await vehiculosRepository.findByVin(vin);
  if (porVin && porVin.id !== idExcluido) {
    throw new AppError(409, `El VIN ${vin} ya está registrado en otro vehículo`, 'VIN_DUPLICADO');
  }
}

async function obtener(id) {
  const vehiculo = await vehiculosRepository.findById(id);
  if (!vehiculo) throw new AppError(404, 'El vehículo no existe', 'VEHICULO_NO_ENCONTRADO');
  return vehiculo;
}

async function agregarACliente(clienteId, data) {
  const cliente = await clientesRepository.findById(clienteId);
  if (!cliente) throw new AppError(404, 'El cliente no existe', 'CLIENTE_NO_ENCONTRADO');

  await validarPlacaYVinDisponibles(data);
  return vehiculosRepository.create(clienteId, data);
}

async function actualizar(id, data) {
  await obtener(id);
  await validarPlacaYVinDisponibles(data, id);
  return vehiculosRepository.update(id, data);
}

module.exports = { obtener, agregarACliente, actualizar, validarPlacaYVinDisponibles };
